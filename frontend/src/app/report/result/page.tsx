"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { ArrowLeft, CheckCircle2, MapPin, AlertTriangle } from "lucide-react";

export default function AIResultPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  
  const [detections, setDetections] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priority, setPriority] = useState('Normal');
  const [description, setDescription] = useState('');

  
  const [segregationOverride, setSegregationOverride] = useState<string | null>(null);
  
  const dryCategories = ['plastic', 'metal', 'glass', 'paper', 'cardboard', 'e-waste', 'rubber', 'fabric', 'can', 'bottle'];
  const wetCategories = ['food', 'vegetable', 'fruit', 'organic', 'garden', 'plant', 'leaves'];

  const getSegregation = (category: string) => {
    const c = category.toLowerCase();
    if (dryCategories.some(d => c.includes(d))) return 'Dry Waste';
    if (wetCategories.some(w => c.includes(w))) return 'Wet Waste';
    return 'Unknown';
  };
useEffect(() => {
    const savedImg = localStorage.getItem("temp_report_image");
    const savedLoc = localStorage.getItem("temp_report_location");
    const savedDetections = localStorage.getItem("temp_ai_detections");
    const savedStats = localStorage.getItem("temp_ai_stats");
    
    if (savedImg) setImageUrl(savedImg);
    if (savedLoc) setLocation(JSON.parse(savedLoc));
    if (savedDetections) setDetections(JSON.parse(savedDetections));
    if (savedStats) setStats(JSON.parse(savedStats));
    
    // Cleanup on unmount if needed, but we keep it for now
  }, []);


  const primaryDetection = detections.length > 0 
    ? detections.reduce((prev, current) => (prev.confidence > current.confidence) ? prev : current) 
    : null;
    
  const aiSegregation = primaryDetection ? getSegregation(primaryDetection.class_name) : 'Unknown';
  const needsManual = aiSegregation === 'Unknown' || (primaryDetection && primaryDetection.confidence < 0.4);
  
  const finalSegregation = segregationOverride || (needsManual ? 'Manual Verification Required' : aiSegregation);
  const verificationStatus = segregationOverride ? 'User Verified' : 'AI Recommendation';

  if (!imageUrl) {
  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading AI Results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-navy mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-2xl font-bold text-navy mb-6">AI Detection Result</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left: Image & Bounding Boxes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm mb-4">Our AI has analyzed the image.</p>
              
              <div className="relative aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Detected Waste" className="w-full h-full object-cover opacity-80" />
                
                {/* Real Bounding Boxes overlay */}
                {stats?.image_width && detections.map((det, i) => {
                  // Calculate percentages
                  const left = (det.box[0] / stats.image_width) * 100;
                  const top = (det.box[1] / stats.image_height) * 100;
                  const width = ((det.box[2] - det.box[0]) / stats.image_width) * 100;
                  const height = ((det.box[3] - det.box[1]) / stats.image_height) * 100;
                  
                  return (
                    <div 
                      key={i} 
                      className="absolute border-2 border-primary bg-black/10 rounded-sm group cursor-default transition-all hover:bg-black/20 hover:z-10"
                      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                    >
                      <div className="absolute -top-6 left-[-2px] bg-primary text-white text-xs font-bold px-2 py-1 rounded-t-sm rounded-br-sm whitespace-nowrap">
                        {det.class_name} {Math.round(det.confidence * 100)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detected Waste List */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-navy mb-4">Detected Waste</h3>
              <div className="space-y-3">
                {detections.length > 0 ? detections.map((det, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="font-medium text-navy capitalize">{det.class_name}</span>
                    </div>
                    <span className="font-bold text-primary">{Math.round(det.confidence * 100)}% Confidence</span>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm p-4 bg-slate-50 rounded-lg">No waste objects detected with high confidence.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary & Submission */}
          <div className="space-y-6">
            
            
            {/* Smart Segregation Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  🧠 AI Waste Analysis
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Detected</p>
                  <p className="text-lg font-bold text-navy capitalize">{primaryDetection?.class_name || 'None'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Confidence</p>
                  <p className="text-lg font-bold text-primary">{primaryDetection ? Math.round(primaryDetection.confidence * 100) : 0}%</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Smart Segregation</p>
                
                {needsManual && !segregationOverride ? (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-700 font-bold mb-2">
                      <AlertTriangle size={18} /> Manual Verification Required
                    </div>
                    <p className="text-xs text-orange-600 mb-4">
                      The detected material could not be confidently assigned to wet or dry waste. Please verify before disposal.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSegregationOverride('Wet Waste')}
                        className="flex-1 bg-white border border-green-200 text-green-700 hover:bg-green-50 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        🟩 Wet Waste
                      </button>
                      <button 
                        onClick={() => setSegregationOverride('Dry Waste')}
                        className="flex-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        🟦 Dry Waste
                      </button>
                    </div>
                    <button 
                        onClick={() => setSegregationOverride('Unknown')}
                        className="w-full mt-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Not Sure
                    </button>
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl flex flex-col gap-2 border ${finalSegregation === 'Wet Waste' ? 'bg-green-50 border-green-200' : finalSegregation === 'Dry Waste' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{finalSegregation === 'Wet Waste' ? '🟩' : finalSegregation === 'Dry Waste' ? '🟦' : '⬜'}</span>
                      <span className={`text-xl font-extrabold ${finalSegregation === 'Wet Waste' ? 'text-green-800' : finalSegregation === 'Dry Waste' ? 'text-blue-800' : 'text-slate-700'}`}>
                        {finalSegregation.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mt-2 bg-white/60 p-2 rounded-lg">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Recommended Bin</p>
                      <p className={`font-bold flex items-center gap-1.5 ${finalSegregation === 'Wet Waste' ? 'text-green-700' : finalSegregation === 'Dry Waste' ? 'text-blue-700' : 'text-slate-600'}`}>
                        {finalSegregation === 'Wet Waste' ? '🟢 Wet Waste Bin' : finalSegregation === 'Dry Waste' ? '🔵 Dry Waste Bin' : '⚪ General Bin'}
                      </p>
                    </div>
                    
                    <p className="text-xs font-medium mt-1 flex items-center gap-1.5 opacity-80">
                      {finalSegregation === 'Wet Waste' ? '♻️ Suitable for composting' : finalSegregation === 'Dry Waste' ? '♻️ Suitable for dry/recycle' : ''}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <details className="text-xs text-slate-500 group">
                  <summary className="cursor-pointer hover:text-primary font-medium list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">▶</span> How Smart Segregation Works
                  </summary>
                  <div className="mt-2 pl-4 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p>1. 📷 Image is captured/uploaded.</p>
                    <p>2. 🤖 YOLO identifies the waste category.</p>
                    <p>3. 🧠 The system maps the detected category to a wet/dry waste stream.</p>
                    <p>4. 🗑️ The website recommends the appropriate bin.</p>
                    <p className="mt-2 font-medium italic">"The current AI model detects waste categories. Wet/Dry segregation is currently provided through a rule-based recommendation layer."</p>
                  </div>
                </details>
                <p className="text-[10px] text-slate-400 mt-3 italic text-center">Segregation recommendation is generated from the detected waste category.</p>
              </div>
            </div>


            {/* Submission Form */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-navy">Report Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="priority" 
                      checked={priority === 'Normal'}
                      onChange={() => setPriority('Normal')}
                      className="text-primary focus:ring-primary" 
                    />
                    <span className="text-sm text-navy">Normal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="priority" 
                      checked={priority === 'Urgent'}
                      onChange={() => setPriority('Urgent')}
                      className="text-red-500 focus:ring-red-500" 
                    />
                    <span className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> Urgent</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  rows={3}
                  placeholder="Tell us anything else..."
                ></textarea>
              </div>

              <button 
                onClick={async () => {
                  if (!imageUrl || !location || isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    // Try to get the actual user ID, fallback to a demo UUID if not logged in
                    // In a production app, the user MUST be logged in at this point.
                    let userId = "00000000-0000-0000-0000-000000000000";
                    const { supabase } = await import("@/lib/supabase");
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      userId = user.id;
                    }
                    
                    // Recover the file from the blob URL
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'report_image.jpg', { type: 'image/jpeg' });
                    
                    const { reportService } = await import("@/lib/services/reportService");
                    
                    const result = await reportService.createReport(
                      userId,
                      location,
                      file,
                      detections,
                      priority,
                      description || "Citizen report via AI detection", finalSegregation, verificationStatus
                    );
                    
                    if (result.success) {
                      router.push("/report/success");
                    } else {
                      alert("Error saving report: " + result.error);
                      setIsSubmitting(false);
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Failed to submit report. Ensure you are logged in or RLS allows inserts.");
                    router.push("/report/success"); // Fallback for prototype navigation
                  }
                }}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-light transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Continue <ArrowLeft size={16} className="rotate-180" /> Submit Report
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
