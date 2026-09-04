"use client";

import { useEffect, useState } from "react";

interface ImagePreviewProps {
  file: File;
  onChangeImage: () => void;
}

export default function ImagePreview({ file, onChangeImage }: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const fileSize = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
        )}
        <button 
          onClick={onChangeImage}
          className="absolute top-4 right-4 bg-white/90 text-navy px-3 py-1 rounded text-sm font-medium hover:bg-white shadow-sm transition-colors"
        >
          Change Image
        </button>
      </div>
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span className="truncate max-w-[200px]">{file.name}</span>
        <span>{fileSize} MB</span>
      </div>
    </div>
  );
}
