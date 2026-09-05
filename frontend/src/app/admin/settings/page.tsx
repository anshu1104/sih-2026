"use client";

import { useState, useEffect } from "react";
import { User, Lock, Bell, FileText, Database, Info, CheckCircle2, X, Download, FileBarChart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Profile State
  const [profile, setProfile] = useState({ full_name: "", email: "", phone: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Security State
  const [security, setSecurity] = useState({ twoFactor: false, lastLogin: "" });
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", new: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    newReport: true,
    teamAssigned: true,
    reportResolved: true,
    reportRejected: true
  });

  // Report Settings State
  const [reportSettings, setReportSettings] = useState({
    defaultPriority: "High",
    requireLocation: true,
    requireImage: true
  });

  // System Information State
  const [sysInfo, setSysInfo] = useState({
    websiteName: "CivicVision",
    departmentName: "Municipal Corporation",
    helpline: "1800-111-2222",
    email: "admin@civicvision.gov.in"
  });
  const [policyModal, setPolicyModal] = useState<'none' | 'terms' | 'privacy'>('none');

  // Toast State
  const [toast, setToast] = useState({ message: "", show: false, isError: false });

  const showToast = (msg: string, isError = false) => {
    setToast({ message: msg, show: true, isError });
    setTimeout(() => setToast({ message: "", show: false, isError: false }), 4000);
  };

  // Export States
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingAnalytics, setIsExportingAnalytics] = useState(false);
  
  // Monthly Report Modal States
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [monthlyMonth, setMonthlyMonth] = useState("September");
  const [monthlyYear, setMonthlyYear] = useState("2026");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }
        setUser(user);

        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile({
          full_name: profileData?.full_name || "Admin",
          email: user.email || "",
          phone: user.user_metadata?.phone || "Not Provided"
        });

        // Security
        setSecurity({
          twoFactor: user.user_metadata?.adminSettings?.security?.twoFactor || false,
          lastLogin: new Date(user.last_sign_in_at || Date.now()).toLocaleString()
        });

        // Notifications
        if (user.user_metadata?.adminSettings?.notifications) {
          setNotifications(user.user_metadata.adminSettings.notifications);
        }

        // Report Settings
        if (user.user_metadata?.adminSettings?.reportSettings) {
          setReportSettings(user.user_metadata.adminSettings.reportSettings);
        }

        // System Info
        if (user.user_metadata?.adminSettings?.sysInfo) {
          setSysInfo(user.user_metadata.adminSettings.sysInfo);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [router]);

  const saveSettingsToMeta = async (category: string, data: any, successMsg: string) => {
    if (!user) return;
    const currentMeta = user.user_metadata || {};
    const adminSettings = currentMeta.adminSettings || {};
    
    await supabase.auth.updateUser({
      data: {
        adminSettings: {
          ...adminSettings,
          [category]: data
        }
      }
    });
    
    // update local user object so subsequent saves don't overwrite
    setUser((prev: any) => ({
      ...prev,
      user_metadata: {
        ...prev.user_metadata,
        adminSettings: {
          ...adminSettings,
          [category]: data
        }
      }
    }));

    // If these are report settings, sync them globally via our API backend
    if (category === 'reportSettings') {
      try {
        await fetch('http://localhost:8001/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (e) {
        console.error("Failed to sync global report settings", e);
      }
    }

    showToast(successMsg);
  };

  // Profile Handlers
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    await supabase.from("profiles").update({ full_name: profile.full_name }).eq("id", user.id);
    await supabase.auth.updateUser({ data: { phone: profile.phone } });
    
    setIsEditingProfile(false);
    showToast("✓ Profile updated successfully");
  };

  // Password Handlers
  const handlePwdChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    
    if (pwdForm.new !== pwdForm.confirm) {
      setPwdError("New passwords do not match.");
      return;
    }
    
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwdForm.current
    });

    if (signInErr) {
      setPwdError("Wrong current password.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: pwdForm.new });
    if (updateErr) {
      setPwdError(updateErr.message);
      return;
    }

    setIsPwdModalOpen(false);
    setPwdForm({ current: "", new: "", confirm: "" });
    showToast("✓ Your password has been changed successfully");
  };

  // Notification Toggle Handler
  const toggleNotification = (key: keyof typeof notifications) => {
    const newNotifs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifs);
    saveSettingsToMeta('notifications', newNotifs, "✓ Notification settings updated");
  };

  // Report Settings Toggle Handler
  const toggleReportSetting = (key: keyof typeof reportSettings) => {
    const newSettings = { ...reportSettings, [key]: !reportSettings[key as keyof typeof reportSettings] };
    setReportSettings(newSettings);
    saveSettingsToMeta('reportSettings', newSettings, "✓ Report settings updated");
  };

  const changeReportPriority = (val: string) => {
    const newSettings = { ...reportSettings, defaultPriority: val };
    setReportSettings(newSettings);
    saveSettingsToMeta('reportSettings', newSettings, "✓ Priority setting updated");
  };

  // Security Toggle Handler
  const toggle2FA = () => {
    const newSec = { ...security, twoFactor: !security.twoFactor };
    setSecurity(newSec);
    saveSettingsToMeta('security', newSec, "✓ Security settings updated");
  };

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, user_id, waste_type, status, assigned_team, priority, created_at, updated_at, location_address, location_city, location_state, location_pincode, profiles(full_name)');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        showToast("No reports available to export.", true);
        setIsExportingCSV(false);
        return;
      }

      const headers = ['Report ID', 'User Name', 'Location', 'Waste Type', 'Status', 'Assigned Team', 'Priority', 'Reported Date', 'Resolved Date', 'Resolution Time'];
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const profiles = row.profiles as any;
        const userName = (Array.isArray(profiles) ? profiles[0]?.full_name : profiles?.full_name) || 'Unknown User';
        const locationStr = [row.location_address, row.location_city, row.location_state].filter(Boolean).join(', ').replace(/,/g, '');
        const repDate = new Date(row.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const resDate = (row.status === 'Resolved' && row.updated_at) ? new Date(row.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
        
        let resolutionTime = '';
        if (row.status === 'Resolved' && row.updated_at) {
          const diffHrs = (new Date(row.updated_at).getTime() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
          resolutionTime = diffHrs < 1 ? '< 1 hour' : `${Math.round(diffHrs)} hours`;
        }

        const values = [
          row.id,
          `"${userName}"`,
          `"${locationStr}"`,
          row.waste_type,
          row.status,
          row.assigned_team || 'Unassigned',
          row.priority || 'Normal',
          `"${repDate}"`,
          `"${resDate}"`,
          `"${resolutionTime}"`
        ];
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Waste_Reports_Export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("✓ Reports exported successfully");
    } catch (e) {
      console.error(e);
      showToast("✕ Unable to generate report. Please try again.", true);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleDownloadAnalytics = async () => {
    setIsExportingAnalytics(true);
    try {
      const { data, error } = await supabase.from('reports').select('*');
      if (error) throw error;
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text("CivicVision Analytics Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, 28);
      
      const total = data.length;
      const resolved = data.filter(r => r.status === 'Resolved').length;
      const inProgress = data.filter(r => r.status === 'In Progress').length;
      const rejected = data.filter(r => r.status === 'Rejected').length;
      const resRate = total > 0 ? ((resolved / total) * 100).toFixed(1) + '%' : '0%';

      // Summary Table
      doc.setFontSize(14);
      doc.text("Summary", 14, 40);
      autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: [
          ['Total Reports', total],
          ['Resolved Reports', resolved],
          ['In Progress', inProgress],
          ['Rejected', rejected],
          ['Resolution Rate', resRate]
        ]
      });

      // Waste Type Analysis
      const wasteTypes = data.reduce((acc: any, r: any) => {
        acc[r.waste_type || 'Unknown'] = (acc[r.waste_type || 'Unknown'] || 0) + 1;
        return acc;
      }, {});
      
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Waste Type Analysis", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Waste Type', 'Total Reports']],
        body: Object.keys(wasteTypes).map(type => [type, wasteTypes[type]])
      });

      // Team Performance
      const teams = data.reduce((acc: any, r: any) => {
        const team = r.assigned_team || 'Unassigned';
        if (!acc[team]) acc[team] = { assigned: 0, resolved: 0, active: 0 };
        acc[team].assigned++;
        if (r.status === 'Resolved') acc[team].resolved++;
        else if (r.status === 'In Progress' || r.status === 'Pending') acc[team].active++;
        return acc;
      }, {});
      
      finalY = (doc as any).lastAutoTable.finalY + 10;
      if (finalY > 250) { doc.addPage(); finalY = 20; }
      doc.text("Team Performance", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Team Name', 'Assigned', 'Resolved', 'Active']],
        body: Object.keys(teams).map(t => [t, teams[t].assigned, teams[t].resolved, teams[t].active])
      });

      doc.save("Analytics_Report.pdf");
      showToast("✓ Analytics report downloaded successfully");
    } catch (e) {
      console.error(e);
      showToast("✕ Unable to generate report. Please try again.", true);
    } finally {
      setIsExportingAnalytics(false);
    }
  };

  const handleGenerateMonthly = async () => {
    setIsGenerating(true);
    try {
      // Find month range
      const monthIndex = new Date(Date.parse(monthlyMonth +" 1, 2026")).getMonth();
      const year = parseInt(monthlyYear);
      
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Government Waste Management System", 14, 20);
      doc.setFontSize(16);
      doc.text(`Monthly Waste Report — ${monthlyMonth} ${monthlyYear}`, 14, 30);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, 38);

      const total = data.length;
      if (total === 0) {
        doc.text("No reports were submitted during this month.", 14, 50);
      } else {
        const resolved = data.filter(r => r.status === 'Resolved').length;
        const inProgress = data.filter(r => r.status === 'In Progress').length;
        const rejected = data.filter(r => r.status === 'Rejected').length;
        const resRate = ((resolved / total) * 100).toFixed(1) + '%';
        
        doc.setFontSize(14);
        doc.text("Monthly Overview", 14, 50);
        autoTable(doc, {
          startY: 55,
          head: [['Metric', 'Value']],
          body: [
            ['Total Reports Submitted', total],
            ['Total Resolved', resolved],
            ['Total In Progress', inProgress],
            ['Total Rejected', rejected],
            ['Resolution Rate', resRate]
          ]
        });

        const wasteTypes = data.reduce((acc: any, r: any) => {
          acc[r.waste_type || 'Unknown'] = (acc[r.waste_type || 'Unknown'] || 0) + 1;
          return acc;
        }, {});
        
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text("Waste Type Breakdown", 14, finalY);
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Waste Type', 'Reports']],
          body: Object.keys(wasteTypes).map(type => [type, wasteTypes[type]])
        });

        const teams = data.reduce((acc: any, r: any) => {
          const team = r.assigned_team || 'Unassigned';
          if (!acc[team]) acc[team] = { assigned: 0, resolved: 0, active: 0 };
          acc[team].assigned++;
          if (r.status === 'Resolved') acc[team].resolved++;
          else if (r.status === 'In Progress' || r.status === 'Pending') acc[team].active++;
          return acc;
        }, {});
        
        finalY = (doc as any).lastAutoTable.finalY + 10;
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        doc.text("Team Performance", 14, finalY);
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Team', 'Reports Assigned', 'Reports Resolved', 'Active Reports']],
          body: Object.keys(teams).map(t => [t, teams[t].assigned, teams[t].resolved, teams[t].active])
        });
      }

      doc.save(`Monthly_Report_${monthlyMonth}_${monthlyYear}.pdf`);
      showToast("✓ Monthly report generated successfully");
      setIsMonthlyModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast("✕ Unable to generate report. Please try again.", true);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex justify-center">
        <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors flex items-center shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <span className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`}></span>
    </button>
  );

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 right-6 z-[200] ${toast.isError ? 'bg-red-600' : 'bg-emerald-600'} text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-6 duration-300`}>
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-navy mb-1">Admin Settings</h1>
        <p className="text-slate-500 text-sm">Manage your profile, system preferences, and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 1. Admin Profile */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <User className="text-navy" size={18} />
            <h2 className="font-bold text-navy">Admin Profile</h2>
          </div>
          <div className="p-5 flex-1">
            {isEditingProfile ? (
              <form onSubmit={handleProfileSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Name</label>
                  <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Official Email</label>
                  <input type="email" value={profile.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input type="text" value={profile.phone === 'Not Provided' ? '' : profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-navy text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">Save</button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admin Name</p>
                  <p className="font-semibold text-navy">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Official Email</p>
                  <p className="font-semibold text-navy">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="font-semibold text-navy">{profile.phone}</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-2 px-5 py-2 bg-slate-100 text-navy rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors w-full"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Security */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Lock className="text-navy" size={18} />
            <h2 className="font-bold text-navy">Security</h2>
          </div>
          <div className="p-5 flex-1 space-y-6">
            <button 
              onClick={() => setIsPwdModalOpen(true)}
              className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <span className="font-bold text-navy text-sm">Change Password</span>
              <span className="text-slate-400">→</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-navy text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-slate-500">Require 2FA for admin login</p>
              </div>
              <Toggle enabled={security.twoFactor} onChange={toggle2FA} />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Login</p>
              <p className="text-sm font-medium text-slate-700">{security.lastLogin}</p>
            </div>
          </div>
        </div>

        {/* 3. Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Bell className="text-navy" size={18} />
            <h2 className="font-bold text-navy">Notification Settings</h2>
          </div>
          <div className="p-5 flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-navy text-sm">New Report Submitted</p>
              <Toggle enabled={notifications.newReport} onChange={() => toggleNotification('newReport')} />
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold text-navy text-sm">Team Assigned</p>
              <Toggle enabled={notifications.teamAssigned} onChange={() => toggleNotification('teamAssigned')} />
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold text-navy text-sm">Report Resolved</p>
              <Toggle enabled={notifications.reportResolved} onChange={() => toggleNotification('reportResolved')} />
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold text-navy text-sm">Report Rejected</p>
              <Toggle enabled={notifications.reportRejected} onChange={() => toggleNotification('reportRejected')} />
            </div>
          </div>
        </div>

        {/* 4. Report Settings */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <FileText className="text-navy" size={18} />
            <h2 className="font-bold text-navy">Report Settings</h2>
          </div>
          <div className="p-5 flex-1 space-y-5">
            <div>
              <label className="block text-sm font-bold text-navy mb-2">Default Report Priority</label>
              <select 
                value={reportSettings.defaultPriority}
                onChange={e => changeReportPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none font-medium text-slate-700"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-navy text-sm">Require Location for Report</p>
                <Toggle enabled={reportSettings.requireLocation} onChange={() => toggleReportSetting('requireLocation')} />
              </div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-navy text-sm">Require Image for Report</p>
                <Toggle enabled={reportSettings.requireImage} onChange={() => toggleReportSetting('requireImage')} />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Data & Reports */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Database className="text-navy" size={18} />
            <h2 className="font-bold text-navy">Data & Reports</h2>
          </div>
          <div className="p-5 flex-1 space-y-3">
            <button 
              onClick={handleExportCSV} 
              disabled={isExportingCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-70"
            >
              {isExportingCSV ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              {isExportingCSV ? "Generating CSV..." : "Export Reports"}
            </button>
            <button 
              onClick={handleDownloadAnalytics} 
              disabled={isExportingAnalytics}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-70"
            >
              {isExportingAnalytics ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              {isExportingAnalytics ? "Generating PDF..." : "Download Analytics"}
            </button>
            <button 
              onClick={() => setIsMonthlyModalOpen(true)} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-navy text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              <FileBarChart size={16} /> Generate Monthly Report
            </button>
          </div>
        </div>

        {/* 6. System Information */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Info className="text-navy" size={18} />
            <h2 className="font-bold text-navy">System Information</h2>
          </div>
          <div className="p-5 flex-1">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Website Name</p>
                <p className="font-semibold text-navy text-sm">{sysInfo.websiteName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Department</p>
                <p className="font-semibold text-navy text-sm">{sysInfo.departmentName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Helpline</p>
                <p className="font-semibold text-navy text-sm">{sysInfo.helpline}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Official Email</p>
                <p className="font-semibold text-navy text-sm">{sysInfo.email}</p>
              </div>
              
              <div className="flex items-center gap-4 pt-2 pb-2">
                <button onClick={() => setPolicyModal('terms')} className="text-xs font-bold text-emerald-600 hover:underline">Terms & Conditions</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setPolicyModal('privacy')} className="text-xs font-bold text-emerald-600 hover:underline">Privacy Policy</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Generate Monthly Report Modal */}
      {isMonthlyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isGenerating && setIsMonthlyModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-navy">Generate Monthly Report</h3>
              {!isGenerating && <button onClick={() => setIsMonthlyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Month:</label>
                <select 
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none"
                  disabled={isGenerating}
                >
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Year:</label>
                <select 
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none"
                  disabled={isGenerating}
                >
                  {["2024", "2025", "2026", "2027"].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={handleGenerateMonthly}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-navy text-white rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-70"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isGenerating ? "Generating report..." : "Generate Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {policyModal !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPolicyModal('none')}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h3 className="text-xl font-bold text-navy">
                {policyModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </h3>
              <button onClick={() => setPolicyModal('none')} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-5 text-sm text-slate-700">
              {policyModal === 'terms' ? (
                <>
                  <div>
                    <h4 className="font-bold text-navy mb-1">1. Accurate Information</h4>
                    <p>Users must provide accurate and genuine information when submitting a waste report.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">2. Genuine Reports Only</h4>
                    <p>Users must not submit fake, misleading, duplicate, or intentionally incorrect reports.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">3. Appropriate Images</h4>
                    <p>Uploaded images should clearly show the reported waste or issue and should not contain inappropriate content.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">4. Location Accuracy</h4>
                    <p>Users should provide the correct location of the reported waste so that the concerned team can take appropriate action.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">5. Report Verification</h4>
                    <p>All submitted reports may be reviewed and verified by the concerned government authority before action is taken.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">6. Misuse of Service</h4>
                    <p>Repeated misuse, spam, or submission of false reports may result in appropriate action, including restriction of access to the service.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">7. Data & Privacy</h4>
                    <p>Information submitted through reports may be stored and used by the concerned authority for complaint handling, waste-management operations, analytics, and record-keeping.</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-bold text-navy mb-1">1. Information We Collect</h4>
                    <p>We may collect information such as your name, contact details, submitted images, waste report details, location, date and time of submission, and report status.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">2. How We Use Your Information</h4>
                    <p>The collected information is used to process waste complaints, verify reports, assign government teams, track report progress, improve waste-management services, and maintain official records.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">3. Location Information</h4>
                    <p>Location information may be collected when you submit a waste report so that the reported issue can be accurately identified and handled. Location should not be continuously tracked unless explicitly required and permitted.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">4. Images and Reports</h4>
                    <p>Images and information submitted with a report may be reviewed by authorized government personnel for verification and resolution of the reported issue.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">5. Data Sharing</h4>
                    <p>Your submitted information may be accessible to authorized government officials, departments, or assigned waste-management teams when required to process and resolve your report. We do not sell your personal information.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">6. Data Security</h4>
                    <p>Reasonable security measures are used to protect submitted information from unauthorized access, misuse, or disclosure.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">7. Data Retention</h4>
                    <p>Report information may be retained for official records, complaint history, analytics, monitoring, and service improvement. Deleting or deactivating an account does not necessarily delete historical reports associated with that account.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">8. User Responsibility</h4>
                    <p>Users should provide accurate information and should not submit false, misleading, inappropriate, or duplicate reports.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">9. Policy Updates</h4>
                    <p>This Privacy Policy may be updated when necessary. Any important changes may be communicated through the website.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-navy mb-1">10. Contact & Support</h4>
                    <p>For questions or concerns regarding privacy or the use of your information, users can contact the official support/helpline provided on the website.</p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-6 shrink-0 border-t border-slate-100 mt-6">
              <button 
                onClick={() => setPolicyModal('none')}
                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPwdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPwdModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-navy">Change Password</h3>
              <button onClick={() => setIsPwdModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handlePwdChange} className="space-y-4">
              {pwdError && <p className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{pwdError}</p>}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                <input type="password" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                <input type="password" value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-navy outline-none" />
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
