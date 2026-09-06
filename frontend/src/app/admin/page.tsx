"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Clock, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { reportService } from "@/services/reportService";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/admin/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center min-h-[400px] rounded-lg">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

export default function AdminDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good Morning");

  const fetchReports = async (source = "unknown") => {
    try {
      console.log(`[Admin] Fetching reports triggered by: ${source}`);
      const allReports = await reportService.getAllReports();
      console.log(`[Admin] Fetched ${allReports?.length} reports`);
      setReports(allReports || []);
    } catch (err) {
      console.error("Failed to load reports", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    // IST Greeting calculation
    const updateGreeting = () => {
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
      });
      const istHour = parseInt(formatter.format(new Date()), 10);
      
      if (istHour >= 12 && istHour < 17) setGreeting('Good Afternoon');
      else if (istHour >= 17) setGreeting('Good Evening');
      else setGreeting('Good Morning');
    };

    updateGreeting();
    fetchReports("mount");

    // Realtime: auto-refresh when any report is inserted, updated, or deleted
    const realtimeChannel = supabase
      .channel('admin-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        console.log("[Admin] Realtime event received!", payload);
        fetchReports("realtime");
      })
      .subscribe((status) => {
        console.log("[Admin] Realtime subscription status:", status);
      });

    // Also re-fetch when admin switches back to this tab
    const handleFocus = () => fetchReports("focus");
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(realtimeChannel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Metrics Calculation
  const pendingReports = reports.filter(r => r.status !== 'resolved' && r.status !== 'closed');
  
  const highPriority = pendingReports.filter(r => 
    r.priority?.toLowerCase() === 'urgent' || r.priority?.toLowerCase() === 'high'
  );

  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()); 
  
  const reportedToday = reports.filter(r => {
    const reportDateIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(r.created_at));
    return reportDateIST === todayIST;
  });

  const resolvedToday = reports.filter(r => {
    if (r.status !== 'resolved') return false;
    // Fallback to created_at if updated_at is missing, although resolved implies an update
    const updateDate = r.updated_at ? new Date(r.updated_at) : new Date(r.created_at);
    const resolvedDateIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(updateDate);
    return resolvedDateIST === todayIST;
  });

  // Helper for time ago
  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">{greeting}, Admin 👋</h1>
          <p className="text-slate-500">Here&apos;s what&apos;s happening in your city today.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-slate-500">Loading municipal data...</p>
        </div>
      ) : (
        <>
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-1">Pending Complaints</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-navy">{pendingReports.length}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">Active issues</p>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-1">High Priority</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-navy">{highPriority.length}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">Requires immediate attention</p>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-1">Reported <span className="text-primary font-bold">Today</span></p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-navy">{reportedToday.length}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">New issues today</p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-1">Resolved <span className="text-primary font-bold">Today</span></p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-navy">{resolvedToday.length}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">Fixed by municipal staff</p>
            </div>

          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Live Map Area */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-navy">Live Waste Reports</h2>
                <Link href="/admin/map" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  Full Map <ArrowRight size={14} />
                </Link>
              </div>
              <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-200">
                <DynamicMap />
              </div>
            </div>

            {/* Recent Reports List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 flex flex-col h-[500px]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl z-10 sticky top-0">
                <h2 className="font-bold text-navy">Recent Reports</h2>
                <Link href="/admin/reports" className="text-sm font-medium text-primary hover:underline">View All</Link>
              </div>
              
              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500 text-center">No reports found.</p>
                ) : (
                  reports.slice(0, 50).map(report => {
                    // Determine status color
                    let dotColor = 'bg-slate-500';
                    let statusColor = 'text-slate-500';
                    let statusLabel = report.status || 'Pending';
                    
                    if (report.status === 'resolved' || report.status === 'closed') {
                      dotColor = 'bg-emerald-500';
                      statusColor = 'text-emerald-600';
                      statusLabel = 'Resolved';
                    } else if (report.status === 'rejected') {
                      dotColor = 'bg-red-500';
                      statusColor = 'text-red-500';
                      statusLabel = 'Rejected';
                    } else if (report.status === 'in_progress' || report.status === 'assigned') {
                      dotColor = 'bg-blue-500';
                      statusColor = 'text-blue-500';
                      statusLabel = report.status;
                    } else if (report.priority?.toLowerCase() === 'urgent' || report.priority?.toLowerCase() === 'high') {
                      dotColor = 'bg-red-500';
                      statusColor = 'text-red-500';
                      statusLabel = 'High Priority';
                    } else {
                      dotColor = 'bg-orange-500';
                      statusColor = 'text-orange-500';
                      statusLabel = 'Pending';
                    }

                    return (
                      <Link key={report.id} href={`/reports/${report.report_id}`} className="block p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex gap-4">
                          <div className="mt-1 shrink-0">
                            <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-bold text-sm text-navy truncate">{report.report_id}</p>
                              <p className={`text-xs font-bold whitespace-nowrap capitalize ${statusColor}`}>
                                {statusLabel.replace('_', ' ')}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                              <MapPin size={10} className="shrink-0" /> {report.address || "GPS Location"}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                              <Clock size={10} className="shrink-0" /> {getTimeAgo(report.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
