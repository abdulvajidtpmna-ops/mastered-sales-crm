import React, { useState, useEffect } from 'react';
import type { DashboardMetrics } from '../types';
import { api } from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import { UserCheck, RefreshCw, TrendingUp } from 'lucide-react';

export const SalesTeamView: React.FC<{ onSelectSalesperson?: (spId: string) => void }> = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeam = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const res = await api.getDashboard();
      if (res && res.success) {
        const rawData = res.data || (res as any).result || res;
        setMetrics(rawData);
      } else {
        setErrorMsg(res?.message || 'Failed to load sales team.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error fetching sales team data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  if (loading) return <LoadingState message="Loading sales team personnel and stats..." />;
  if (errorMsg) return <ErrorState message={errorMsg} onRetry={() => fetchTeam()} />;

  const team: any[] =
    metrics?.salespersonPerformance ||
    (metrics as any)?.salespeople ||
    (metrics as any)?.team ||
    [];

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0B3A66]" />
            <h1 className="text-lg font-bold text-slate-900">Sales Representatives & Team</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active sales team members, assigned workloads, and conversion rates
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTeam(true)}
          disabled={refreshing}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Team"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
        </button>
      </div>

      {team.length === 0 ? (
        <EmptyState
          title="No Sales Representatives Found"
          description="There are no active salespeople recorded in the CRM database yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((sp: any, idx: number) => {
            const spName =
              sp?.salespersonName ||
              sp?.name ||
              sp?.Name ||
              sp?.salesperson ||
              sp?.userName ||
              sp?.email ||
              `Salesperson ${idx + 1}`;
            const spId =
              sp?.salespersonId ||
              sp?.userId ||
              sp?.id ||
              sp?.UserID ||
              `SP-${idx + 1}`;
            const initial = (spName.trim().charAt(0) || 'S').toUpperCase();
            const totalLeads = Number(sp?.totalLeads ?? sp?.leads ?? sp?.total ?? 0);
            const activeLeads = Number(sp?.activeLeads ?? sp?.active ?? 0);
            const followups = Number(sp?.followups ?? sp?.completedFollowups ?? sp?.calls ?? 0);
            const admissions = Number(sp?.admissions ?? sp?.enrolled ?? 0);
            const conversionRate = Number(sp?.conversionRate ?? sp?.conversion ?? 0);

            return (
              <div
                key={spId || idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0B3A66] border border-blue-200 flex items-center justify-center font-bold text-sm">
                        {initial}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{spName}</h3>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: {spId}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Total Assigned</span>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{totalLeads}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Active Follow-ups</span>
                      <div className="text-base font-bold text-[#0B3A66] mt-0.5">{activeLeads}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Completed Calls</span>
                      <div className="text-base font-bold text-slate-700 mt-0.5">{followups}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Admissions</span>
                      <div className="text-base font-bold text-emerald-700 mt-0.5">{admissions}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <TrendingUp className="w-4 h-4 text-[#C9A227]" />
                    <span>Conversion Rate:</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
