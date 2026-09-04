"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, MapPin, Camera, ArrowRight, Leaf } from "lucide-react";
import Header from "@/components/Header";

export default function LandingPage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const isHindi = cookies.some(c => c.trim().startsWith('googtrans=') && c.includes('/hi'));
    if (isHindi) {
      setLang('hi');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-primary text-sm font-medium">
                <ShieldCheck size={16} />
                <span><span className="notranslate">AI</span>-Powered Verification</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-navy leading-tight notranslate">
                {lang === 'hi' ? (
                  <>स्वच्छ शहरों के लिए <span className="notranslate">AI</span>-आधारित अपशिष्ट पहचान</>
                ) : (
                  <><span className="notranslate">AI</span>-Powered Waste Detection for Cleaner Cities</>
                )}
              </h1>
              <p className="text-lg text-slate-600 max-w-xl">
                Citizens can upload or capture waste images, <span className="notranslate">AI</span> verifies the waste, location is attached, and the complaint is sent to municipal authorities for fast resolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/report" className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded text-lg font-medium hover:bg-primary-light transition-colors">
                  <Camera size={20} />
                  Report Waste
                </Link>
                <Link href="/#how-it-works" className="flex items-center justify-center gap-2 bg-slate-100 text-navy px-6 py-3 rounded text-lg font-medium hover:bg-slate-200 transition-colors">
                  How It Works
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              {/* Civic generated illustration */}
              <div className="w-full max-w-md aspect-square bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden shadow-xl shadow-emerald-900/5">
                <img 
                  src="/hero-illustration.jpg" 
                  alt="Smart City Waste Management" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary text-white py-12">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold notranslate">AI</p>
              <p className="text-emerald-100 font-medium">Verified Reports</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold">48 hr</p>
              <p className="text-emerald-100 font-medium">Avg. Resolution</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold">Active</p>
              <p className="text-emerald-100 font-medium">Citizen Network</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold">Cleaner</p>
              <p className="text-emerald-100 font-medium">Municipal Areas</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-bold text-navy">How CivicVision Works</h2>
              <p className="text-slate-600">A transparent, efficient process connecting citizens with municipal authorities.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Capture & Detect", desc: "Take a photo of waste. Our YOLO AI model instantly verifies the waste type.", icon: Camera },
                { step: "2", title: "Pin Location", desc: "Attach GPS coordinates automatically to ensure authorities know exactly where to go.", icon: MapPin },
                { step: "3", title: "Municipality Resolves", desc: "The complaint is routed to the municipal team. Once resolved, you verify the completion.", icon: ShieldCheck },
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 relative">
                  <div className="w-12 h-12 bg-emerald-100 text-primary rounded flex items-center justify-center mb-6">
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3">{item.step}. {item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-slate-400 py-8 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; 2026 CivicVision Municipal System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
