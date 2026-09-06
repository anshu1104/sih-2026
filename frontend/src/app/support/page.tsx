"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Camera, Search, AlertTriangle, ChevronDown, ChevronUp, MapPin, Mail, Phone, Leaf } from "lucide-react";

const faqs = [
  {
    question: "What type of waste can I report?",
    answer: "You can report solid waste, plastic accumulation, overflowing public dustbins, construction debris, and dead animals on public roads."
  },
  {
    question: "How long does action take?",
    answer: "Most reports are reviewed within 24 hours. The cleanup action typically occurs within 48 to 72 hours depending on the priority and severity of the issue."
  },
  {
    question: "Is my personal information safe?",
    answer: "Yes, your personal information is strictly confidential. Only authorized municipal officers can see your contact details to follow up if needed."
  },
  {
    question: "Can I submit anonymously?",
    answer: "Currently, you must create an account to submit a report. This helps us prevent spam and award you Civic Points for your contributions."
  }
];

export default function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      {/* Support Hero */}
      <div className="bg-gradient-to-b from-emerald-50 to-white py-20 px-4 text-center border-b border-emerald-100">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
          Help & Support
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
          Find answers to common questions, learn how to use CivicVision, or reach out to our team.
        </p>
      </div>

      <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
        
        {/* Top Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          
          {/* Card 1: How to report */}
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full min-h-[420px]">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 shrink-0">
              <Camera size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">How to Report Waste</h2>
            <ol className="space-y-4 text-slate-600 list-decimal list-inside text-base leading-relaxed grow">
              <li>Open the <strong>Report Waste</strong> page.</li>
              <li>Allow location access or search for the area manually.</li>
              <li>Upload a clear photo of the garbage.</li>
              <li>Wait for the AI to verify the waste type.</li>
              <li>Click <strong>Submit Report</strong>.</li>
            </ol>
          </div>

          {/* Card 2: Track */}
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full min-h-[420px]">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shrink-0">
              <Search size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Track My Report</h2>
            <div className="space-y-4 text-base text-slate-600 mb-8 grow">
              <p><strong>Submitted:</strong> Received successfully.</p>
              <p><strong>AI Verified:</strong> Confirmed as valid waste.</p>
              <p><strong>In Progress:</strong> Cleanup team dispatched.</p>
              <p><strong>Resolved:</strong> Area is cleaned.</p>
            </div>
            <Link href="/dashboard" className="w-full inline-block text-center py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors text-base mt-auto">
              Open My Reports
            </Link>
          </div>

          {/* Card 3: Problems */}
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full min-h-[420px]">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8 shrink-0">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Problem With My Report</h2>
            <ul className="space-y-4 text-slate-600 text-base leading-relaxed grow">
              <li className="flex gap-3"><span className="text-orange-500 font-bold">•</span> <span><strong>Photo not uploading?</strong> Check file size (Max 5MB).</span></li>
              <li className="flex gap-3"><span className="text-orange-500 font-bold">•</span> <span><strong>Wrong location?</strong> Adjust the pin on the map before submitting.</span></li>
              <li className="flex gap-3"><span className="text-orange-500 font-bold">•</span> <span><strong>Status not updating?</strong> Updates only occur during working hours.</span></li>
            </ul>
          </div>

        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-extrabold text-navy text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none"
                >
                  <span className="font-bold text-navy">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp size={20} className="text-emerald-600" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-5 pt-1 text-slate-600 border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Rich Contact Footer (Based on requested layout) */}
      <footer className="bg-[#0b1f38] text-slate-300 py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Brand & Nav */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                 <Leaf size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-white">CivicVision</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              Official platform for citizens and authorities to track, report, and manage city waste efficiently.
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
              <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link>
              <Link href="/report" className="hover:text-emerald-400 transition-colors">Report Waste</Link>
              <Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <span>Smart City Operations Center,<br/>Sector 12, Bhubaneswar - 751024</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-emerald-500 shrink-0" size={18} />
                <span>Helpline: +91-1800-11-2233<br/><span className="text-xs text-slate-500">(10:00 AM – 5:00 PM)</span></span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-emerald-500 shrink-0" size={18} />
                <span>support@civicvision.gov.in</span>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Subscribe Newsletter</h3>
            <div className="flex mb-8">
              <input 
                type="email" 
                placeholder="Your Email" 
                className="w-full px-4 py-2 bg-white text-slate-900 rounded-l-md focus:outline-none"
              />
              <button className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-r-md transition-colors text-white">
                Submit
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-4">Connect With Us</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 transition-colors text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 transition-colors text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 transition-colors text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 transition-colors text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

        </div>
        
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row justify-between items-center text-slate-500">
          <p>© 2026 CivicVision All rights reserved.</p>
          <p className="mt-2 md:mt-0">Powered by CivicTech India</p>
        </div>
      </footer>
    </div>
  );
}
