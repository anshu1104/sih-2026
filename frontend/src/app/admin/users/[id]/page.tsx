"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { reportService } from "@/lib/services/reportService";

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [reports, setReports] = useState<any[]>([]);
  const [userName, setUserName] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    rejected: 0
  });

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const data = await reportService.getAllReports();
        const userReports = data.filter((r: any) => r.user_id === userId);
        
        if (userReports.length > 0) {
          const name = (Array.isArray(userReports[0].profiles) 
            ? userReports[0].profiles[0]?.full_name 
            : userReports[0].profiles?.full_name) || "Unknown User";
          setUserName(name);
        } else {
          setUserName("Unknown User");
        }

        let resolved = 0, inProgress = 0, rejected = 0;
        
        userReports.forEach((r: any) => {
          const status = (r.status || 'pending').toLowerCase();
          if (status === 'resolved' || status === 'closed') {
            resolved++;
          } else if (status === 'rejected') {
            rejected++;
          } else {
            inProgress++;
          }
        });

        setStats({
          total: userReports.length,
          resolved,
          inProgress,
          rejected
        });

        setReports(userReports);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserDetails();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Users
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <p className="text-slate-500 text-sm mb-1 uppercase tracking-wider font-bold">User Profile</p>
          <h1 className="text-3xl font-bold text-navy">{userName}</h1>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
           Loading user details...
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-navy mb-4 border-b border-slate-100 pb-2">Report Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-navy">{stats.total}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                <p className="text-sm font-medium text-emerald-600 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.resolved}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
                <p className="text-sm font-medium text-orange-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-orange-700">{stats.inProgress}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-center">
                <p className="text-sm font-medium text-red-600 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
               <h2 className="text-lg font-bold text-navy">Submitted Reports</h2>
            </div>
            {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                This user has not submitted any reports.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Report ID</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Waste Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reported Date</th>
                      <th className="px-6 py-4 text-center">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => {
                      const status = (r.status || 'pending').toLowerCase();
                      
                      return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-navy">
                          {r.report_id}
                        </td>
                        <td className="px-6 py-4 truncate max-w-[200px]" title={r.address}>
                          {r.address || "GPS Location"}
                        </td>
                        <td className="px-6 py-4 font-medium capitalize">
                          {r.waste_type || "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            (status === 'pending' || status === 'ai_verified' || status === 'submitted') ? 'text-orange-500 bg-orange-50' :
                            status === 'assigned' ? 'text-blue-500 bg-blue-50' :
                            (status === 'in_progress' || status === 'in progress') ? 'text-purple-500 bg-purple-50' :
                            status === 'rejected' ? 'text-red-500 bg-red-50' :
                            'text-emerald-500 bg-emerald-50'
                          }`}>
                            {status === 'ai_verified' || status === 'submitted' ? 'PENDING' : status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link 
                            href={`/admin/reports/${r.report_id}`} 
                            className="inline-flex items-center gap-1 p-2 bg-slate-100 hover:bg-primary hover:text-white text-slate-600 rounded-lg transition-colors font-medium text-xs"
                          >
                            <Eye size={16} /> <span className="hidden lg:inline">View</span>
                          </Link>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
