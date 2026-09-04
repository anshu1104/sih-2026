"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, X, Clock } from "lucide-react";
import { reportService } from "@/lib/services/reportService";
import { supabase } from "@/lib/supabase";

export default function AdminReportDetail() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal & Team State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [occupiedTeams, setOccupiedTeams] = useState<string[]>([]);
  const [notification, setNotification] = useState<{show: boolean, team: string}>({show: false, team: ''});
  
  // Error state for missing column
  const [dbError, setDbError] = useState("");

  const fetchReport = async () => {
    try {
      const data = await reportService.getReportById(reportId);
      setReport(data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("assigned_team")) {
        setDbError("The 'assigned_team' column is missing from the reports table. Please add it via Supabase SQL.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
    
    // Realtime updates
    const channel = supabase.channel(`report-${reportId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `report_id=eq.${reportId}` }, () => {
        fetchReport();
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [reportId]);

  // Load Occupied Teams when opening Modal
  const openTeamModal = async () => {
    try {
      // Find all active teams that are currently handling a complaint
      const { data } = await supabase
        .from('reports')
        .select('assigned_team, status');
        
      if (data) {
        // Occupied = assigned to a report that is NOT resolved and NOT rejected
        const active = data
          .filter(r => r.assigned_team && r.status !== 'resolved' && r.status !== 'rejected')
          .map(r => r.assigned_team);
        setOccupiedTeams(active);
      }
    } catch (e) {
      console.error("Failed to load teams", e);
    }
    setIsTeamModalOpen(true);
  };

  // Status Actions
  const handleAssignTeam = async (teamName: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ assigned_team: teamName, status: 'assigned', updated_at: new Date().toISOString() })
        .eq('report_id', reportId);
        
      if (error) throw error;
      
      setReport(prev => ({ ...prev, assigned_team: teamName, status: 'assigned' }));
      setIsTeamModalOpen(false);
      
      // Show Notification
      setNotification({ show: true, team: teamName });
      setTimeout(() => setNotification({ show: false, team: '' }), 4000);
      
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("assigned_team")) {
        alert("Database error: Please add 'assigned_team' text column to reports table first!");
      }
    }
  };

  const handleMarkInProgress = async () => {
    try {
      const { error } = await supabase.from('reports').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('report_id', reportId);
      if (error) throw error;
      setReport(prev => ({ ...prev, status: 'in_progress' }));
    } catch (e) {
      console.error(e);
      alert("Failed to update status: " + JSON.stringify(e));
    }
  };

  const handleResolve = async () => {
    try {
      const { error } = await supabase.from('reports').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('report_id', reportId);
      if (error) throw error;
      setReport(prev => ({ ...prev, status: 'resolved' }));
    } catch (e) {
      console.error(e);
      alert("Failed to resolve: " + JSON.stringify(e));
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase.from('reports').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('report_id', reportId);
      if (error) throw error;
      setReport(prev => ({ ...prev, status: 'rejected' }));
    } catch (e: any) { 
      console.error(e);
      alert("Failed to update: " + JSON.stringify(e)); 
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading report details...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-red-500">Report not found.</div>;
  }

  let status = (report.status || 'pending').toLowerCase();
  if (status === 'ai_verified') status = 'pending';
  if (status === 'closed') status = 'resolved';
  
  const priority = (report.priority || 'medium').toLowerCase();
  const assignedTeam = report.assigned_team;

  // Format Status display text
  let statusDisplay = "Pending";
  if (status === 'assigned') statusDisplay = `Assigned (${assignedTeam})`;
  if (status === 'in progress' || status === 'in_progress') statusDisplay = `In Progress (${assignedTeam || 'No Team'})`;
  if (status === 'resolved') statusDisplay = `Resolved ${assignedTeam ? `(${assignedTeam})` : ''}`;
  if (status === 'rejected') statusDisplay = "Rejected";

  // Generate 10 Teams
  const teamsList = Array.from({ length: 10 }, (_, i) => `Team ${i + 1}`);

  return (
    <div className="space-y-6 max-w-5xl relative">
      
      {/* Database Error Banner */}
      {dbError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 font-medium">
          ⚠️ {dbError}
        </div>
      )}

      {/* Success Notification */}
      {notification.show && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white p-4 rounded-xl shadow-2xl z-50 flex items-start gap-3 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="mt-0.5" />
          <div>
            <p className="font-bold">Team Assigned Successfully</p>
            <p className="text-emerald-100 text-sm mt-1">Notification has been sent to {notification.team}.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-500"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1 flex items-center gap-2">
            Report {reportId}
            <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
              priority === 'high' || priority === 'urgent' ? 'bg-red-100 text-red-600' :
              priority === 'low' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {report.priority || 'Medium'} Priority
            </span>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full ml-2">
              Status: {statusDisplay}
            </span>
          </h1>
          <p className="text-slate-500 text-sm">
            Submitted on {new Date(report.created_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Image & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-navy mb-4 border-b border-slate-100 pb-2">Reported Image</h2>
            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 overflow-hidden relative">
               {report.report_media?.[0]?.storage_path ? (
                 <img 
                    src={report.report_media[0].storage_path} 
                    alt="Reported Waste" 
                    className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="border-2 border-slate-200 border-dashed w-full h-full flex flex-col items-center justify-center bg-slate-50">
                    <p>No Image Provided</p>
                 </div>
               )}
            </div>
            <p className="text-sm text-slate-600 mt-4">
              <span className="font-medium text-navy">Citizen Note:</span> {report.description || "No description provided."}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-navy mb-4 border-b border-slate-100 pb-2">Status Timeline</h2>
            <div className="space-y-6 pl-2">
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={14} /></div>
                  <div className="w-0.5 h-full bg-emerald-500 -my-1"></div>
                </div>
                <div className="pb-4 pt-0.5 w-full">
                  <p className="font-bold text-navy text-sm">Submitted</p>
                  <p className="text-xs text-slate-500">Citizen submitted the report.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><ShieldCheck size={14} /></div>
                  {status === 'pending' || status === 'assigned' || status === 'in progress' || status === 'in_progress' ? (
                    <div className="w-0.5 h-full bg-slate-200 -my-1"></div>
                  ) : (
                    <div className={`w-0.5 h-full ${status === 'rejected' ? 'bg-red-500' : 'bg-emerald-500'} -my-1`}></div>
                  )}
                </div>
                <div className="pb-4 pt-0.5 w-full">
                  <p className="font-bold text-navy text-sm">AI Verified</p>
                  <p className="text-xs text-slate-500">Model confirmed {report.waste_type || 'Unknown'}.</p>
                </div>
              </div>

              {/* Dynamic Last Step */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {status === 'resolved' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={14} /></div>
                  ) : status === 'rejected' ? (
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center z-10"><X size={14} /></div>
                  ) : (status === 'in progress' || status === 'in_progress') ? (
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center z-10"><Clock size={14} /></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-orange-500 bg-white z-10"></div>
                  )}
                </div>
                
                <div className="pb-4 pt-0.5 w-full">
                  {status === 'resolved' ? (
                    <>
                      <p className="font-bold text-emerald-600 text-sm">Resolved {assignedTeam ? `(${assignedTeam})` : ''}</p>
                      <p className="text-xs text-slate-500">The waste has been cleared successfully. {assignedTeam} is now free.</p>
                    </>
                  ) : status === 'rejected' ? (
                    <>
                      <p className="font-bold text-red-600 text-sm">Rejected</p>
                      <p className="text-xs text-slate-500">This report was marked as invalid or spam.</p>
                    </>
                  ) : (status === 'in progress' || status === 'in_progress') ? (
                    <>
                      <p className="font-bold text-purple-600 text-sm">In Progress ({assignedTeam})</p>
                      <p className="text-xs text-slate-500">Team is actively working on clearing this location.</p>
                    </>
                  ) : status === 'assigned' ? (
                    <>
                      <p className="font-bold text-blue-600 text-sm">Team Assigned</p>
                      <p className="text-xs text-slate-500">{assignedTeam} has been dispatched and is currently Occupied.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-orange-600 text-sm">Pending Action</p>
                      <p className="text-xs text-slate-500">Awaiting municipal assignment.</p>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Col: Details & Actions */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-navy border-b border-slate-100 pb-2">Location details</h2>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-navy text-sm">{report.address || "GPS Location only"}</p>
                <p className="font-mono text-xs text-slate-500 mt-1 bg-slate-50 p-1.5 rounded inline-block border border-slate-100">
                  {report.latitude}, {report.longitude}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Admin Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-navy border-b border-slate-100 pb-2">Admin Actions</h2>
            
            <div className="space-y-3">
              {/* Assign Team Button */}
              <button 
                onClick={openTeamModal}
                disabled={status === 'resolved' || status === 'rejected'}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignedTeam ? `Change Team (Current: ${assignedTeam})` : "Assign Team"}
              </button>
              
              {/* Mark In Progress Button */}
              <button 
                onClick={handleMarkInProgress}
                disabled={status === 'resolved' || status === 'rejected' || status === 'in progress' || status === 'in_progress' || !assignedTeam}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark In Progress
              </button>
              
              {/* Resolve Complaint Button */}
              <button 
                onClick={handleResolve}
                disabled={status === 'resolved' || status === 'rejected' || !assignedTeam}
                className="w-full py-2.5 bg-primary hover:bg-primary-light text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={16} /> Resolve Complaint
              </button>
            </div>
            
            <div className="pt-2 border-t border-slate-100 mt-4">
              {/* Reject Button */}
              <button 
                onClick={handleReject}
                disabled={status === 'resolved' || status === 'rejected'}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject as Invalid / Spam
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Team Assignment Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsTeamModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-navy">Assign Team</h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-2 overflow-y-auto flex-1">
              {teamsList.map(team => {
                const isOccupied = occupiedTeams.includes(team);
                return (
                  <button
                    key={team}
                    disabled={isOccupied}
                    onClick={() => handleAssignTeam(team)}
                    className={`w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 rounded-lg transition-colors ${
                      isOccupied 
                        ? 'opacity-60 cursor-not-allowed bg-slate-50' 
                        : 'hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span className="font-bold text-slate-700">{team}</span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {isOccupied ? (
                        <><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Occupied</>
                      ) : (
                        <><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Free</>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
