import React, { useState, useEffect } from 'react';
import type { WhatsAppActivitySummary, WhatsAppActivity } from '../types';
import { api } from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import { MessageSquare, RefreshCw, Info } from 'lucide-react';

export const WhatsAppActivityView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<WhatsAppActivitySummary | null>(null);
  const [activities, setActivities] = useState<WhatsAppActivity[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchWhatsAppLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const [summaryRes, actRes] = await Promise.all([
        api.getWhatsAppActivitySummary().catch(() => ({
          success: true,
          data: {
            todayCount: 0,
            thresholdLevel: 'NORMAL' as const,
            thresholdLabel: 'Normal',
            maxSafeTarget: 50,
          },
        })),
        api.getWhatsAppActivity().catch(() => ({ success: false, data: [] })),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }

      if (actRes.success && Array.isArray(actRes.data)) {
        setActivities(actRes.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching WhatsApp activity logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppLogs();
  }, []);

  if (loading) return <LoadingState message="Fetching WhatsApp communication activity..." />;
  if (errorMsg) return <ErrorState message={errorMsg} onRetry={() => fetchWhatsAppLogs()} />;

  const todayCount = summary?.todayCount || activities.length || 0;
  const maxSafeTarget = summary?.maxSafeTarget || 50;

  return (
    <div className="space-y-5 pb-16 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#25D366]" />
            <h1 className="text-lg font-bold text-slate-900">WhatsApp Communication Activity</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outbound touch logging and internal volume pacing
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchWhatsAppLogs(true)}
          disabled={refreshing}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Activity"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
        </button>
      </div>

      {/* Internal Operating Gauge Banner */}
      <div className="bg-[#072A4A] text-white p-5 rounded-xl border border-[#0B3A66] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E7D58A]">
              Team Communications Gauge
            </span>
            <div className="text-2xl font-black mt-0.5 text-white">
              {todayCount} <span className="text-sm font-normal text-blue-200">Outbound Messages Opened Today</span>
            </div>
          </div>

          <div className="bg-[#0B3A66] px-4 py-2 rounded-lg border border-blue-400/30 text-right">
            <span className="text-[10px] text-blue-200 uppercase font-semibold">Activity Status</span>
            <div className="text-sm font-bold text-[#E7D58A]">
              {todayCount >= maxSafeTarget * 1.5
                ? 'High Activity'
                : todayCount >= maxSafeTarget * 1.1
                ? 'Warning (High Volume)'
                : todayCount >= maxSafeTarget
                ? 'Safe Target Reached'
                : 'Normal'}
            </div>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-4 pt-3 border-t border-blue-800/60 flex items-center gap-2 text-xs text-blue-200">
          <Info className="w-4 h-4 text-[#E7D58A] shrink-0" />
          <span>Internal CRM pacing metrics for operational quality control.</span>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent WhatsApp Dispatch Logs</h2>
          <span className="text-xs text-slate-500 font-mono">{activities.length} Recorded Touches</span>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            title="No WhatsApp activity recorded yet"
            description="When salespeople click WhatsApp to message students, logs will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Salesperson</th>
                  <th className="py-2.5 px-3">Student Phone</th>
                  <th className="py-2.5 px-3">Template / Type</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {act.salespersonName || act.salespersonId || 'Salesperson'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{act.phone}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {act.messageTemplate || 'Direct WhatsApp Message'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {act.openedAt ? new Date(act.openedAt).toLocaleString() : 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
