"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Coins, Trophy, Plus, Gift, FileText, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface PointEvent {
  id: string;
  title: string;
  points: number;
  date: string;
  icon: React.ElementType;
}

export default function MyPointsPage() {
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in to view your points.");
          setLoading(false);
          return;
        }

        // 1. Fetch total points
        const { data: profile } = await supabase
          .from("profiles")
          .select("civic_points")
          .eq("id", user.id)
          .single();

        setTotalPoints(profile?.civic_points || 0);

        // 2. Fetch reports to build a history
        const { data: reports } = await supabase
          .from("reports")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const history: PointEvent[] = [];
        
        // Mock a welcome bonus
        history.push({
          id: "welcome",
          title: "Welcome Bonus",
          points: 100,
          date: new Date(user.created_at || Date.now()).toISOString(),
          icon: Gift
        });

        // Add report points
        if (reports) {
          reports.forEach((r) => {
            history.push({
              id: r.id,
              title: "Report Submitted",
              points: 50,
              date: r.created_at,
              icon: FileText
            });
          });
        }

        // Sort combined history by date descending
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(history);
        
        // Calculate total points dynamically
        const calculatedTotal = history.reduce((sum, event) => sum + event.points, 0);
        setTotalPoints(calculatedTotal);
      } catch (err: any) {
        setError(err.message || "Failed to load points");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="text-yellow-500" size={32} />
          <h1 className="text-3xl font-extrabold text-navy">My Points</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8">
             {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Total Points Card */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20 text-center sticky top-28">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coins size={36} className="text-white" />
                </div>
                <p className="text-yellow-100 font-bold mb-2 uppercase tracking-wider text-sm">Total Cumulative Points</p>
                <h2 className="text-6xl font-black mb-6">{totalPoints}</h2>
                <div className="bg-white/10 p-4 rounded-2xl mb-6 text-sm">
                  Earn points by reporting waste and keeping the city clean!
                </div>
                <button onClick={() => window.dispatchEvent(new Event('openReferModal'))} className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors w-full justify-center">
                  Refer & Earn More <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Points History */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Points History</h3>
                
                {events.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No points earned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-colors border border-slate-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <event.icon size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{event.title}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(event.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-xl bg-emerald-100 px-4 py-2 rounded-xl">
                          <Plus size={18} strokeWidth={3} />
                          <span>{event.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
