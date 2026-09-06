"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, MapPin, Globe, HelpCircle, LogOut, Check, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Header from "@/components/layout/Header";

export default function SettingsPage() {
  const router = useRouter();
  
  // User Data State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({ full_name: "", email: "", phone: "" });
  
  // Modals & Forms State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Toggles State
  const [useLocation, setUseLocation] = useState(true);
  const [language, setLanguage] = useState("en");

  // Auth fetch
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      setProfile({
        full_name: profileData?.full_name || "Citizen User",
        email: user.email || "",
        phone: user.user_metadata?.phone || "Not Provided"
      });
      setLoading(false);
    };
    
    // Check language cookie
    const cookies = document.cookie.split(';');
    const isHindi = cookies.some(c => c.trim().startsWith('googtrans=') && c.includes('/hi'));
    if (isHindi) setLanguage('hi');

    fetchUser();
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Update name in profiles
    await supabase.from("profiles").update({
      full_name: profile.full_name
    }).eq("id", user.id);
    
    // Update phone in auth metadata
    await supabase.auth.updateUser({
      data: { phone: profile.phone }
    });
    
    setIsEditingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdError("");
    
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match");
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      setPwdError("Wrong current password");
      return;
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setPwdError(updateError.message);
    } else {
      setPwdMsg("Your password has been changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPwdMsg("");
        setIsChangingPassword(false);
      }, 4000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };
  
  const handleDeleteAccount = async () => {
    // 1. Scramble the password to deactivate login access
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase() + "!@123XyZ";
    await supabase.auth.updateUser({
      password: randomPassword,
      data: { is_deleted: true }
    });
    
    setIsDeleteModalOpen(false);
    setIsDeleteSuccessOpen(true);

    // Wait a few seconds to let them read the success message, then logout
    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/");
    }, 4000);
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    document.cookie = `googtrans=/en/${val}; path=/`;
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Helper toggle component
  const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) => (
    <button 
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors flex items-center shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <span className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`}></span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Header />
      
      {/* Toast Notification */}
      {pwdMsg && (
        <div className="fixed top-24 right-4 left-4 sm:left-auto z-[200] bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 animate-in fade-in slide-in-from-top-6 duration-300">
          <Check size={20} className="shrink-0 stroke-[3]" />
          <span className="font-bold text-sm tracking-wide">{pwdMsg}</span>
        </div>
      )}

      {/* Made the container wider as requested (max-w-5xl) */}
      <div className="max-w-5xl mx-auto px-4 pt-28">
        <h1 className="text-3xl font-extrabold text-navy mb-8">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Profile Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <User className="text-emerald-600" size={20} />
              <h2 className="text-lg font-bold text-navy">Profile</h2>
            </div>
            <div className="p-6 flex-1">
              {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                    <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                    <input type="email" value={profile.email} disabled className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
                    <input type="text" value={profile.phone === 'Not Provided' ? '' : profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 9876543210" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">Save Changes</button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</p>
                      <p className="font-semibold text-navy text-xl">{profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="font-semibold text-navy text-lg">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</p>
                      <p className="font-semibold text-navy text-lg">{profile.phone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="mt-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors inline-block"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            
            {/* 2. Security Section (Change Password) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <Lock className="text-emerald-600" size={20} />
                <h2 className="text-lg font-bold text-navy">Security</h2>
              </div>
              <div className="p-6">
                {isChangingPassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {pwdError && <p className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{pwdError}</p>}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">Update Password</button>
                      <button type="button" onClick={() => { setIsChangingPassword(false); setPwdError(""); }} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setIsChangingPassword(true)}
                      className="px-6 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors inline-block"
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Location Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <MapPin className="text-emerald-600" size={20} />
                <h2 className="text-lg font-bold text-navy">Location</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-navy text-lg">Use Current Location While Reporting</p>
                    <p className="text-sm text-slate-500 mt-1">Allows one-click GPS coordinates when submitting a new waste report.</p>
                  </div>
                  <Toggle enabled={useLocation} onChange={setUseLocation} />
                </div>
              </div>
            </div>

            {/* 4. Language Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <Globe className="text-emerald-600" size={20} />
                <h2 className="text-lg font-bold text-navy">Language</h2>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-navy text-lg">Interface Language</p>
                  <p className="text-sm text-slate-500 mt-1">Changes the display language across the portal.</p>
                </div>
                <select 
                  value={language}
                  onChange={e => handleLanguageChange(e.target.value)}
                  className="px-4 py-2 border-2 border-slate-200 rounded-xl bg-white font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>

          </div>
        </div>
        
        {/* Help & Support (Full Width below grid) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <HelpCircle className="text-emerald-600" size={20} />
            <h2 className="text-lg font-bold text-navy">Help & Support</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <Link href="/report" className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl transition-colors group">
                <p className="font-bold text-slate-700 group-hover:text-emerald-700">How to Report</p>
              </Link>
              <Link href="/dashboard" className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl transition-colors group">
                <p className="font-bold text-slate-700 group-hover:text-emerald-700">Track My Report</p>
              </Link>
              <Link href="/support" className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl transition-colors group">
                <p className="font-bold text-slate-700 group-hover:text-emerald-700">FAQs</p>
              </Link>
              <Link href="/support" className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl transition-colors group">
                <p className="font-bold text-slate-700 group-hover:text-emerald-700">Contact Support</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-navy text-lg">Account Actions</p>
              <p className="text-sm text-slate-500 mt-1">Manage your session or permanently delete your account access.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
              >
                <Trash2 size={18} /> Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-navy mb-2">Logout</h3>
            <p className="text-slate-500 font-medium mb-8">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Logout</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-navy mb-3">⚠️ Delete Your Account?</h3>
            <p className="text-navy font-bold text-lg mb-4">Are you sure you want to delete your account?</p>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-8 text-left">
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                After deleting your account, you will no longer be able to log in using this email address. Your previously submitted reports and related records will remain securely stored in the system and will still be available to the Admin.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors order-2 sm:order-1"
              >
                No, Keep Account
              </button>
              <button 
                onClick={handleDeleteAccount} 
                className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors order-1 sm:order-2 shadow-lg shadow-red-600/20"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Success Modal */}
      {isDeleteSuccessOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-navy mb-3">✓ Account Deleted</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Your account has been successfully deleted. Your previous reports and records have been securely retained for administrative and record-keeping purposes.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
