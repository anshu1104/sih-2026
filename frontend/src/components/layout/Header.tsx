"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, LogOut, Coins, Gift, X, Share2, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('citizen');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("CVC-JOIN");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Lock this tab to this user using sessionStorage (per-tab, not shared)
        const tabUserId = sessionStorage.getItem('civicvision_tab_user');
        if (tabUserId && tabUserId !== user.id) {
          // Another tab changed the session — force re-login
          await supabase.auth.signOut();
          setUser(null);
          router.push('/auth/login');
          return;
        }
        sessionStorage.setItem('civicvision_tab_user', user.id);
        
        setUser(user);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setRole(profile.role);
      }
    }
    getUser();

    // Listen for cross-tab session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const tabUserId = sessionStorage.getItem('civicvision_tab_user');
      if (tabUserId && session?.user && session.user.id !== tabUserId) {
        // Session was overwritten by another tab — don't update this tab's UI
        return;
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        sessionStorage.removeItem('civicvision_tab_user');
      } else if (session?.user) {
        setUser(session.user);
        sessionStorage.setItem('civicvision_tab_user', session.user.id);
      }
    });
    
    // Check if google translate cookie is set to hindi
    const cookies = document.cookie.split(';');
    const isHindi = cookies.some(c => c.trim().startsWith('googtrans=') && c.includes('/hi'));
    if (isHindi) {
      setLang('hi');
    } else {
      setLang('en');
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleOpenModal = () => setIsReferModalOpen(true);
    window.addEventListener('openReferModal', handleOpenModal);
    return () => window.removeEventListener('openReferModal', handleOpenModal);
  }, []);

  const handleLogout = async () => {
    sessionStorage.removeItem('civicvision_tab_user');
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    if (newLang === 'hi') {
      document.cookie = "googtrans=/en/hi; path=/";
    } else {
      document.cookie = "googtrans=/en/en; path=/";
      // To clear it properly for some browsers:
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    window.location.reload();
  };

  const handleShare = async () => {
    const shareData = {
      title: "Join CivicVision",
      text: `Join me on CivicVision and help keep our city clean! Use my referral code: ${referralCode}`,
      url: window.location.origin
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      alert("Referral text copied to clipboard!");
    }
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="w-full px-6 md:px-8 h-20 flex items-center justify-between max-w-[1920px] mx-auto">
        
        {/* Left: Logo */}
        <div className="flex-1 flex justify-start min-w-max pr-2">
          <Link href="/" className="flex items-center gap-2 text-emerald-700 font-extrabold text-2xl tracking-tight hover:opacity-90 transition-opacity">
            <Leaf size={28} className="text-emerald-600 shrink-0" />
            <span className="notranslate whitespace-nowrap">CivicVision</span>
          </Link>
        </div>

        {/* Center: Navigation (Responsive Spacing) */}
        <nav className="flex-none flex items-center justify-center gap-3 md:gap-4 lg:gap-6 xl:gap-8">
          <Link href="/" className="whitespace-nowrap text-slate-600 font-bold hover:text-emerald-700 transition-colors text-[14px] lg:text-[15px] notranslate">
            {lang === 'hi' ? 'होम' : 'Home'}
          </Link>
          <Link href="/dashboard" className="whitespace-nowrap text-slate-600 font-bold hover:text-emerald-700 transition-colors text-[14px] lg:text-[15px]">
            My Reports
          </Link>
          <Link href="/support" className="whitespace-nowrap text-slate-600 font-bold hover:text-emerald-700 transition-colors text-[14px] lg:text-[15px]">
            Support
          </Link>
          {role === 'admin' || role === 'officer' ? (
             <Link href="/admin" className="whitespace-nowrap text-blue-600 font-bold hover:text-blue-800 transition-colors text-[14px] lg:text-[15px]">
               Municipal Dashboard
             </Link>
          ) : null}
          <Link 
            href="/report"
            className="whitespace-nowrap bg-[#10703c] text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold hover:bg-emerald-800 transition-colors shadow-md shadow-emerald-900/10 text-[14px] lg:text-[15px]"
          >
            Report Waste
          </Link>
        </nav>

        {/* Right: Rewards, Auth & Language */}
        <div className="flex-1 flex items-center justify-end gap-3 lg:gap-5 pl-2 min-w-max">
          
          {/* Rewards Section */}
          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsReferModalOpen(true)} 
              className="whitespace-nowrap flex items-center gap-1.5 text-slate-600 font-bold hover:text-orange-500 transition-colors text-[14px] lg:text-[15px]"
            >
              <Gift size={18} className="text-orange-500 shrink-0" />
              Refer & Earn
            </button>
            <Link href="/points" className="whitespace-nowrap flex items-center gap-1.5 text-slate-600 font-bold hover:text-yellow-500 transition-colors text-[14px] lg:text-[15px]">
              <Coins size={18} className="text-yellow-500 shrink-0" />
              My Points
            </Link>
            
            {user && (
              <Link href="/settings" className="flex items-center text-slate-600 font-bold hover:text-emerald-600 transition-colors ml-1 lg:ml-2 border-l border-slate-200 pl-3 lg:pl-4" title="Settings">
                <Settings size={20} className="shrink-0" />
              </Link>
            )}
          </div>

          {/* Language Toggle Switch */}
          <button 
            onClick={toggleLanguage}
            className="relative w-[72px] h-[34px] bg-slate-200 border-2 border-emerald-500 rounded-full flex items-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 notranslate shrink-0"
            aria-label="Toggle language"
          >
             {/* Background text */}
             <div className="w-full flex justify-between px-2.5 text-sm font-bold text-slate-500 absolute inset-0 items-center z-0 select-none">
                <span>A</span>
                <span className="font-sans">अ</span>
             </div>
             
             {/* Sliding White Thumb */}
             <div className={`absolute w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center font-bold text-emerald-800 text-sm transition-all duration-300 ease-in-out z-10 ${lang === 'hi' ? 'translate-x-[36px]' : 'translate-x-[1px]'}`}>
                {lang === 'en' ? 'A' : 'अ'}
             </div>
          </button>

          {/* User Auth Buttons */}
          <div className="border-l border-slate-200 h-8 flex items-center pl-4 lg:pl-6 shrink-0">
            {user ? (
               <div className="flex items-center gap-4">
                 {/* Avatar with dropdown */}
                 <div className="relative">
                   <button 
                     onClick={() => setIsProfileOpen(!isProfileOpen)}
                     className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm uppercase border border-emerald-200 hover:bg-emerald-200 transition-colors"
                   >
                     {user.email?.charAt(0)}
                   </button>
                   {isProfileOpen && (
                     <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-slate-100 p-3 min-w-[200px] z-50">
                       <div className="px-2 py-1 mb-2 border-b border-slate-100">
                         <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                         <p className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{user.email}</p>
                       </div>
                       <button 
                         onClick={handleLogout} 
                         className="whitespace-nowrap w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
                       >
                         <LogOut size={15} /> Sign Out
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-2 lg:gap-3">
                 <Link href="/auth/login" className="whitespace-nowrap text-slate-600 font-bold hover:text-emerald-700 px-2 lg:px-3 py-2 transition-colors text-[14px] lg:text-[15px]">
                   Login
                 </Link>
                 <Link href="/auth/signup" className="whitespace-nowrap bg-slate-900 text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors text-[14px] lg:text-[15px] shadow-sm shadow-slate-900/10">
                   Sign Up
                 </Link>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Refer & Earn Modal */}
      {isReferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsReferModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button 
              onClick={() => setIsReferModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={24} />
            </button>

            {/* Header/Logo */}
            <div className="bg-emerald-50/50 p-6 flex flex-col items-center justify-center border-b border-emerald-100">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center mb-3 text-emerald-600">
                <Leaf size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-navy">Refer & Earn</h2>
            </div>

            {/* Body */}
            <div className="p-8 text-center">
              <p className="text-slate-600 font-medium mb-2 text-lg">
                Invite your friends and earn coins!
              </p>
              <p className="text-slate-500 text-sm mb-6">
                When a user successfully refers someone and they create an account, you receive a reward.
              </p>

              <div className="inline-flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 font-extrabold text-xl py-3 px-6 rounded-2xl mb-8 shadow-sm">
                <Coins size={24} className="text-yellow-500" />
                Earn 100 Coins 🎉
              </div>

              {/* Referral Code Display */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 text-left relative">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Referral Code</p>
                <p className="text-navy font-mono font-bold text-lg">{referralCode}</p>
                <div className="absolute top-4 right-4 text-emerald-600">
                  <Gift size={20} className="opacity-50" />
                </div>
              </div>

              {/* Share Button */}
              <button 
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Share2 size={20} />
                Share Now
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
