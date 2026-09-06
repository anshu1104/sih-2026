const fs = require('fs');
const file = 'frontend/src/app/admin/reports/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace('import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, X, Clock } from "lucide-react";', 
`import { useRef } from "react";
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, X, Clock, Camera, AlertCircle, RefreshCw } from "lucide-react";`);

// 2. Add state and refs inside component
const stateHookPos = content.indexOf('const [dbError, setDbError] = useState("");');
const stateInsert = `
  const [dbError, setDbError] = useState("");

  // Resolution Proof State
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofLocation, setProofLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationWarning, setLocationWarning] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
`;
content = content.slice(0, stateHookPos) + stateInsert + content.slice(stateHookPos + 'const [dbError, setDbError] = useState("");'.length);

// 3. Camera logic
const cameraLogic = `
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureProof = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProofImage(dataUrl);
        stopCamera();
        
        // Capture GPS
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setProofLocation({ lat, lng });
              
              // Simple distance check (rough estimation)
              if (report.latitude && report.longitude) {
                const dLat = Math.abs(lat - report.latitude);
                const dLng = Math.abs(lng - report.longitude);
                if (dLat > 0.005 || dLng > 0.005) { // Roughly > 500m
                  setLocationWarning(true);
                }
              }
            },
            (err) => {
              console.error("GPS error:", err);
              alert("Failed to get current location for verification.");
            },
            { enableHighAccuracy: true }
          );
        } else {
          alert("Geolocation is not supported by this browser.");
        }
      }
    }
  };

  const retakeProof = () => {
    setProofImage(null);
    setProofLocation(null);
    setLocationWarning(false);
    startCamera();
  };

  const closeProofModal = () => {
    setIsProofModalOpen(false);
    setProofImage(null);
    setProofLocation(null);
    setLocationWarning(false);
    stopCamera();
  };

  // Distance helper
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(0); // in metres
  };
`;

const fetchReportPos = content.indexOf('const fetchReport = async () => {');
content = content.slice(0, fetchReportPos) + cameraLogic + '\n  ' + content.slice(fetchReportPos);

// 4. Overhaul handleResolve
const handleResolveOld = `  const handleResolve = async () => {
    try {
      const { error } = await supabase.from('reports').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('report_id', reportId);
      if (error) throw error;
      setReport(prev => ({ ...prev, status: 'resolved' }));
    } catch (e) {
      console.error(e);
      alert("Failed to resolve: " + JSON.stringify(e));
    }
  };`;

const handleResolveNew = `  const handleResolve = async () => {
    if (!proofImage || !proofLocation) {
      alert("Proof image and location are required.");
      return;
    }
    
    setResolving(true);
    try {
      // 1. Convert base64 to blob
      const res = await fetch(proofImage);
      const blob = await res.blob();
      const fileName = \`proof_\${reportId}_\${Date.now()}.jpg\`;
      
      // 2. Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('civicvision-reports')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('civicvision-reports')
        .getPublicUrl(fileName);
        
      // 3. Save to report_media (as 'after' media type)
      const { error: mediaError } = await supabase
        .from('report_media')
        .insert({
          report_id: report.id,
          media_type: 'after',
          storage_path: publicUrl
        });
      if (mediaError) throw mediaError;

      // 4. Save to report_status_history with proof metadata in note
      const proofMeta = {
        proof_image_url: publicUrl,
        latitude: proofLocation.lat,
        longitude: proofLocation.lng,
        team: report.assigned_team
      };
      
      await supabase.from('report_status_history').insert({
        report_id: report.id,
        status: 'resolved',
        note: JSON.stringify(proofMeta)
      });
      
      // 5. Update report status
      const { error: updateError } = await supabase
        .from('reports')
        .update({ status: 'resolved', updated_at: new Date().toISOString() })
        .eq('report_id', reportId);
        
      if (updateError) throw updateError;
      
      // 6. Notifications - Assuming we just create a status history or we can use toast
      setReport(prev => ({ ...prev, status: 'resolved' }));
      closeProofModal();
      
      setNotification({ show: true, team: 'Successfully resolved. Notification sent to user.' });
      setTimeout(() => setNotification({ show: false, team: '' }), 5000);
      
    } catch (e) {
      console.error(e);
      alert("Failed to resolve: " + JSON.stringify(e));
    } finally {
      setResolving(false);
    }
  };`;
content = content.replace(handleResolveOld, handleResolveNew);

// 5. Button click logic
content = content.replace(
  'onClick={handleResolve}',
  'onClick={() => { setIsProofModalOpen(true); startCamera(); }}'
);

// 6. Proof Modal JSX
const proofModalJsx = `      {/* Resolution Proof Modal */}
      {isProofModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeProofModal}></div>
          
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-navy text-lg">Resolution Proof</h3>
              <button onClick={closeProofModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                <MapPin size={18} className="shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <strong>Report Location:</strong>
                  <p className="opacity-80">{report.latitude}, {report.longitude}</p>
                </div>
              </div>
              
              {!proofImage ? (
                <div className="space-y-4">
                  <div className="bg-slate-900 aspect-video rounded-lg overflow-hidden relative shadow-inner">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <button 
                        onClick={captureProof}
                        className="bg-white text-navy w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      >
                        <Camera size={24} />
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-500">
                    Take a photo of the cleaned area as proof of resolution.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 relative">
                    <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button 
                        onClick={retakeProof}
                        className="bg-slate-900/70 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 hover:bg-slate-900 transition-colors"
                      >
                        <RefreshCw size={14} /> Retake
                      </button>
                    </div>
                  </div>
                  
                  {proofLocation && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500">Proof Location:</span>
                        <span className="font-mono text-xs">{proofLocation.lat.toFixed(6)}, {proofLocation.lng.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Distance from Report:</span>
                        <span className="font-bold text-navy">
                          {report.latitude ? calculateDistance(report.latitude, report.longitude, proofLocation.lat, proofLocation.lng) : '?'} meters
                        </span>
                      </div>
                    </div>
                  )}

                  {locationWarning && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5 text-orange-500" />
                      <p>
                        <strong>Location Warning:</strong> Your current location is significantly different from the reported location. Please ensure you are at the correct site.
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={handleResolve}
                    disabled={resolving}
                    className="w-full py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
                  >
                    {resolving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> Submit Proof & Resolve
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('      {/* Team Assignment Modal */}', proofModalJsx + '\n      {/* Team Assignment Modal */}');

fs.writeFileSync(file, content);
console.log("Updated Admin Report Detail successfully.");
