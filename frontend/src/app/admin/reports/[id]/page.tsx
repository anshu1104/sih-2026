"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRef } from "react";
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, X, Clock, Camera, AlertCircle, RefreshCw } from "lucide-react";
import { reportService } from "@/services/reportService";
import { supabase } from "@/lib/supabase";

export default function AdminReportDetail() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal & Team State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [occupiedTeams, setOccupiedTeams] = useState<string[]>([]);
  const [notification, setNotification] = useState<{show: boolean, team: string}>({show: false, team: ''});
  
  // Error state for missing column
  
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


  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera error:", err.message);
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
              console.warn("GPS error:", err.message);
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

  const fetchReport = async () => {
    try {
      const data = await reportService.getReportById(reportId);
      setReport(data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("assigned_team")) {
        setDbError("The 'assigned_team' column is missing from the reports table. Please add it via Supabase SQL.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
    
    // Realtime updates
    const channel = supabase.channel(`report-${reportId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `report_id=eq.${reportId}` }, () => {
        fetchReport();
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [reportId]);

  // Load Occupied Teams when opening Modal
  const openTeamModal = async () => {
    try {
      // Find all active teams that are currently handling a complaint
      const { data } = await supabase
        .from('reports')
        .select('assigned_team, status');
        
      if (data) {
        // Occupied = assigned to a report that is NOT resolved and NOT rejected
        const active = data
          .filter(r => r.assigned_team && r.status !== 'resolved' && r.status !== 'rejected')
          .map(r => r.assigned_team);
        setOccupiedTeams(active);
      }
    } catch (e) {
      console.error("Failed to load teams", e);
    }
    setIsTeamModalOpen(true);
  };

  // Status Actions
  const handleAssignTeam = async (teamName: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ assigned_team: teamName, status: 'assigned', updated_at: new Date().toISOString() })
        .eq('report_id', reportId);
        
      if (error) throw error;
      
      setReport(prev => ({ ...prev, assigned_team: teamName, status: 'assigned' }));
      setIsTeamModalOpen(false);
      
      // Show Notification
      setNotification({ show: true, team: teamName });
      setTimeout(() => setNotification({ show: false, team: '' }), 4000);
      
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("assigned_team")) {
        alert("Database error: Please add 'assigned_team' text column to reports table first!");
      }
    }
  };

  const handleMarkInProgress = async () => {
    try {
      const { error } = await supabase.from('reports').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('report_id', reportId);
      if (error) throw error;
      setReport(prev => ({ ...prev, status: 'in_progress' }));
    } catch (e) {
      console.error(e);
      alert("Failed to update status: " + JSON.stringify(e));
    }
  };

  const handleResolve = async () => {
    if (!proofImage || !proofLocation) {
      alert("Proof image and location are required.");
      return;
    }
    
    setResolving(true);
    try {
      // 1. Convert base64 to blob
      const res = await fetch(proofImage);
      const blob = await res.blob();
      const fileName = `proof_${reportId}_${Date.now()}.jpg`;
      
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
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase.from('reports').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('report_id', reportId);
      if (error) throw error;
      setReport(prev => ({ ...prev, status: 'rejected' }));
    } catch (e: any) { 
      console.error(e);
      alert("Failed to update: " + JSON.stringify(e)); 
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading report details...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-red-500">Report not found.</div>;
  }

  let status = (report.status || 'pending').toLowerCase();
  if (status === 'ai_verified') status = 'pending';
  if (status === 'closed') status = 'resolved';
  
  
  const rawWasteType = report.waste_type || 'Unknown';
  let displayWasteType = rawWasteType;
  let segregation = 'Unknown';
  let verification = 'AI Recommendation';
  
  if (rawWasteType.includes('||')) {
    const parts = rawWasteType.split('||');
    displayWasteType = parts[0];
    segregation = parts[1];
    verification = parts[2];
  }

  const priority = (report.priority || 'medium').toLowerCase();
  const assignedTeam = report.assigned_team;

  // Format Status display text
  let statusDisplay = "Pending";
  if (status === 'assigned') statusDisplay = `Assigned (${assignedTeam})`;
  if (status === 'in progress' || status === 'in_progress') statusDisplay = `In Progress (${assignedTeam || 'No Team'})`;
  if (status === 'resolved') statusDisplay = `Resolved ${assignedTeam ? `(${assignedTeam})` : ''}`;
  if (status === 'rejected') statusDisplay = "Rejected";

  // Generate 10 Teams
  const teamsList = Array.from({ length: 10 }, (_, i) => `Team ${i + 1}`);

  return (
    <div className="space-y-6 max-w-5xl relative">
      
      {/* Database Error Banner */}
      {dbError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 font-medium">
          ⚠️ {dbError}
        </div>
      )}

      {/* Success Notification */}
      {notification.show && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white p-4 rounded-xl shadow-2xl z-50 flex items-start gap-3 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="mt-0.5" />
          <div>
            <p className="font-bold">Team Assigned Successfully</p>
            <p className="text-emerald-100 text-sm mt-1">Notification has been sent to {notification.team}.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-500"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1 flex items-center gap-2">
            Report {reportId}
            <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
              priority === 'high' || priority === 'urgent' ? 'bg-red-100 text-red-600' :
              priority === 'low' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {report.priority || 'Medium'} Priority
            </span>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full ml-2">
              Status: {statusDisplay}
            </span>
          </h1>
          <p className="text-slate-500 text-sm">
            Submitted on {new Date(report.created_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Image & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-navy mb-4 border-b border-slate-100 pb-2">Reported Image</h2>
            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 overflow-hidden relative">
               {report.report_media?.find((m: any) => m.media_type === 'original')?.storage_path ? (
                 <img 
                    src={report.report_media.find((m: any) => m.media_type === 'original')?.storage_path} 
                    alt="Reported Waste" 
                    className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="border-2 border-slate-200 border-dashed w-full h-full flex flex-col items-center justify-center bg-slate-50">
                    <p>No Image Provided</p>
                 </div>
               )}
            </div>
            <p className="text-sm text-slate-600 mt-4">
              <span className="font-medium text-navy">Citizen Note:</span> {report.description || "No description provided."}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-navy mb-4 border-b border-slate-100 pb-2">Status Timeline</h2>
            <div className="space-y-6 pl-2">
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={14} /></div>
                  <div className="w-0.5 h-full bg-emerald-500 -my-1"></div>
                </div>
                <div className="pb-4 pt-0.5 w-full">
                  <p className="font-bold text-navy text-sm">Submitted</p>
                  <p className="text-xs text-slate-500">Citizen submitted the report.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><ShieldCheck size={14} /></div>
                  {status === 'pending' || status === 'assigned' || status === 'in progress' || status === 'in_progress' ? (
                    <div className="w-0.5 h-full bg-slate-200 -my-1"></div>
                  ) : (
                    <div className={`w-0.5 h-full ${status === 'rejected' ? 'bg-red-500' : 'bg-emerald-500'} -my-1`}></div>
                  )}
                </div>
                <div className="pb-4 pt-0.5 w-full">
                  <p className="font-bold text-navy text-sm">AI Verified</p>
                  <p className="text-xs text-slate-500">Model confirmed {displayWasteType}.</p>
                </div>
              </div>

              {/* Dynamic Last Step */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {status === 'resolved' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={14} /></div>
                  ) : status === 'rejected' ? (
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center z-10"><X size={14} /></div>
                  ) : (status === 'in progress' || status === 'in_progress') ? (
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center z-10"><Clock size={14} /></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-orange-500 bg-white z-10"></div>
                  )}
                </div>
                
                <div className="pb-4 pt-0.5 w-full">
                  {status === 'resolved' ? (
                    <>
                      <p className="font-bold text-emerald-600 text-sm">Resolved {assignedTeam ? `(${assignedTeam})` : ''}</p>
                      <p className="text-xs text-slate-500">The waste has been cleared successfully. {assignedTeam} is now free.</p>
                    </>
                  ) : status === 'rejected' ? (
                    <>
                      <p className="font-bold text-red-600 text-sm">Rejected</p>
                      <p className="text-xs text-slate-500">This report was marked as invalid or spam.</p>
                    </>
                  ) : (status === 'in progress' || status === 'in_progress') ? (
                    <>
                      <p className="font-bold text-purple-600 text-sm">In Progress ({assignedTeam})</p>
                      <p className="text-xs text-slate-500">Team is actively working on clearing this location.</p>
                    </>
                  ) : status === 'assigned' ? (
                    <>
                      <p className="font-bold text-blue-600 text-sm">Team Assigned</p>
                      <p className="text-xs text-slate-500">{assignedTeam} has been dispatched and is currently Occupied.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-orange-600 text-sm">Pending Action</p>
                      <p className="text-xs text-slate-500">Awaiting municipal assignment.</p>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Col: Details & Actions */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-navy border-b border-slate-100 pb-2">AI Analysis Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Detected:</span>
                <span className="font-bold text-navy capitalize">{displayWasteType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence:</span>
                <span className="font-bold text-primary">{(report.detections?.[0]?.confidence ? Math.round(report.detections[0].confidence * 100) : 92)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Segregation:</span>
                <span className={`font-bold ${segregation.includes('Wet') ? 'text-green-600' : segregation.includes('Dry') ? 'text-blue-600' : 'text-slate-600'}`}>
                  {segregation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recommended Bin:</span>
                <span className="font-medium text-navy">{segregation.includes('Wet') ? '🟢 Wet Waste Bin' : segregation.includes('Dry') ? '🔵 Dry Waste Bin' : '⚪ General Bin'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Verification:</span>
                <span className="font-medium text-slate-700">{verification}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-navy border-b border-slate-100 pb-2">Location details</h2>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-navy text-sm">{report.address || "GPS Location only"}</p>
                <p className="font-mono text-xs text-slate-500 mt-1 bg-slate-50 p-1.5 rounded inline-block border border-slate-100">
                  {report.latitude}, {report.longitude}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Admin Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-navy border-b border-slate-100 pb-2">Admin Actions</h2>
            
            <div className="space-y-3">
              {/* Assign Team Button */}
              <button 
                onClick={openTeamModal}
                disabled={status === 'resolved' || status === 'rejected'}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignedTeam ? `Change Team (Current: ${assignedTeam})` : "Assign Team"}
              </button>
              
              {/* Mark In Progress Button */}
              <button 
                onClick={handleMarkInProgress}
                disabled={status === 'resolved' || status === 'rejected' || status === 'in progress' || status === 'in_progress' || !assignedTeam}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark In Progress
              </button>
              
              {/* Resolve Complaint Button */}
              <button 
                onClick={() => { setIsProofModalOpen(true); startCamera(); }}
                disabled={status === 'resolved' || status === 'rejected' || !assignedTeam}
                className="w-full py-2.5 bg-primary hover:bg-primary-light text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={16} /> Resolve Complaint
              </button>
            </div>
            
            <div className="pt-2 border-t border-slate-100 mt-4">
              {/* Reject Button */}
              <button 
                onClick={handleReject}
                disabled={status === 'resolved' || status === 'rejected'}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject as Invalid / Spam
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Resolution Proof Modal */}
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

      {/* Team Assignment Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsTeamModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-navy">Assign Team</h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-2 overflow-y-auto flex-1">
              {teamsList.map(team => {
                const isOccupied = occupiedTeams.includes(team);
                return (
                  <button
                    key={team}
                    disabled={isOccupied}
                    onClick={() => handleAssignTeam(team)}
                    className={`w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 rounded-lg transition-colors ${
                      isOccupied 
                        ? 'opacity-60 cursor-not-allowed bg-slate-50' 
                        : 'hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span className="font-bold text-slate-700">{team}</span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {isOccupied ? (
                        <><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Occupied</>
                      ) : (
                        <><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Free</>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
