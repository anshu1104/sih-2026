import { ShieldCheck, Building2, Cpu, Leaf } from "lucide-react";

export default function AuthSidebar() {
  return (
    <div className="hidden lg:flex w-[45%] bg-slate-50 flex-col justify-between border-r border-slate-200 relative overflow-hidden">
      {/* Top Header */}
      <div className="p-8 pb-0">
        <div className="flex items-center gap-3 text-slate-600 mb-12">
          {/* Emblem placeholder */}
          <div className="w-8 h-8 flex items-center justify-center grayscale opacity-80">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div className="text-xs font-bold leading-tight">
            Government of India<br/>
            <span className="font-normal">Swachh Bharat, Swasth Bharat</span>
          </div>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-emerald-700 text-white p-2 rounded-xl">
             <Leaf size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">CivicVision</h1>
        </div>
        <p className="text-lg font-medium text-slate-600 mb-8">
          Cleaner Cities. Smarter Governance.
        </p>

        <p className="text-slate-500 mb-10 leading-relaxed max-w-sm">
          CivicVision uses AI to detect waste from images, generate reports and help authorities create cleaner, healthier and smarter cities.
        </p>

        {/* Value Props */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="mt-1"><ShieldCheck className="text-emerald-600" size={24} /></div>
            <div>
              <h3 className="font-bold text-slate-800">Secure & Privacy Focused</h3>
              <p className="text-sm text-slate-500">Your data is safe with us</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1"><Building2 className="text-emerald-600" size={24} /></div>
            <div>
              <h3 className="font-bold text-slate-800">Government Civic Platform</h3>
              <p className="text-sm text-slate-500">Official platform for citizens and authorities</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1"><Cpu className="text-emerald-600" size={24} /></div>
            <div>
              <h3 className="font-bold text-slate-800">AI-Assisted Reporting</h3>
              <p className="text-sm text-slate-500">Smart detection for faster and better resolution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Illustration */}
      <div className="relative h-64 mt-8 bg-emerald-50 w-full overflow-hidden flex items-end justify-center">
         {/* Simple CSS illustration for city skyline and truck */}
         <div className="absolute bottom-0 w-full flex items-end justify-around px-4 opacity-20">
           <div className="w-16 h-32 bg-emerald-800"></div>
           <div className="w-12 h-48 bg-emerald-900"></div>
           <div className="w-20 h-24 bg-emerald-700"></div>
           <div className="w-14 h-40 bg-emerald-800"></div>
           <div className="w-16 h-28 bg-emerald-900"></div>
         </div>
         <div className="relative z-10 w-full bg-emerald-700 h-16 flex items-center px-8 justify-between">
           <div className="flex items-center gap-2 text-emerald-100 font-medium">
             <ShieldCheck size={16} /> Trusted by Municipal Corporations across India
           </div>
         </div>
      </div>
    </div>
  );
}
