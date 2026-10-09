import React, { useState, useEffect } from 'react';
import type { WhatsAppActivitySummary, DashboardMetrics } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KpiCard, LoadingState, ErrorState } from '../components/common/FeedbackStates';
import {
  MessageSquare,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  Shield,
  Info,
} from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [waSummary, setWaSummary] = useState<WhatsAppActivitySummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);

  const fetchPerformance = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const [waRes, dashRes] = await Promise.all([
        api.getWhatsAppActivitySummary().catch(() => ({
          success: true,
          data: {
            todayCount: 0,
            thresholdLevel: 'NORMAL' as const,
            thresholdLabel: 'Normal',
            maxSafeTarget: 50,
          },
        })),
        api.getDashboard().catch(() => ({ success: false, data: null })),
      ]);

      if (waRes.success && waRes.data) {
        setWaSummary(waRes.data);
      }

      if (dashRes.success && dashRes.data) {
        setDashboard(dashRes.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching performance summary.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your personal performance metrics..." />;
  }

  if (errorMsg) {
    return <ErrorState message={errorMsg} onRetry={() => fetchPerformance()} />;
  }

  // Find current user's performance record if present in dashboard data
  const myRecord = dashboard?.salespersonPerformance?.find(
    (sp) => sp.salespersonId === user?.userId || sp.salespersonName === user?.name
  );

  const todayWaCount = waSummary?.todayCount || 0;
  const maxSafeTarget = waSummary?.maxSafeTarget || 50;
  const waPercentage = Math.min(100, Math.round((todayWaCount / maxSafeTarget) * 100));

  // Determine threshold level badge
  let thresholdBadgeClass = 'bg-blue-100 text-[#0B3A66] border-blue-200';
  let thresholdLabel = 'Normal Activity';
  let thresholdBarColor = 'bg-[#0B3A66]';

  if (todayWaCount >= maxSafeTarget * 1.5) {
    thresholdBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    thresholdLabel = 'High Activity';
    thresholdBarColor = 'bg-rose-600';
  } else if (todayWaCount >= maxSafeTarget * 1.1) {
    thresholdBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    thresholdLabel = 'Warning (Approaching Cap)';
    thresholdBarColor = 'bg-amber-500';
  } else if (todayWaCount >= maxSafeTarget) {
    thresholdBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    thresholdLabel = 'Safe Target Reached';
    thresholdBarColor = 'bg-emerald-600';
  }

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      {/* Header Banner */}
      <div className="bg-[#072A4A] text-white p-5 rounded-xl border border-[#0B3A66] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E7D58A]">
            Sales Representative
          </span>
          <h1 className="text-xl font-black tracking-tight mt-0.5">
            Personal Performance & Activity
          </h1>
          <p className="text-xs text-blue-200 mt-1">Logged in as {user?.name} ({user?.email})</p>
        </div>

        <button
          type="button"
          onClick={() => fetchPerformance(true)}
          disabled={refreshing}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KpiCard
          title="Today's WhatsApp"
          value={todayWaCount}
          subtitle="Outbound student chats"
          icon={MessageSquare}
          highlightColor="bg-emerald-50 text-emerald-700"
        />

        <KpiCard
          title="Follow-ups Resolved"
          value={myRecord?.followups || 0}
          subtitle="Total completed follow-ups"
          icon={CheckCircle2}
          highlightColor="bg-blue-50 text-[#0B3A66]"
        />

        <KpiCard
          title="Total Admissions"
          value={myRecord?.admissions || 0}
          subtitle="Enrolled students"
          icon={GraduationCap}
          highlightColor="bg-amber-50 text-[#C9A227]"
        />

        <KpiCard
          title="Conversion Rate"
          value={`${Number(myRecord?.conversionRate || 0).toFixed(1)}%`}
          subtitle="Personal lead-to-admit"
          icon={TrendingUp}
          highlightColor="bg-indigo-50 text-indigo-700"
        />
      </div>

      {/* Internal CRM WhatsApp Threshold Monitoring Gauge */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0B3A66]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daily WhatsApp Activity Gauge
              </h2>
              <p className="text-[11px] text-slate-500">
                Internal CRM communication pacing metric
              </p>
            </div>
          </div>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${thresholdBadgeClass}`}>
            {thresholdLabel}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="my-4">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Progress towards daily guideline</span>
            <span className="font-mono">{todayWaCount} / {maxSafeTarget} chats</span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${thresholdBarColor}`}
              style={{ width: `${Math.min(100, Math.max(3, waPercentage))}%` }}
            />
          </div>
        </div>

        {/* Notice Requirement from Specification */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>Internal CRM Operating Guidelines:</strong> Threshold indicators (Normal, Safe target reached, Warning, High activity) are designed for internal workflow pacing and quality management within Mastered Skill Academy.
          </div>
        </div>
      </div>
    </div>
  );
};
