"use client";

import dynamic from "next/dynamic";
import { Filter } from "lucide-react";

// Dynamically import the map component with no SSR because Leaflet uses window
const DynamicMap = dynamic(() => import("@/components/admin/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

export default function AdminMapPage() {
  return (
    <div className="h-[calc(100vh-64px)] -m-6 flex flex-col relative overflow-hidden">
      
      {/* Map Overlay Controls */}
      <div className="absolute top-6 left-6 z-20 flex gap-4 shadow-lg rounded-lg">
        <div className="bg-white/90 backdrop-blur-md rounded-lg border border-slate-200/50 p-2 flex gap-2">
          <select className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none">
            <option>All Zones</option>
            <option>North Zone</option>
            <option>South Zone</option>
          </select>
          <select className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none">
            <option>All Priorities</option>
            <option>High Priority</option>
          </select>
          <button className="bg-primary text-white p-1.5 rounded-md hover:bg-primary-light transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20 shadow-lg rounded-lg">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-lg border border-slate-200/50 w-64">
          <h3 className="font-bold text-navy mb-3 text-sm">Map Legend</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-sm border border-white"></div> High Priority (Pending)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm border border-white"></div> Medium Priority (Pending)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm border border-white"></div> Assigned / In Progress</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-white"></div> Resolved</div>
          </div>
        </div>
      </div>

      {/* Real OpenStreetMap Area */}
      <div className="flex-1 relative z-0">
        <DynamicMap />
      </div>
    </div>
  );
}
