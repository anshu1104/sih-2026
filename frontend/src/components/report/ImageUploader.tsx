"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation
      if (file.type.startsWith("image/") || file.type.includes("webp")) {
        onUpload(file);
      } else {
        alert("Please upload a valid image file (JPG, PNG, WEBP).");
      }
    }
  };

  return (
    <div>
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center w-32 h-32 bg-white rounded-xl shadow-sm border border-slate-200 text-primary hover:border-primary transition-colors gap-2"
      >
        <Upload size={32} />
        <span className="font-medium text-sm text-navy">Upload Gallery</span>
      </button>
      
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
