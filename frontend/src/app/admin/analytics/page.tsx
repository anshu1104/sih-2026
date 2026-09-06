"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { reportService } from "@/services/reportService";
import { Filter } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

export default function AnalyticsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState("30d");
  const [wasteType, setWasteType] = useState("All");
  const [location, setLocation] = useState("All");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await reportService.getAllReports();
        setReports(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Compute unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    reports.forEach(r => {
      if (r.address) locs.add(r.address);
    });
    return Array.from(locs).sort();
  }, [reports]);

  // Apply filters
  const filteredReports = useMemo(() => {
    const now = new Date();
    const rangeMap: any = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '6m': 6 * 30 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    };

    return reports.filter(r => {
      // Date Filter
      if (dateRange !== 'all') {
        const rDate = new Date(r.created_at);
        if (now.getTime() - rDate.getTime() > rangeMap[dateRange]) return false;
      }
      // Waste Type Filter
      if (wasteType !== 'All' && r.waste_type?.toLowerCase() !== wasteType.toLowerCase()) return false;
      // Location Filter
      if (location !== 'All' && r.address !== location) return false;

      return true;
    });
  }, [reports, dateRange, wasteType, location]);

  // 1. Top KPI Cards
  const totalReports = filteredReports.length;
  let resolvedReports = 0;
  let inProgressReports = 0;
  let rejectedReports = 0;
  let totalResolutionTime = 0;
  let fastestResolution = Infinity;
  let longestResolution = 0;
  let resolvedWithTimeCount = 0;

  const locationStats = new Map();
  const segregationStats = new Map([
    ['Wet Waste', 0],
    ['Dry Waste', 0],
    ['Manual Verification', 0],
    ['Unknown', 0]
  ]);
  const wasteStats = new Map();
  const teamStats = new Map();
  const timeSeriesData = new Map();

  filteredReports.forEach(r => {
    const status = (r.status || 'pending').toLowerCase();
    const isResolved = status === 'resolved' || status === 'closed';
    const isRejected = status === 'rejected';
    const isActive = !isResolved && !isRejected;

    if (isResolved) resolvedReports++;
    if (isRejected) rejectedReports++;
    if (isActive) inProgressReports++;

    // Resolution Time (only for resolved)
    if (isResolved && r.updated_at && r.created_at) {
      const start = new Date(r.created_at).getTime();
      const end = new Date(r.updated_at).getTime();
      if (end >= start) {
        const diffHrs = (end - start) / (1000 * 60 * 60);
        totalResolutionTime += diffHrs;
        resolvedWithTimeCount++;
        if (diffHrs < fastestResolution) fastestResolution = diffHrs;
        if (diffHrs > longestResolution) longestResolution = diffHrs;
      }
    }

    // Location Stats
    const loc = r.address || 'Unknown';
    if (!locationStats.has(loc)) locationStats.set(loc, { location: loc, total: 0, resolved: 0 });
    const ls = locationStats.get(loc);
    ls.total++;
    if (isResolved) ls.resolved++;

    // Waste Type & Segregation Stats
    const rawWt = r.waste_type || 'Unknown';
    let wt = rawWt;
    let seg = 'Unknown';
    
    if (rawWt.includes('||')) {
      const parts = rawWt.split('||');
      wt = parts[0];
      seg = parts[1];
    } else {
      // Legacy data fallback (simple rule mapping)
      const wtLower = wt.toLowerCase();
      if (['plastic', 'metal', 'glass', 'paper', 'cardboard', 'e-waste'].some(x => wtLower.includes(x))) seg = 'Dry Waste';
      else if (['food', 'vegetable', 'fruit', 'organic'].some(x => wtLower.includes(x))) seg = 'Wet Waste';
    }

    // Waste Type Stats
    if (!wasteStats.has(wt)) wasteStats.set(wt, { name: wt, count: 0 });
    wasteStats.get(wt).count++;

    // Segregation Stats
    if (seg === 'Manual Verification Required' || seg === 'Unknown' || seg.includes('Manual')) {
      segregationStats.set('Manual Verification', segregationStats.get('Manual Verification') + 1);
    } else if (seg === 'Wet Waste') {
      segregationStats.set('Wet Waste', segregationStats.get('Wet Waste') + 1);
    } else if (seg === 'Dry Waste') {
      segregationStats.set('Dry Waste', segregationStats.get('Dry Waste') + 1);
    } else {
      segregationStats.set('Unknown', segregationStats.get('Unknown') + 1);
    }

    // Team Stats
    if (r.assigned_team) {
      const team = r.assigned_team;
      if (!teamStats.has(team)) teamStats.set(team, { name: team, assigned: 0, resolved: 0, active: 0 });
      const ts = teamStats.get(team);
      ts.assigned++;
      if (isResolved) ts.resolved++;
      if (isActive) ts.active++;
    }

    // Time Series
    // Convert to IST (Asia/Kolkata) date string for grouping
    const dateObj = new Date(r.created_at);
    const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(dateObj); // YYYY-MM-DD
    
    if (!timeSeriesData.has(dateStr)) timeSeriesData.set(dateStr, { date: dateStr, submitted: 0, resolved: 0 });
    timeSeriesData.get(dateStr).submitted++;
    if (isResolved) timeSeriesData.get(dateStr).resolved++;
  });

  const resolutionRate = totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : "0.0";
  
  // Averages
  const avgResolutionHrs = resolvedWithTimeCount > 0 ? (totalResolutionTime / resolvedWithTimeCount) : 0;

  const formatTime = (hrs: number) => {
    if (!isFinite(hrs)) return "N/A";
    if (hrs === 0) return "< 1 min";
    if (hrs < 1) return `${Math.round(hrs * 60)} min`;
    return `${hrs.toFixed(1)} hrs`;
  };

  // Chart Data Formatting
  const locationData = Array.from(locationStats.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  const wasteData = Array.from(wasteStats.values()).sort((a, b) => b.count - a.count);
  const teamData = Array.from(teamStats.values()).sort((a, b) => {
     const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
     const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
     return numA - numB;
  });
  const timeData = Array.from(timeSeriesData.values()).sort((a, b) => a.date.localeCompare(b.date));

    const segregationData = Array.from(segregationStats.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);
  const totalSegregated = segregationData.reduce((acc, curr) => acc + curr.value, 0) || 1;
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
         Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Analytics Dashboard</h1>
          <p className="text-slate-500 text-sm">Monitor system performance, report trends, and team efficiency.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center pl-2 text-slate-400">
            <Filter size={16} />
          </div>
          
          <select 
            value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="text-sm font-medium bg-transparent border-none text-slate-600 focus:ring-0 cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
          <div className="w-px h-4 bg-slate-200"></div>
          
          <select 
            value={wasteType} onChange={e => setWasteType(e.target.value)}
            className="text-sm font-medium bg-transparent border-none text-slate-600 focus:ring-0 cursor-pointer"
          >
            <option value="All">All Waste Types</option>
            <option value="Plastic">Plastic</option>
            <option value="Household">Household</option>
            <option value="Organic">Organic</option>
            <option value="Construction">Construction</option>
            <option value="E-Waste">E-Waste</option>
            <option value="Other">Other</option>
          </select>
          <div className="w-px h-4 bg-slate-200"></div>

          <select 
            value={location} onChange={e => setLocation(e.target.value)}
            className="text-sm font-medium bg-transparent border-none text-slate-600 focus:ring-0 cursor-pointer max-w-[150px]"
          >
            <option value="All">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc.length > 20 ? loc.substring(0,20)+'...' : loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-3xl font-bold text-navy">{totalReports}</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Total Reports</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-b-4 border-b-emerald-500">
          <p className="text-3xl font-bold text-emerald-600">{resolvedReports}</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Resolved Reports</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-b-4 border-b-blue-500">
          <p className="text-3xl font-bold text-blue-600">{inProgressReports}</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">In Progress</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-b-4 border-b-red-500">
          <p className="text-3xl font-bold text-red-600">{rejectedReports}</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Rejected Reports</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm bg-gradient-to-br from-navy to-slate-800 text-white">
          <p className="text-3xl font-bold text-white">{resolutionRate}%</p>
          <p className="text-xs font-medium text-slate-300 uppercase tracking-wider mt-1">Resolution Rate</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* 2. Reports Over Time */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-navy mb-6 shrink-0">Reports Submitted Over Time</h2>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickMargin={10} minTickGap={20} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Waste Type Analysis */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-navy mb-2 shrink-0">Reports by Waste Type</h2>
          <div className="flex-1 min-h-0 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {wasteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{fontSize: '12px'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Location Analysis */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 shrink-0">
            <h2 className="text-lg font-bold text-navy">Reports by Location</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3 text-center">Total</th>
                  <th className="px-5 py-3 text-center">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locationData.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-400">No data available</td></tr>
                ) : locationData.map((loc, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-navy truncate max-w-[120px]" title={loc.location}>{loc.location}</td>
                    <td className="px-5 py-3 text-center font-bold">{loc.total}</td>
                    <td className="px-5 py-3 text-center text-emerald-600 font-bold">{loc.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Team Performance */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-navy mb-4 shrink-0">Team Performance</h2>
          <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 overflow-y-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[9px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2">Team</th>
                    <th className="px-3 py-2 text-center">Asg.</th>
                    <th className="px-3 py-2 text-center text-emerald-600">Res.</th>
                    <th className="px-3 py-2 text-center text-orange-500">Act.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamData.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-slate-400">No teams assigned yet</td></tr>
                  ) : teamData.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold text-navy whitespace-nowrap">{t.name}</td>
                      <td className="px-3 py-2 text-center font-medium">{t.assigned}</td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-600">{t.resolved}</td>
                      <td className="px-3 py-2 text-center font-bold text-orange-500">{t.active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="w-full md:w-2/3 h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} />
                  <YAxis tick={{fontSize: 11, fill: '#64748b'}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="active" name="Active" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Average Resolution Time */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy mb-4">Average Resolution Time</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col justify-center items-center p-6 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">System Average</p>
            <p className="text-4xl font-bold text-navy">{formatTime(avgResolutionHrs)}</p>
          </div>
          <div className="flex flex-col justify-center items-center p-6 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider mb-2">Fastest Resolution</p>
            <p className="text-4xl font-bold text-emerald-700">{formatTime(fastestResolution)}</p>
          </div>
          <div className="flex flex-col justify-center items-center p-6 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-sm font-medium text-orange-600 uppercase tracking-wider mb-2">Longest Resolution</p>
            <p className="text-4xl font-bold text-orange-700">{formatTime(longestResolution)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
