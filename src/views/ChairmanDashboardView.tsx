import React, { useState, useEffect } from 'react';
import type { DashboardMetrics } from '../types';
import { api } from '../services/api';
import { KpiCard, LoadingState, ErrorState } from '../components/common/FeedbackStates';
import {
  Users,
  UserCheck,
  HeartHandshake,
  Clock,
  Calendar,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  Award,
  Layers,
  BarChart,
} from 'lucide-react';

export const ChairmanDashboardView: React.FC<{ onNavigate?: (tab: string) => void }> = ({
  onNavigate,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const res = await api.getDashboard();
      if (res && res.success) {
        const rawData = res.data || (res as any).result || res;
        setMetrics(rawData);
      } else {
        setErrorMsg(res?.message || 'Failed to load executive dashboard.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error fetching dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingState message="Aggregating academy CRM performance analytics..." />;
  }

  if (errorMsg) {
    return <ErrorState message={errorMsg} onRetry={() => fetchDashboard()} />;
  }

  const d = metrics || {
    totalLeads: 0,
    qualified: 0,
    interested: 0,
    pendingFollowups: 0,
    todaysFollowups: 0,
    overdueFollowups: 0,
    admissions: 0,
    conversionRate: 0,
    salespersonPerformance: [],
    coursePerformance: [],
    sourcePerformance: [],
    priorityDistribution: [],
  };

  const teamList =
    d.salespersonPerformance ||
    (d as any).salespeople ||
    (d as any).team ||
    [];

  const courseList =
    d.coursePerformance ||
    (d as any).courses ||
    [];

  const sourceList =
    d.sourcePerformance ||
    (d as any).sources ||
    [];

  return (
    <div className="space-y-5 pb-16 md:pb-8">
      {/* Top Welcome & Refresh Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#072A4A] text-white p-5 rounded-xl border border-[#0B3A66] shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E7D58A]">
            Executive Oversight
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
            Academy Performance Dashboard
          </h1>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 8 Main Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KpiCard
          title="Total Leads"
          value={d.totalLeads ?? 0}
          subtitle="All recorded leads"
          icon={Users}
          highlightColor="bg-blue-50 text-[#0B3A66]"
          onClick={() => onNavigate?.('leads')}
        />

        <KpiCard
          title="Qualified"
          value={d.qualified ?? 0}
          subtitle="High intent profiles"
          icon={UserCheck}
          highlightColor="bg-indigo-50 text-indigo-700"
          onClick={() => onNavigate?.('leads')}
        />

        <KpiCard
          title="Interested"
          value={d.interested ?? 0}
          subtitle="Warm & hot prospects"
          icon={HeartHandshake}
          highlightColor="bg-teal-50 text-teal-700"
          onClick={() => onNavigate?.('leads')}
        />

        <KpiCard
          title="Pending Follow-ups"
          value={d.pendingFollowups ?? 0}
          subtitle="Awaiting action"
          icon={Clock}
          highlightColor="bg-slate-100 text-slate-700"
          onClick={() => onNavigate?.('followups')}
        />

        <KpiCard
          title="Today's Follow-ups"
          value={d.todaysFollowups ?? 0}
          subtitle="Scheduled for today"
          icon={Calendar}
          highlightColor="bg-amber-50 text-amber-700"
          onClick={() => onNavigate?.('followups')}
        />

        <KpiCard
          title="Overdue Follow-ups"
          value={d.overdueFollowups ?? 0}
          subtitle="Action required"
          icon={AlertTriangle}
          highlightColor="bg-rose-50 text-rose-700"
          onClick={() => onNavigate?.('followups')}
        />

        <KpiCard
          title="Admissions"
          value={d.admissions ?? 0}
          subtitle="Confirmed enrolled students"
          icon={GraduationCap}
          highlightColor="bg-emerald-50 text-[#16834B]"
          onClick={() => onNavigate?.('admissions')}
        />

        <KpiCard
          title="Conversion Rate"
          value={`${Number(d.conversionRate || 0).toFixed(1)}%`}
          subtitle="Leads to Admissions"
          icon={TrendingUp}
          highlightColor="bg-amber-50 text-[#C9A227]"
        />
      </div>

      {/* Grid: Salesperson Performance & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Salesperson Performance Table (2 Columns Span) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0B3A66]" />
              <h2 className="text-sm font-bold text-slate-900">Salesperson Performance</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Individual conversion tracking</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Salesperson</th>
                  <th className="py-2.5 px-2 text-center">Total Leads</th>
                  <th className="py-2.5 px-2 text-center">Active Leads</th>
                  <th className="py-2.5 px-2 text-center">Follow-ups</th>
                  <th className="py-2.5 px-2 text-center">Admissions</th>
                  <th className="py-2.5 px-3 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamList.length > 0 ? (
                  teamList.map((sp: any, idx: number) => {
                    const spName =
                      sp?.salespersonName ||
                      sp?.name ||
                      sp?.Name ||
                      sp?.salesperson ||
                      sp?.userName ||
                      `Salesperson ${idx + 1}`;
                    const spId = sp?.salespersonId || sp?.userId || sp?.id || idx;
                    const total = Number(sp?.totalLeads ?? sp?.leads ?? 0);
                    const active = Number(sp?.activeLeads ?? sp?.active ?? 0);
                    const followups = Number(sp?.followups ?? sp?.calls ?? 0);
                    const admissions = Number(sp?.admissions ?? sp?.enrolled ?? 0);
                    const conv = Number(sp?.conversionRate ?? sp?.conversion ?? 0);

                    return (
                      <tr key={spId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-slate-900">{spName}</td>
                        <td className="py-3 px-2 text-center font-mono">{total}</td>
                        <td className="py-3 px-2 text-center font-mono text-slate-600">{active}</td>
                        <td className="py-3 px-2 text-center font-mono text-blue-700 font-semibold">{followups}</td>
                        <td className="py-3 px-2 text-center font-mono text-emerald-700 font-bold">{admissions}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {conv.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No sales team activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0B3A66]" />
                <h2 className="text-sm font-bold text-slate-900">Priority Distribution</h2>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { tier: 'P1 Critical', label: 'P1', color: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200' },
                { tier: 'P2 High', label: 'P2', color: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200' },
                { tier: 'P3 Medium', label: 'P3', color: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200' },
                { tier: 'P4 Low', label: 'P4', color: 'bg-slate-400', bg: 'bg-slate-50 border-slate-200' },
                { tier: 'P5 Minimal', label: 'P5', color: 'bg-gray-300', bg: 'bg-gray-50 border-gray-200' },
              ].map((p) => {
                const item = d.priorityDistribution?.find((item: any) =>
                  String(item?.tier || '').toUpperCase().includes(p.label)
                );
                const count = Number(item?.count || 0);
                const percentage = Number(item?.percentage || 0);

                return (
                  <div key={p.tier} className={`p-2.5 rounded-lg border text-xs ${p.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{p.tier}</span>
                      <span className="font-mono font-bold text-slate-900">{count} leads</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${p.color} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(5, percentage || (count > 0 ? 20 : 0)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Priority algorithm automatically recalculated on every contact touch.
          </div>
        </div>
      </div>

      {/* Grid: Course Performance & Lead Source Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Course Performance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#0B3A66]" />
              <h2 className="text-sm font-bold text-slate-900">Course Performance (HRCA vs BHA)</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3 text-center">Leads</th>
                  <th className="py-2.5 px-3 text-center">Admissions</th>
                  <th className="py-2.5 px-3 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courseList.length > 0 ? (
                  courseList.map((cp: any, idx: number) => {
                    const cName = cp?.course || cp?.name || `Course ${idx + 1}`;
                    const leads = Number(cp?.leads || 0);
                    const adm = Number(cp?.admissions || 0);
                    const conv = Number(cp?.conversionRate || 0);

                    return (
                      <tr key={cName} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-[#0B3A66]">{cName}</td>
                        <td className="py-3 px-3 text-center font-mono">{leads}</td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-700 font-bold">{adm}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {conv.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-[#0B3A66]">HRCA (6 Months)</td>
                      <td className="py-3 px-3 text-center font-mono">0</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-700 font-bold">0</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">0.0%</td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-bold text-[#C9A227]">BHA (Hospital Admin)</td>
                      <td className="py-3 px-3 text-center font-mono">0</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-700 font-bold">0</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">0.0%</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Source Performance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart className="w-4 h-4 text-[#0B3A66]" />
              <h2 className="text-sm font-bold text-slate-900">Lead Source Performance</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Lead Source</th>
                  <th className="py-2.5 px-3 text-center">Leads</th>
                  <th className="py-2.5 px-3 text-center">Admissions</th>
                  <th className="py-2.5 px-3 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sourceList.length > 0 ? (
                  sourceList.map((sp: any, idx: number) => {
                    const srcName = sp?.source || sp?.name || `Source ${idx + 1}`;
                    const leads = Number(sp?.leads || 0);
                    const adm = Number(sp?.admissions || 0);
                    const conv = Number(sp?.conversionRate || 0);

                    return (
                      <tr key={srcName} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{srcName}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{leads}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-semibold">{adm}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {conv.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      No lead sources data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
