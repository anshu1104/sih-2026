"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ArrowRight, CheckCircle2, Clock, Check, Trash2, AlertTriangle, XCircle, MapPin } from "lucide-react";
import { reportService } from "@/lib/services/reportService";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
  const [clearedAlerts, setClearedAlerts] = useState<Set<string>>(new Set());

  // Load state from local storage
  useEffect(() => {
    const savedRead = localStorage.getItem("admin_read_alerts");
    if (savedRead) setReadAlerts(new Set(JSON.parse(savedRead)));
    
    const savedCleared = localStorage.getItem("admin_cleared_alerts");
    if (savedCleared) setClearedAlerts(new Set(JSON.parse(savedCleared)));
  }, []);

  const saveReadAlerts = (newRead: Set<string>) => {
    setReadAlerts(newRead);
    localStorage.setItem("admin_read_alerts", JSON.stringify(Array.from(newRead)));
    window.dispatchEvent(new Event("alerts_updated"));
  };

  const saveClearedAlerts = (newCleared: Set<string>) => {
    setClearedAlerts(newCleared);
    localStorage.setItem("admin_cleared_alerts", JSON.stringify(Array.from(newCleared)));
    window.dispatchEvent(new Event("alerts_updated"));
  };

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const reports = await reportService.getAllReports();
        
        // Map reports to alerts based on their current status
        const generatedAlerts = reports.map((r: any) => {
          const status = (r.status || 'pending').toLowerCase();
          const isPending = status === 'pending' || status === 'ai_verified' || status === 'submitted';
          const isAssigned = status === 'assigned' || status === 'in_progress' || status === 'in progress';
          const isResolved = status === 'resolved' || status === 'closed';
          const isRejected = status === 'rejected';

          // We use updated_at to track when the status changed, fallback to created_at
          const alertTime = r.updated_at ? new Date(r.updated_at) : new Date(r.created_at);
          
          const userName = (Array.isArray(r.profiles) ? r.profiles[0]?.full_name : r.profiles?.full_name) || "A Citizen";
          let title = "🔔 New Waste Report";
          let message = `A user "${userName}" has submitted a new waste report.`;
          let type = "new";
          
          if (isAssigned) {
            title = "🟡 Report In Progress";
            message = `Report #${r.report_id} is now In Progress${r.assigned_team ? ` — ${r.assigned_team} assigned` : ''}.`;
            type = "progress";
          } else if (isResolved) {
            title = "🟢 Report Resolved";
            message = `Report #${r.report_id} has been marked as Resolved.`;
            type = "resolved";
          } else if (isRejected) {
            title = "🔴 Report Rejected";
            message = `Report #${r.report_id} has been rejected.`;
            type = "rejected";
          }

          // Generate a unique ID for this alert state so if the report changes state, it acts as a new alert
          const alertId = `${r.id}-${type}-${alertTime.getTime()}`;

          return {
            id: alertId,
            report_id: r.report_id,
            type,
            title,
            message,
            timestamp: alertTime,
            location: r.address || "GPS Coordinates",
            waste_type: r.waste_type || "Unknown",
            isNew: isPending
          };
        });

        // Sort by timestamp descending
        generatedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setAlerts(generatedAlerts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAlerts();
  }, []);

  const handleMarkAsRead = (alertId: string) => {
    if (readAlerts.has(alertId)) return;
    const newRead = new Set(readAlerts);
    newRead.add(alertId);
    saveReadAlerts(newRead);
  };

  const handleMarkAllAsRead = () => {
    const newRead = new Set(readAlerts);
    alerts.forEach(a => newRead.add(a.id));
    saveReadAlerts(newRead);
  };

  const handleClearAll = () => {
    const newCleared = new Set(clearedAlerts);
    alerts.forEach(a => newCleared.add(a.id));
    saveClearedAlerts(newCleared);
  };

  const getTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Filter out cleared alerts
  const visibleAlerts = alerts.filter(a => !clearedAlerts.has(a.id));
  const unreadCount = visibleAlerts.filter(a => !readAlerts.has(a.id)).length;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
         Loading alerts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1 flex items-center gap-2">
            System Alerts
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm">Real-time notifications for waste reports and status updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Check size={16} /> Mark all as read
          </button>
          <button 
            onClick={handleClearAll}
            disabled={visibleAlerts.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <Bell size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-navy mb-1">No Alerts</h3>
          <p className="text-slate-500">You're all caught up! There are no new alerts to display.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAlerts.map(alert => {
            const isRead = readAlerts.has(alert.id);
            
            // Icon and styling mapping based on alert type
            let Icon = Bell;
            let iconColor = "text-orange-500";
            let bgColor = "bg-orange-50 border-orange-100";
            
            if (alert.type === 'progress') {
              Icon = Clock;
              iconColor = "text-blue-500";
              bgColor = "bg-blue-50 border-blue-100";
            } else if (alert.type === 'resolved') {
              Icon = CheckCircle2;
              iconColor = "text-emerald-500";
              bgColor = "bg-emerald-50 border-emerald-100";
            } else if (alert.type === 'rejected') {
              Icon = XCircle;
              iconColor = "text-red-500";
              bgColor = "bg-red-50 border-red-100";
            }

            return (
              <div 
                key={alert.id}
                onMouseEnter={() => handleMarkAsRead(alert.id)}
                className={`relative overflow-hidden bg-white rounded-xl shadow-sm border transition-all ${
                  !isRead ? 'border-primary shadow-md' : 'border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Unread indicator strip */}
                {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-5">
                  
                  {/* Alert Icon */}
                  <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border ${bgColor} ${iconColor}`}>
                    <Icon size={24} />
                  </div>
                  
                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-navy text-base">{alert.title}</h3>
                      {!isRead && <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary">New</span>}
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-3">{alert.message}</p>
                    
                    {/* Extra details for new reports */}
                    {alert.isNew && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><span className="font-semibold text-slate-500">Report ID:</span> #{alert.report_id}</div>
                        <div className="truncate"><span className="font-semibold text-slate-500">Location:</span> {alert.location}</div>
                        <div><span className="font-semibold text-slate-500">Waste Type:</span> <span className="capitalize">{alert.waste_type}</span></div>
                        <div><span className="font-semibold text-slate-500">Reported:</span> {getTimeAgo(alert.timestamp)}</div>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-slate-400 font-medium">
                      <Clock size={12} className="mr-1" />
                      {getTimeAgo(alert.timestamp)}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-l md:pl-5">
                    <Link 
                      href={`/admin/reports/${alert.report_id}`}
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      View Report <ArrowRight size={16} />
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
