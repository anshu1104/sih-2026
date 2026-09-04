"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Clock } from "lucide-react";
import { reportService } from "@/lib/services/reportService";

export default function AdminAssignmentsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await reportService.getAllReports();
        // Only include pending, assigned, or in progress
        const validStatuses = ['pending', 'ai_verified', 'submitted', 'assigned', 'in_progress', 'in progress'];
        const activeReports = data.filter((r: any) => validStatuses.includes((r.status || 'pending').toLowerCase()));
        setReports(activeReports);
      } catch (err) {
        console.error("Failed to load reports for assignments", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Task Assignments</h1>
          <p className="text-slate-500">View active citizen reports and their current assignments.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or Area..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading incoming reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No active reports waiting for assignment!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Report ID</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Waste Type</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Assigned Team</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Reported At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => {
                  let status = (r.status || 'pending').toLowerCase();
                  if (status === 'ai_verified' || status === 'submitted') status = 'pending';

                  return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/reports/${r.report_id || r.id}`} className="font-bold text-navy hover:text-primary">
                        {r.report_id || r.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 truncate max-w-[150px]" title={r.address}>
                      {r.address || "GPS Location"}
                    </td>
                    <td className="px-6 py-4 font-medium capitalize">{r.waste_type || "Unknown"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                        (r.priority || '').toLowerCase() === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.priority || "Normal"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-navy">
                      {r.assigned_team || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        status === 'pending' ? 'text-orange-500 bg-orange-50' :
                        status === 'assigned' ? 'text-blue-500 bg-blue-50' :
                        (status === 'in_progress' || status === 'in progress') ? 'text-purple-500 bg-purple-50' :
                        'text-emerald-500 bg-emerald-50'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
