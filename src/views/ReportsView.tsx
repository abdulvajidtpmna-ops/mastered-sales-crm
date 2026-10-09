import React, { useState, useEffect } from 'react';
import type { DashboardMetrics } from '../types';
import { api } from '../services/api';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';
import { BarChart3, RefreshCw, GraduationCap } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReports = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const res = await api.getDashboard();
      if (res && res.success) {
        const rawData = res.data || (res as any).result || res;
        setMetrics(rawData);
      } else {
        setErrorMsg(res?.message || 'Failed to load report analytics.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error generating reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <LoadingState message="Generating analytical reports..." />;
  if (errorMsg) return <ErrorState message={errorMsg} onRetry={() => fetchReports()} />;

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

  const totalLeads = Number(d.totalLeads || 0);
  const admissions = Number(d.admissions || 0);
  const interested = Number(d.interested || 0);
  const qualified = Number(d.qualified || 0);
  const overdueFollowups = Number(d.overdueFollowups || 0);
  const conversionRate = Number(d.conversionRate || 0);

  const hrca = (d.coursePerformance || []).find((c: any) =>
    String(c?.course || '').toUpperCase().includes('HRCA')
  );
  const bha = (d.coursePerformance || []).find((c: any) =>
    String(c?.course || '').toUpperCase().includes('BHA')
  );

  return (
    <div className="space-y-5 pb-16 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0B3A66]" />
            <h1 className="text-lg font-bold text-slate-900">Academy Performance & Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Course-by-course metrics, acquisition channel efficacy, and pipeline health
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchReports(true)}
          disabled={refreshing}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Reports"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Overall Admission Conversion
          </div>
          <div className="text-2xl font-black text-[#16834B]">
            {conversionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {admissions} enrolled from {totalLeads} total inquiries
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Pipeline Health Ratio
          </div>
          <div className="text-2xl font-black text-[#0B3A66]">
            {totalLeads > 0 ? Math.round(((interested + qualified) / totalLeads) * 100) : 0}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {interested + qualified} warm & qualified leads
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Follow-Up Resolution
          </div>
          <div className="text-2xl font-black text-amber-700">
            {overdueFollowups === 0 ? '100%' : `${Math.max(0, 100 - overdueFollowups)}%`}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {overdueFollowups} overdue items needing attention
          </p>
        </div>
      </div>

      {/* Course Detailed Performance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <GraduationCap className="w-4 h-4 text-[#0B3A66]" />
          <h2 className="text-sm font-bold text-slate-900">Course Analysis: HRCA vs BHA</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm text-[#0B3A66]">HRCA</span>
              <span className="text-[11px] font-semibold text-slate-600">
                6 Months (4 Mo Training + 2 Mo Internship)
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Core human resource analytics and compliance training curriculum.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2.5 rounded border border-blue-200 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Inquiries</span>
                <div className="font-bold text-slate-800">
                  {hrca?.leads || 0}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Admissions</span>
                <div className="font-bold text-emerald-700">
                  {hrca?.admissions || 0}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Conversion</span>
                <div className="font-bold text-[#0B3A66]">
                  {Number(hrca?.conversionRate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm text-amber-900">BHA</span>
              <span className="text-[11px] font-semibold text-slate-600">
                Hospital Administration + HR
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Specialized healthcare operations and hospital administration diploma.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2.5 rounded border border-amber-200 font-medium">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Inquiries</span>
                <div className="font-bold text-slate-800">
                  {bha?.leads || 0}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Admissions</span>
                <div className="font-bold text-emerald-700">
                  {bha?.admissions || 0}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Conversion</span>
                <div className="font-bold text-amber-900">
                  {Number(bha?.conversionRate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
