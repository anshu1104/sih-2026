"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { reportService } from "@/services/reportService";
import { 
  LayoutDashboard, 
  FileText, 
  Map as MapIcon, 
  BarChart3, 
  Users, 
  Award, 
  ShieldAlert, 
  Settings,
  Leaf,
  Bell,
  Search,
  LogOut
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);

  // Shared fetch function so it can be called on mount, realtime events, and focus
  const fetchReports = async () => {
    try {
      const data = await reportService.getAllReports();
      setReports(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      await fetchReports();
      
      // Get current admin and lock this tab to their identity
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setAdminEmail(user.email);
        sessionStorage.setItem('civicvision_tab_user', user.id);
      }
    }
    init();

    // Realtime: re-fetch reports when any insert/update/delete happens on the reports table
    const realtimeChannel = supabase
      .channel('admin-reports-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    // Also re-fetch when this tab regains focus (e.g., switching back from the citizen tab)
    const handleFocus = () => fetchReports();
    window.addEventListener('focus', handleFocus);

    // Listen for cross-tab session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const tabUserId = sessionStorage.getItem('civicvision_tab_user');
      
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('civicvision_tab_user');
        router.push('/');
        return;
      }
      
      if (tabUserId && session?.user && session.user.id !== tabUserId) {
        setSessionLost(true);
        return;
      }
      
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLogout = async () => {
    sessionStorage.removeItem('civicvision_tab_user');
    await supabase.auth.signOut();
    router.push("/");
  };

  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const calculateUnread = () => {
      const savedRead = new Set(JSON.parse(localStorage.getItem("admin_read_alerts") || "[]"));
      const savedCleared = new Set(JSON.parse(localStorage.getItem("admin_cleared_alerts") || "[]"));
      
      let unread = 0;
      reports.forEach(r => {
        const status = (r.status || 'pending').toLowerCase();
        const isAssigned = status === 'assigned' || status === 'in_progress' || status === 'in progress';
        const isResolved = status === 'resolved' || status === 'closed';
        const isRejected = status === 'rejected';
        
        let type = "new";
        if (isAssigned) type = "progress";
        else if (isResolved) type = "resolved";
        else if (isRejected) type = "rejected";
        
        const alertTime = r.updated_at ? new Date(r.updated_at) : new Date(r.created_at);
        const alertId = `${r.id}-${type}-${alertTime.getTime()}`;
        
        if (!savedCleared.has(alertId) && !savedRead.has(alertId)) {
          unread++;
        }
      });
      setUnreadAlerts(unread);
    };

    calculateUnread();
    window.addEventListener("alerts_updated", calculateUnread);
    return () => window.removeEventListener("alerts_updated", calculateUnread);
  }, [reports]);

  const searchResults = searchQuery.trim() === "" ? [] : reports.filter(r => 
    r.report_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5); // show max 5 results

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-slate-300 flex flex-col hidden md:flex fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
          <Link href="/admin" className="flex items-center gap-2 text-white font-bold">
            <Leaf size={20} className="text-primary-light" />
            <span>CivicVision Admin</span>
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2">Main Menu</p>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <FileText size={18} /> Reports
          </Link>
          <Link href="/admin/map" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <MapIcon size={18} /> Smart Map
          </Link>
          <Link href="/admin/assignments" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <ShieldAlert size={18} /> Assignments
          </Link>

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-8 px-2">Management</p>
          <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <BarChart3 size={18} /> Analytics
          </Link>
          <Link href="/admin/alerts" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Bell size={18} /> Alerts
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Users size={18} /> Users
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={18} /> Settings
          </Link>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Admin Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-navy font-bold">
            Municipal Portal
          </div>
          <div className="flex items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                placeholder="Search reports (ID, location)..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64"
              />
              
              {/* Search Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                  {searchResults.map(report => (
                    <Link 
                      key={report.id} 
                      href={`/reports/${report.report_id}`}
                      className="block px-4 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    >
                      <p className="text-xs font-bold text-navy">{report.report_id}</p>
                      <p className="text-xs text-slate-500 truncate">{report.address || "GPS Location"}</p>
                    </Link>
                  ))}
                </div>
              )}
              {isSearchOpen && searchQuery.trim() !== "" && searchResults.length === 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 p-4 text-center text-xs text-slate-500">
                  No reports found.
                </div>
              )}
            </div>

            {/* Bell Notifications */}
            <Link href="/admin/alerts" className="relative text-slate-500 hover:text-navy transition-colors">
              <Bell size={20} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </Link>

            {/* Admin Avatar with email dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setIsAvatarOpen(prev => !prev)}
                className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm hover:bg-emerald-700 transition-colors"
              >
                {adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A'}
              </button>
              {isAvatarOpen && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[220px] z-50">
                  <div className="px-2 py-1 mb-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{adminEmail || "Authority"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {sessionLost && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-red-800 font-bold text-sm">⚠️ Session Conflict Detected</p>
                <p className="text-red-600 text-xs mt-1">Another account was logged in from a different tab. Please sign out and log in again to continue safely.</p>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Re-Login
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
