"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Eye, Filter } from "lucide-react";
import { reportService } from "@/services/reportService";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const reports = await reportService.getAllReports();
        
        const userMap = new Map();

        reports.forEach((r: any) => {
          const userId = r.user_id;
          if (!userId) return;

          if (!userMap.has(userId)) {
            const userName = (Array.isArray(r.profiles) ? r.profiles[0]?.full_name : r.profiles?.full_name) || "Unknown User";
            userMap.set(userId, {
              id: userId,
              name: userName,
              totalReports: 0,
              resolved: 0,
              rejected: 0,
              active: 0,
              lastReported: new Date(0)
            });
          }

          const userStats = userMap.get(userId);
          userStats.totalReports++;

          const status = (r.status || 'pending').toLowerCase();
          if (status === 'resolved' || status === 'closed') {
            userStats.resolved++;
          } else if (status === 'rejected') {
            userStats.rejected++;
          } else {
            userStats.active++; // pending, assigned, in_progress, ai_verified, etc.
          }

          const reportDate = new Date(r.created_at);
          if (reportDate > userStats.lastReported) {
            userStats.lastReported = reportDate;
          }
        });

        // Convert to array and sort by last reported descending
        const userList = Array.from(userMap.values());
        userList.sort((a, b) => b.lastReported.getTime() - a.lastReported.getTime());
        setUsers(userList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const getTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1) return `${diffDays} days ago`;
    return 'Just now';
  };

  const filteredUsers = users.filter(u => {
    // Search
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter
    if (statusFilter === 'Active' && u.active === 0) return false;
    if (statusFilter === 'Resolved' && u.resolved === 0) return false;
    if (statusFilter === 'Rejected' && u.rejected === 0) return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Citizen Directory</h1>
          <p className="text-slate-500 text-sm">View all unique users who have submitted waste reports.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filters and Search */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 justify-between bg-slate-50/50">
          
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search User..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-48"
            >
              <option value="All">All Users</option>
              <option value="Active">Has Active Reports</option>
              <option value="Resolved">Has Resolved Reports</option>
              <option value="Rejected">Has Rejected Reports</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No users found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">User Name</th>
                  <th className="px-6 py-4 text-center">Total Reports</th>
                  <th className="px-6 py-4 text-center">Resolved</th>
                  <th className="px-6 py-4 text-center">Rejected</th>
                  <th className="px-6 py-4 text-center">Active</th>
                  <th className="px-6 py-4">Last Reported</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy truncate max-w-[200px]">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      {user.totalReports}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.resolved > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">{user.resolved}</span>
                      ) : <span className="text-slate-300">0</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.rejected > 0 ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold">{user.rejected}</span>
                      ) : <span className="text-slate-300">0</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.active > 0 ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-bold">{user.active}</span>
                      ) : <span className="text-slate-300">0</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {getTimeAgo(user.lastReported)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        href={`/admin/users/${user.id}`} 
                        className="inline-flex items-center gap-1 p-2 bg-slate-100 hover:bg-primary hover:text-white text-slate-600 rounded-lg transition-colors font-medium text-xs"
                      >
                        <Eye size={16} /> <span className="hidden lg:inline">View Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
