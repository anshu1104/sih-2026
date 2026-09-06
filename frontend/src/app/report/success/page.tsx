"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { CheckCircle, MapPin, Calendar, ClipboardList } from "lucide-react";

export default function ReportSuccessPage() {
  const [reportId, setReportId] = useState("");
  
  useEffect(() => {
    // Generate a mock report ID
    setReportId(`CV-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    
    // Clear the temp data
    localStorage.removeItem("temp_report_image");
    localStorage.removeItem("temp_report_location");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-emerald-50 p-8 text-center border-b border-emerald-100">
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
              <CheckCircle size={40} />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-2">Report Submitted Successfully!</h1>
            <p className="text-slate-600">Thank you for helping make your city cleaner.</p>
          </div>
          
          {/* Details */}
          <div className="p-8 space-y-8">
            <div className="text-center">
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">Your Report ID</p>
              <div className="inline-flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg px-6 py-3 text-2xl font-mono font-bold text-navy tracking-widest">
                {reportId || "CV-2026-000000"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-6">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Waste Type</p>
                <p className="font-semibold text-navy text-sm">Plastic, Paper, Metal</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><MapPin size={12} /> Location</p>
                <p className="font-semibold text-navy text-sm">Sector 12, Bhubaneswar</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Calendar size={12} /> Reported At</p>
                <p className="font-semibold text-navy text-sm">Today, 03:42 PM</p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-sm font-bold text-navy mb-6 text-center">Track your report status in real time</p>
              
              <div className="max-w-md mx-auto space-y-6">
                
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center z-10"><CheckCircle size={14} /></div>
                    <div className="w-0.5 h-full bg-primary -my-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-bold text-navy text-sm">Submitted</p>
                    <p className="text-xs text-slate-500">Your report has been received</p>
                  </div>
                  <div className="ml-auto text-xs text-slate-400">03:42 PM</div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center z-10"><CheckCircle size={14} /></div>
                    <div className="w-0.5 h-full bg-slate-200 -my-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-bold text-navy text-sm">AI Verified</p>
                    <p className="text-xs text-slate-500">Our AI has analyzed the image</p>
                  </div>
                  <div className="ml-auto text-xs text-slate-400">03:42 PM</div>
                </div>

                <div className="flex gap-4 opacity-50">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white z-10"></div>
                    <div className="w-0.5 h-full bg-slate-200 -my-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-bold text-navy text-sm">Assigned</p>
                    <p className="text-xs text-slate-500">Assigned to municipal team</p>
                  </div>
                </div>

                <div className="flex gap-4 opacity-50">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white z-10"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-bold text-navy text-sm">Resolved</p>
                    <p className="text-xs text-slate-500">Issue will be resolved soon</p>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Actions */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <Link href="/report" className="py-3 rounded-lg border-2 border-slate-200 text-navy font-bold text-center hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Camera size={18} /> Report Another
              </Link>
              <Link href="/" className="py-3 rounded-lg bg-primary text-white font-bold text-center hover:bg-primary-light transition-colors flex items-center justify-center gap-2">
                Go to Home <ArrowRight size={18} />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
// Adding ArrowRight that was missing from imports but used in component above.
import { ArrowRight, Camera } from "lucide-react";
