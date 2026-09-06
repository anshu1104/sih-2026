"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Camera, MapPin, CheckCircle2 } from "lucide-react";
import CameraCapture from "@/components/report/CameraCapture";
import ImageUploader from "@/components/report/ImageUploader";
import ImagePreview from "@/components/report/ImagePreview";
import ManualLocationInput, { ManualLocationData } from "@/components/report/ManualLocationInput";
import { detectLocation, GPSLocation } from "@/components/report/LocationDetector";

export interface ReportLocation {
  type: "gps" | "manual";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

export default function ReportWastePage() {
  const router = useRouter();
  
  // Auth check
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login to report waste.");
        router.push("/auth/login?redirectTo=/report");
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'camera' | 'upload' | null>(null);
  
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "detecting" | "error" | "done">("pending");
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CAMERA FLOW ---
  const handleCapture = async (file: File) => {
    setImageFile(file);
    setSourceType('camera');
    setShowCamera(false);
    
    // Automatically trigger GPS detection
    setLocationStatus("detecting");
    setLocationError(null);
    try {
      const gps: GPSLocation = await detectLocation();
      setLocation({
        type: "gps",
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy,
        address: null,
        city: null,
        state: null,
        pincode: null
      });
      setLocationStatus("done");
    } catch (err: any) {
      setLocationStatus("error");
      setLocationError(err.message || "Failed to get location.");
    }
  };

  // --- UPLOAD FLOW ---
  const handleUpload = (file: File) => {
    setImageFile(file);
    setSourceType('upload');
    setLocation(null); // Explicitly clear so user must enter it manually
    setLocationStatus("pending");
  };

  // --- MANUAL LOCATION ---
  const handleManualLocationSubmit = (data: ManualLocationData) => {
    setLocation({
      type: "manual",
      latitude: null,
      longitude: null,
      accuracy: null,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode
    });
    setLocationStatus("done");
  };

  const resetFlow = () => {
    setImageFile(null);
    setSourceType(null);
    setLocation(null);
    setLocationStatus("pending");
    setLocationError(null);
  };

  const submitToAI = async () => {
    if (!imageFile || !location) return;
    
    setIsProcessing(true);
    
    try {
      // 1. Save local state for preview
      const previewUrl = URL.createObjectURL(imageFile);
      localStorage.setItem("temp_report_image", previewUrl);
      localStorage.setItem("temp_report_location", JSON.stringify(location));
      
      // 2. Call the YOLO FastAPI backend
      const formData = new FormData();
      formData.append("file", imageFile);
      
      const response = await fetch("http://localhost:8001/api/detect", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("AI Model file is missing on the server. Please ensure best.pt is uploaded.");
        }
        throw new Error("AI Detection failed.");
      }
      
      const aiData = await response.json();
      
      // 3. Save detection results
      localStorage.setItem("temp_ai_detections", JSON.stringify(aiData.detections || []));
      localStorage.setItem("temp_ai_stats", JSON.stringify({
        object_count: aiData.object_count,
        overall_confidence: aiData.overall_confidence,
        image_width: aiData.image_width,
        image_height: aiData.image_height
      }));
      
      router.push("/report/result");
    } catch (err: any) {
      console.warn(err);
      alert(err.message || "Failed to connect to the AI service.");
      setIsProcessing(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onCancel={() => setShowCamera(false)} 
        />
      )}

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy mb-2">Report Waste</h1>
          <p className="text-slate-600">Help keep your city clean by reporting waste for municipal action.</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Image Source */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            
            {!imageFile ? (
              <>
                <h2 className="text-lg font-bold text-navy mb-4">Step 1: Capture or Upload</h2>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50">
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => setShowCamera(true)}
                      className="flex flex-col items-center justify-center w-32 h-32 bg-white rounded-xl shadow-sm border border-slate-200 text-primary hover:border-primary hover:bg-emerald-50 transition-colors gap-2"
                    >
                      <Camera size={32} />
                      <span className="font-medium text-sm text-navy">Take Photo</span>
                    </button>
                    
                    <ImageUploader onUpload={handleUpload} />
                  </div>
                  <p className="text-sm text-slate-500 max-w-xs">Upload existing photos from gallery or capture live via camera.</p>
                </div>
              </>
            ) : (
              <ImagePreview file={imageFile} onChangeImage={resetFlow} />
            )}
          </div>

          {/* Step 2: Location Handling */}
          {imageFile && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all">
              
              {sourceType === "camera" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-navy font-medium border-b border-slate-100 pb-2">
                    <MapPin size={18} className="text-primary" />
                    <p>GPS Location</p>
                  </div>

                  {locationStatus === "detecting" && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg text-slate-600 border border-slate-200">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm">Detecting GPS coordinates...</p>
                    </div>
                  )}

                  {locationStatus === "error" && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                      <p className="font-bold mb-1">Location Error</p>
                      <p>{locationError}</p>
                      <button 
                        onClick={() => handleCapture(imageFile)}
                        className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded transition-colors text-xs uppercase"
                      >
                        Retry GPS Detection
                      </button>
                    </div>
                  )}

                  {locationStatus === "done" && location && location.type === "gps" && (
                    <div className="p-4 bg-emerald-50 text-navy rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                        <CheckCircle2 size={18} />
                        <span>GPS Location Detected</span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1 font-mono bg-white/60 p-3 rounded border border-emerald-50">
                        <p>Latitude: {location.latitude?.toFixed(5)}</p>
                        <p>Longitude: {location.longitude?.toFixed(5)}</p>
                        <p>Accuracy: {location.accuracy?.toFixed(0)} meters</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sourceType === "upload" && (
                <>
                  {locationStatus === "done" && location && location.type === "manual" ? (
                    <div className="p-4 bg-slate-50 text-navy rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <CheckCircle2 size={18} />
                          <span>Manual Location Added</span>
                        </div>
                        <button onClick={() => setLocationStatus("pending")} className="text-xs text-primary hover:underline">Edit</button>
                      </div>
                      <div className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-100">
                        <p className="font-medium text-navy">{location.address}</p>
                        <p>{location.city}, {location.state} {location.pincode}</p>
                      </div>
                    </div>
                  ) : (
                    <ManualLocationInput onLocationSubmit={handleManualLocationSubmit} />
                  )}
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {imageFile && locationStatus === "done" && location && (
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={submitToAI}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-light disabled:opacity-70 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing with AI...
                  </>
                ) : (
                  "Continue to AI Detection"
                )}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
