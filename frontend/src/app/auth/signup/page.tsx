"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AuthSidebar from "@/components/layout/AuthSidebar";
import { User, Mail, Phone, Lock, Eye, EyeOff, Users, Building, Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("citizen");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // The Postgres trigger automatically creates the profile row on sign up.
      // We just need to update it with the selected role.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          role: role
        })
        .eq('id', data.user.id);
        
      if (profileError) {
        console.error("Profile update error:", profileError);
      }
    }
    
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex w-full">
        <AuthSidebar />
        <div className="flex-1 flex flex-col justify-center items-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-emerald-100 text-[#10703c] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Account Created!</h2>
            <p className="text-slate-500 mb-6">Welcome to CivicVision. You can now log in to your account.</p>
            <Link href="/auth/login" className="inline-block w-full py-3 bg-[#10703c] text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex w-full">
      <AuthSidebar />

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 relative max-h-screen overflow-y-auto">
        <div className="w-full max-w-md">
          
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Create your CivicVision Account</h2>
            <p className="text-sm text-slate-500">Join us in making our cities cleaner and better.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  placeholder="Create a password"
                  minLength={6}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 mt-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                
                {/* Citizen Option */}
                <label className={`relative border rounded-xl p-3 flex items-start cursor-pointer transition-all ${
                  role === 'citizen' ? 'border-emerald-600 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-300'
                }`}>
                  <div className="flex items-center h-5">
                    <input
                      name="role"
                      type="radio"
                      value="citizen"
                      checked={role === 'citizen'}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className="block text-sm font-bold text-slate-900 flex items-center gap-1">
                      <Users size={14} className="text-emerald-700" /> Citizen
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">
                      I want to report and track issues
                    </span>
                  </div>
                </label>

                {/* Authority Option */}
                <label className={`relative border rounded-xl p-3 flex items-start cursor-pointer transition-all ${
                  role === 'admin' ? 'border-emerald-600 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-300'
                }`}>
                  <div className="flex items-center h-5">
                    <input
                      name="role"
                      type="radio"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className="block text-sm font-bold text-slate-900 flex items-center gap-1">
                      <Building size={14} className="text-emerald-700" /> Authority
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">
                      I am an authorized government official
                    </span>
                  </div>
                </label>

              </div>
            </div>

            <div className="flex items-center mt-4 mb-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-slate-600">
                I agree to the <a href="#" className="font-bold text-emerald-600 hover:text-emerald-500">Terms & Conditions</a> and <a href="#" className="font-bold text-emerald-600 hover:text-emerald-500">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#10703c] hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 transition-colors"
            >
              {loading ? "Creating account..." : "CREATE ACCOUNT"}
            </button>
            
            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-bold text-emerald-600 hover:text-emerald-500">
                Login
              </Link>
            </p>
          </form>

        </div>
        
        {/* Bottom Lock Icon */}
        <div className="absolute bottom-4 w-full max-w-md flex justify-between items-center text-xs text-slate-500 font-medium pb-2">
           <div className="flex items-center gap-1.5 text-emerald-700">
              <Lock size={14} /> Your information is encrypted and secure
           </div>
           <select className="bg-transparent border-none focus:ring-0 text-slate-500 font-medium cursor-pointer">
              <option>English</option>
              <option>Hindi</option>
           </select>
        </div>
      </div>
    </div>
  );
}
