"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabase";
import { reportService } from "@/services/reportService";
import { PlusCircle, MapPin, Clock, ArrowRight } from "lucide-react";

export default function CitizenDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          const userReports = await reportService.getCitizenReports(user.id);
          setReports(userReports);
        } catch (error) {
          console.error("Failed to load reports:", error);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy mb-1">My Dashboard</h1>
            <p className="text-slate-500">Track your civic reports and earned points.</p>
          </div>
          <Link 
            href="/report"
            className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          >
            <PlusCircle size={18} /> New Report
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
            <p className="text-sm font-medium text-slate-500 mb-1">Welcome back,</p>
            <p className="text-xl font-bold text-navy">{user?.user_metadata?.full_name || "Citizen"}</p>
            {user ? (
              <p className="text-sm text-emerald-600 font-medium mt-1">✓ Account Verified</p>
            ) : (
              <p className="text-sm text-orange-500 font-medium mt-1">Demo Mode (Not Logged In)</p>
            )}
          </div>
          
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-medium text-blue-800 mb-1">Total Reports Submitted</p>
            <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy mb-4">Your Recent Reports</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading your history...</p>
            </div>
          ) : reports.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <Link 
                    key={report.id} 
                    href={`/reports/${report.report_id}`}
                    className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors block"
                  >
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      report.status === 'resolved' ? 'bg-emerald-500' : 
                      report.status === 'in_progress' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-navy">{report.report_id}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                          report.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                        <MapPin size={12} /> {report.address || 'GPS Location Attached'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-slate-300">
                      <ArrowRight size={20} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={24} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">No reports yet</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">You haven&apos;t reported any waste yet. Help keep your city clean by submitting your first report!</p>
              <Link 
                href="/report"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                Report Waste Now
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
