"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

export interface ManualLocationData {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface ManualLocationInputProps {
  onLocationSubmit: (location: ManualLocationData) => void;
}

export default function ManualLocationInput({ onLocationSubmit }: ManualLocationInputProps) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const isValid = address.length > 3 && city.length > 2 && state.length > 2;

  const handleSubmit = () => {
    if (isValid) {
      onLocationSubmit({ address, city, state, pincode });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-navy font-medium border-b border-slate-100 pb-2">
        <MapPin size={18} className="text-primary" />
        <p>Manual Location Required</p>
      </div>
      
      <p className="text-sm text-slate-500 mb-4">Since you uploaded an image, please provide the location where this waste was found.</p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Address / Area *</label>
          <input 
            type="text" 
            placeholder="e.g. Near Central Park, Sector 12"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">City *</label>
            <input 
              type="text" 
              placeholder="e.g. Bhubaneswar"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">State *</label>
            <input 
              type="text" 
              placeholder="e.g. Odisha"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Pincode (Optional)</label>
          <input 
            type="text" 
            placeholder="e.g. 751001"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full mt-4 py-3 rounded-lg bg-navy text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 transition-colors"
      >
        Save Location
      </button>
    </div>
  );
}
