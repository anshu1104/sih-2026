"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, AlertTriangle } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Camera permission denied or camera not available. Please allow camera access and try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
            stopCamera();
            onCapture(file);
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-black relative rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <p className="text-white font-medium drop-shadow-md">Take Photo</p>
          <button onClick={handleCancel} className="text-white bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-[3/4] sm:aspect-square bg-slate-900 flex items-center justify-center">
          {isInitializing && <p className="text-white animate-pulse">Accessing camera...</p>}
          
          {error && (
            <div className="p-6 text-center text-red-400 flex flex-col items-center gap-3">
              <AlertTriangle size={32} />
              <p className="text-sm">{error}</p>
              <button onClick={handleCancel} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded text-sm hover:bg-slate-700">Go Back</button>
            </div>
          )}

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${error ? 'hidden' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer / Capture Button */}
        {!error && !isInitializing && (
          <div className="p-6 flex justify-center bg-black">
            <button 
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white/80 bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
