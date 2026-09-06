"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin, Clock, AlertTriangle, UserCheck, X } from "lucide-react";
import Header from "@/components/Header";
import { reportService } from "@/lib/services/reportService";

export default function CitizenReportDetail() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await reportService.getReportById(reportId);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId]);

  const handleResolve = async () => {
    if (!report) return;
    setUpdating(true);
    try {
      await reportService.updateReportStatus(report.id, 'closed');
      setReport({ ...report, status: 'closed' });
      alert("Thank you! This report has been marked as resolved and you have earned Civic Points.");
    } catch (err) {
      console.error(err);
      alert("Failed to resolve report.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <h2 className="text-xl font-bold text-navy mb-2">Report Not Found</h2>
          <button onClick={() => router.push('/dashboard')} className="text-primary hover:underline">Go back to dashboard</button>
        </div>
      </div>
    );
  }

  const isResolved = report.status === 'closed' || report.status === 'resolved';
  const isRejected = report.status === 'rejected';
  
  // Normalized status string for logic mapping
  const currentStatus = report.status?.toLowerCase() || '';
  const isPending = currentStatus === 'pending' || currentStatus === 'submitted' || currentStatus === 'ai_verified';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 lg:p-8">
        
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to My Reports
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy mb-1 flex items-center gap-2">
              Report {report.report_id}
            </h1>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <Clock size={14} /> Reported on {new Date(report.created_at).toLocaleString()}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm ${
            isResolved ? 'bg-emerald-100 text-emerald-700' : isRejected ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {!isResolved && !isRejected && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>}
            {isResolved && <CheckCircle2 size={16} />}
            {isRejected && <X size={16} />}
            Status: {report.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Image */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="aspect-video bg-slate-900 relative">
                 {report.report_media && report.report_media.find((m: any) => m.media_type === 'original') ? (
                   <img src={report.report_media.find((m: any) => m.media_type === 'original')?.storage_path} alt="Waste Report" className="w-full h-full object-cover" />
                 ) : (
                   <div className="absolute inset-0 bg-slate-100/10 flex items-center justify-center text-slate-400">
                      No Image Uploaded
                   </div>
                 )}
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3 border-b border-slate-100 pb-4 mb-4">
                  <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-navy">Location</p>
                    <p className="text-sm text-slate-600">{report.address || 'GPS Coordinates Used'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-navy mb-2">AI Verification Details</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium capitalize">
                      {report.waste_type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            
            {/* Resolution Proof */}
            {isResolved && report.report_media?.find((m: any) => m.media_type === 'after') && (
              (() => {
                const proofMedia = report.report_media.find((m: any) => m.media_type === 'after');
                const history = report.report_status_history?.find((h: any) => h.status === 'resolved' && h.note);
                let proofMeta = null;
                try {
                  if (history && history.note) proofMeta = JSON.parse(history.note);
                } catch(e) {}
                
                return (
                  <div className="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm overflow-hidden mb-6">
                    <div className="p-4 bg-emerald-100/50 border-b border-emerald-200 flex justify-between items-center">
                      <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        Resolution Proof
                      </h2>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-200/50 px-2 py-1 rounded">CLEANED</span>
                    </div>
                    
                    <div className="aspect-video bg-slate-900 relative">
                      <img src={proofMedia.storage_path} alt="Resolution Proof" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Handled By</p>
                          <p className="font-bold text-navy text-sm">{proofMeta?.team || report.assigned_team || 'Municipal Team'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-1">Resolution Date</p>
                          <p className="font-bold text-navy text-sm">{new Date(proofMedia.created_at).toLocaleString()}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 font-medium mb-1">Proof Location</p>
                          <p className="font-mono text-xs text-navy bg-white border border-emerald-100 p-2 rounded">
                            {proofMeta?.latitude && proofMeta?.longitude 
                              ? `${proofMeta.latitude}, ${proofMeta.longitude}` 
                              : 'Verified via GPS'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-navy mb-4 border-b border-slate-100 pb-2">Status Tracking</h2>
              <div className="space-y-6 pl-2 mt-4">
                
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={14} /></div>
                    <div className="w-0.5 h-full bg-emerald-500 -my-1"></div>
                  </div>
                  <div className="pb-4 pt-0.5">
                    <p className="font-bold text-navy text-sm">Submitted & AI Verified</p>
                    <p className="text-xs text-slate-500">Your report was successfully submitted and verified.</p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className={`flex gap-4 ${isPending ? 'opacity-50' : ''}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                      (!isPending) ? 'bg-blue-500 text-white' : 'border-2 border-slate-300 bg-white'
                    }`}>
                      {!isPending && <UserCheck size={14} />}
                    </div>
                    <div className={`w-0.5 h-full -my-1 ${
                      isResolved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-slate-200'
                    }`}></div>
                  </div>
                  <div className="pb-4 pt-0.5">
                    <p className="font-bold text-navy text-sm">Assigned / In Progress</p>
                    <p className="text-xs text-slate-500">A municipal cleanup team has been assigned.</p>
                  </div>
                </div>
                
                {/* Step 3 (Resolved or Rejected) */}
                {isRejected ? (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center z-10 bg-red-500 text-white">
                         <X size={14} />
                      </div>
                    </div>
                    <div className="pb-4 pt-0.5">
                      <p className="font-bold text-red-600 text-sm">Rejected</p>
                      <p className="text-xs text-slate-500">This report was marked as invalid or spam.</p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex gap-4 ${!isResolved ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                        isResolved ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 bg-white'
                      }`}>
                         {isResolved && <CheckCircle2 size={14} />}
                      </div>
                    </div>
                    <div className="pb-4 pt-0.5">
                      <p className="font-bold text-navy text-sm">Resolved</p>
                      <p className="text-xs text-slate-500">The task has been completed.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Col: Citizen Actions */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-navy border-b border-slate-100 pb-2 mb-4">Take Action</h2>
              
              <div className="space-y-4">
                {isResolved ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm text-center">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                    <strong>This report is closed.</strong><br/>
                    Thank you for keeping the city clean!
                  </div>
                ) : isRejected ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm text-center">
                    <X size={32} className="mx-auto mb-2 text-red-500" />
                    <strong>The report is closed.</strong><br/>
                    Do not submit fake reports. Misuse of this service may lead to appropriate action.
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Did you or someone else already clean this up? Or has the municipality finished the job?
                    </p>
                    
                    <button 
                      onClick={handleResolve}
                      disabled={updating}
                      className="w-full py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                    >
                      {updating ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Mark as Resolved
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-center text-slate-400 mt-2">
                      Marking this as resolved helps keep the system accurate and earns you Civic Points!
                    </p>
                  </>
                )}
              </div>
            </div>

            {!isResolved && !isRejected && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-5">
                <h2 className="font-bold text-red-800 border-b border-red-200 pb-2 mb-4">Report Issue</h2>
                <p className="text-sm text-red-600 mb-4">Is there a problem with this report?</p>
                <button className="w-full py-2.5 bg-white hover:bg-red-100 text-red-600 border border-red-200 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                  <AlertTriangle size={16} />
                  Withdraw Complaint
                </button>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
