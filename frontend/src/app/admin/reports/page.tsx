"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, Search, Eye } from "lucide-react";
import { reportService } from "@/lib/services/reportService";
import { supabase } from "@/lib/supabase";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("All Waste Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("");

  const fetchReports = async () => {
    try {
      const data = await reportService.getAllReports();
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();

    // Realtime connection so this table updates live when citizens submit
    const realtimeChannel = supabase
      .channel('admin-reports-page-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    // Also update on window focus
    const handleFocus = () => fetchReports();
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(realtimeChannel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredReports = reports.filter(r => {
    let match = true;
    
    // Status Filter
    if (statusFilter !== "All Statuses") {
      let rStatus = (r.status || 'pending').toLowerCase();
      if (rStatus === 'ai_verified') rStatus = 'pending';
      if (rStatus === 'closed') rStatus = 'resolved';
      
      let filterCheck = statusFilter.toLowerCase();
      if (filterCheck === 'in progress') filterCheck = 'in_progress';
      
      if (rStatus !== filterCheck) match = false;
    }
    
    // Type Filter
    if (typeFilter !== "All Waste Types") {
      const rType = r.waste_type || '';
      // Simple includes check as waste_type might be an array or string
      if (!rType.toLowerCase().includes(typeFilter.toLowerCase())) match = false;
    }
    
    // Date Filter
    if (dateFilter) {
      // Get YYYY-MM-DD from created_at
      const reportDate = new Date(r.created_at).toISOString().split('T')[0];
      if (reportDate !== dateFilter) match = false;
    }
    
    return match;
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).format(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Reports & History</h1>
          <p className="text-slate-500">View all citizen reports and their current status.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option>All Waste Types</option>
              <option>Plastic</option>
              <option>Paper</option>
              <option>Metal</option>
              <option>Glass</option>
              <option>Mixed</option>
            </select>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium ml-2">Date:</span>
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter("")}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Waste Type</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reported At</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Loading reports...
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No reports found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r, i) => {
                  const priority = (r.priority || 'Medium').toLowerCase();
                  let status = (r.status || 'pending').toLowerCase();
                  if (status === 'ai_verified') status = 'pending';
                  if (status === 'closed') status = 'resolved';
                  
                  return (
                    <tr key={r.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-navy">{r.report_id || `CVC-${r.id}`}</td>
                      <td className="px-6 py-4">{r.address || "GPS Location"}</td>
                      <td className="px-6 py-4 font-medium capitalize">{r.waste_type || "General"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                          priority === 'high' || priority === 'urgent' ? 'bg-red-100 text-red-600' :
                          priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                          status === 'pending' ? 'text-orange-500' :
                          status === 'assigned' ? 'text-blue-500' :
                          (status === 'in progress' || status === 'in_progress') ? 'text-purple-500' :
                          status === 'rejected' ? 'text-red-500' :
                          'text-emerald-500'
                        }`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(r.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/admin/reports/${r.report_id || r.id}`} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-emerald-50 rounded transition-colors">
                          <Eye size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Static for now) */}
        {!loading && filteredReports.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex justify-end">
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">{'<'}</button>
              <button className="px-3 py-1 bg-primary text-white rounded font-medium">1</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">{'>'}</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
