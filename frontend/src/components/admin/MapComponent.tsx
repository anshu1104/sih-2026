"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Navigation, MapPin } from "lucide-react";

// Fix for default Leaflet markers in Next.js
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const markers = [
  { id: "CV-2026-081294", type: "Plastic", priority: "High", lat: 20.2961, lng: 85.8245, status: "Pending", loc: "Sector 12", color: "#ef4444" },
  { id: "CV-2026-081293", type: "Metal", priority: "Low", lat: 20.2980, lng: 85.8210, status: "Pending", loc: "Sector 08", color: "#f97316" },
  { id: "CV-2026-081290", type: "Plastic", priority: "Medium", lat: 20.2940, lng: 85.8280, status: "Assigned", loc: "Sector 15", color: "#3b82f6" },
  { id: "CV-2026-081289", type: "Mixed", priority: "Medium", lat: 20.3010, lng: 85.8190, status: "In Progress", loc: "Sector 02", color: "#3b82f6" },
  { id: "CV-2026-081288", type: "Paper", priority: "Low", lat: 20.2920, lng: 85.8200, status: "Resolved", loc: "Sector 04", color: "#10b981" }
];

export default function MapComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Leaflet throws errors if the container exists before the script loads completely,
    // so we only render after mounting.
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500">Loading Map...</div>;
  }

  return (
    <MapContainer 
      center={[20.2961, 85.8245]} 
      zoom={14} 
      style={{ width: "100%", height: "100%", zIndex: 1 }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {markers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={[marker.lat, marker.lng]}
          icon={createCustomIcon(marker.color)}
        >
          <Popup className="custom-popup">
            <div className="p-1 min-w-[200px]">
              <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between items-start">
                <div>
                  <p className="font-bold text-navy text-sm m-0 leading-tight">{marker.id}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 m-0"><MapPin size={10}/> {marker.loc}</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Waste Type:</span>
                  <span className="font-medium text-navy">{marker.type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Priority:</span>
                  <span className={`font-bold ${marker.priority === 'High' ? 'text-red-500' : 'text-orange-500'}`}>{marker.priority}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium text-blue-600">{marker.status}</span>
                </div>
              </div>
              
              <Link 
                href={`/admin/reports/${marker.id}`}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-navy font-medium rounded text-xs transition-colors flex items-center justify-center gap-1 no-underline"
              >
                View Details <Navigation size={12} />
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
