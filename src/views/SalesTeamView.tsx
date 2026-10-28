import React, { useState, useEffect } from 'react';
import type { DashboardMetrics, SalespersonSettings } from '../types';
import { api } from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/common/FeedbackStates';
import {
  UserCheck,
  RefreshCw,
  Sliders,
  Calendar,
  CheckCircle2,
  PauseCircle,
  UserX,
  Gauge,
  Layers,
} from 'lucide-react';
import { SalespersonSettingsModal } from '../components/modals/SalespersonSettingsModal';

export const SalesTeamView: React.FC<{ onSelectSalesperson?: (spId: string) => void }> = ({
  onSelectSalesperson,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [settingsList, setSettingsList] = useState<SalespersonSettings[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Salesperson for Settings Modal
  const [activeSettingsModal, setActiveSettingsModal] = useState<SalespersonSettings | null>(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const [dashRes, settingsRes] = await Promise.allSettled([
        api.getDashboard(),
        api.getSalespersonSettings(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value && dashRes.value.success) {
        const rawData = dashRes.value.data || (dashRes.value as any).result || dashRes.value;
        setMetrics(rawData);
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value && settingsRes.value.success) {
        const rawSettings = settingsRes.value.data;
        const list: SalespersonSettings[] = Array.isArray(rawSettings)
          ? rawSettings
          : (rawSettings as any)?.settings || [];
        setSettingsList(list);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error fetching sales team data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading sales team and allocation capacity..." />;
  if (errorMsg) return <ErrorState message={errorMsg} onRetry={() => fetchData()} />;

  const team: any[] =
    metrics?.salespersonPerformance ||
    (metrics as any)?.salespeople ||
    (metrics as any)?.team ||
    [];

  // Merge dashboard performance stats with settings
  const mergedTeam = team.map((sp: any, idx: number) => {
    const spId = String(sp?.salespersonId || sp?.userId || sp?.id || sp?.UserID || `SP-${idx + 1}`);
    const spName = String(
      sp?.salespersonName ||
      sp?.name ||
      sp?.Name ||
      sp?.salesperson ||
      sp?.userName ||
      sp?.email ||
      `Salesperson ${idx + 1}`
    );

    const setting = settingsList.find(
      (s) => String(s.salespersonId) === spId || s.name.toLowerCase() === spName.toLowerCase()
    );

    const initial = (spName.trim().charAt(0) || 'S').toUpperCase();
    const totalLeads = Number(sp?.totalLeads ?? sp?.leads ?? sp?.total ?? 0);
    const activeLeads = Number(sp?.activeLeads ?? sp?.active ?? 0);
    const followups = Number(sp?.followups ?? sp?.completedFollowups ?? sp?.calls ?? 0);
    const admissions = Number(sp?.admissions ?? sp?.enrolled ?? 0);
    const conversionRate = Number(sp?.conversionRate ?? sp?.conversion ?? 0);

    const dailyCap = setting?.dailyLeadCap ?? 20;
    const maxOpen = setting?.maxOpenEnquiries ?? 50;
    const todayAssigned = setting?.todayAssignments ?? (activeLeads > 5 ? 5 : activeLeads);
    const openEnquiries = setting?.openEnquiries ?? activeLeads;
    const status = setting?.status || 'ACTIVE';
    const weight = setting?.allocationWeight ?? 1;

    return {
      spId,
      spName,
      email: sp?.email || setting?.email || '',
      initial,
      totalLeads,
      activeLeads,
      followups,
      admissions,
      conversionRate,
      setting:
        setting ||
        ({
          salespersonId: spId,
          name: spName,
          email: sp?.email || '',
          status: status as any,
          dailyLeadCap: dailyCap,
          maxOpenEnquiries: maxOpen,
          lifetimeCap: 500,
          lifetimeCapEnabled: false,
          allocationWeight: weight,
          todayAssignments: todayAssigned,
          openEnquiries: openEnquiries,
          leaveStartDate: '',
          leaveEndDate: '',
          leaveReason: '',
        } as SalespersonSettings),
      dailyCap,
      maxOpen,
      todayAssigned,
      openEnquiries,
      status,
      weight,
    };
  });

  // Calculate Global Team Capacity Metrics
  const activeCount = mergedTeam.filter((m) => m.status === 'ACTIVE').length;
  const onLeaveCount = mergedTeam.filter((m) => m.status === 'ON_LEAVE').length;
  const pausedCount = mergedTeam.filter((m) => m.status === 'PAUSED').length;
  const totalDailyCapacity = mergedTeam
    .filter((m) => m.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.dailyCap, 0);
  const totalAssignedToday = mergedTeam.reduce((acc, curr) => acc + curr.todayAssigned, 0);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Active
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Calendar className="w-3 h-3 text-amber-600" />
            On Leave
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            <PauseCircle className="w-3 h-3 text-blue-600" />
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <UserX className="w-3 h-3 text-slate-500" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      {/* Top Header & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0B3A66]" />
            <h1 className="text-lg font-black text-slate-900">
              Sales Team Capacity & Lead Distribution
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time counsellor workload management, daily assignment caps, leave scheduling & automatic allocation control
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Team & Allocation Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
          <span>Refresh Capacity</span>
        </button>
      </div>

      {/* Global Team Allocation Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active Counsellors
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#0B3A66]">{activeCount}</span>
            <span className="text-xs text-slate-500 font-medium">/ {mergedTeam.length} total</span>
          </div>
          <div className="text-[10.5px] text-slate-400 mt-1">
            {onLeaveCount > 0 ? `${onLeaveCount} on leave` : 'None on leave'}
            {pausedCount > 0 ? ` • ${pausedCount} paused` : ''}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Team Daily Capacity
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalDailyCapacity}</span>
            <span className="text-xs text-slate-500 font-medium">leads/day</span>
          </div>
          <div className="text-[10.5px] text-slate-400 mt-1">Sum of active counsellors' daily caps</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Assigned Today
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">{totalAssignedToday}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({totalDailyCapacity > 0 ? Math.round((totalAssignedToday / totalDailyCapacity) * 100) : 0}% capacity)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  totalDailyCapacity > 0 ? (totalAssignedToday / totalDailyCapacity) * 100 : 0
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Allocation Algorithm
          </span>
          <div className="flex items-center gap-1.5 mt-1 text-[#C9A227]">
            <Gauge className="w-5 h-5 text-[#C9A227]" />
            <span className="text-sm font-bold text-slate-900">Fair Distribution</span>
          </div>
          <div className="text-[10.5px] text-slate-500 mt-1">
            Re-enquiry previous-owner exclusion active
          </div>
        </div>
      </div>

      {/* Sales Team Cards Grid */}
      {mergedTeam.length === 0 ? (
        <EmptyState
          title="No Sales Representatives Found"
          description="There are no active salespeople recorded in the CRM database yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mergedTeam.map((item) => {
            const todayPct = item.dailyCap > 0 ? Math.round((item.todayAssigned / item.dailyCap) * 100) : 0;
            const openPct = item.maxOpen > 0 ? Math.round((item.openEnquiries / item.maxOpen) * 100) : 0;

            const isTodayCapped = item.todayAssigned >= item.dailyCap;
            const isOpenCapped = item.openEnquiries >= item.maxOpen;

            return (
              <div
                key={item.spId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0B3A66] border border-blue-200 flex items-center justify-center font-black text-sm">
                        {item.initial}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {item.spName}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: {item.spId}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(item.status)}
                      <span className="text-[10px] font-semibold text-slate-500">
                        Weight: {item.weight}x
                      </span>
                    </div>
                  </div>

                  {/* Leave Details if applicable */}
                  {item.status === 'ON_LEAVE' && item.setting.leaveEndDate && (
                    <div className="mb-3 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                      <span>On leave until:</span>
                      <span className="font-bold">
                        {new Date(item.setting.leaveEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Real-time Capacity Meters */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3 my-2">
                    {/* Meter 1: Today's Leads vs Cap */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-[#0B3A66]" />
                          Today's Allocations
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isTodayCapped ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {item.todayAssigned} / {item.dailyCap}
                          {isTodayCapped && ' (CAP REACHED)'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            todayPct >= 100
                              ? 'bg-rose-500'
                              : todayPct >= 75
                              ? 'bg-amber-500'
                              : 'bg-[#0B3A66]'
                          }`}
                          style={{ width: `${Math.min(100, todayPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Meter 2: Active Open Enquiries vs Cap */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#C9A227]" />
                          Open Enquiries
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isOpenCapped ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {item.openEnquiries} / {item.maxOpen}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            openPct >= 100
                              ? 'bg-rose-500'
                              : openPct >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, openPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sales Performance Stats Row */}
                  <div className="grid grid-cols-3 gap-2 my-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                      <div className="text-sm font-bold text-slate-800">{item.totalLeads}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Enrolled</span>
                      <div className="text-sm font-bold text-emerald-700">{item.admissions}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Conv. Rate</span>
                      <div className="text-sm font-bold text-[#C9A227]">
                        {item.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Configure Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {onSelectSalesperson && (
                    <button
                      type="button"
                      onClick={() => onSelectSalesperson(item.spId)}
                      className="text-xs text-[#0B3A66] hover:underline font-semibold cursor-pointer"
                    >
                      View Assigned Leads
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveSettingsModal(item.setting)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3A66]/10 hover:bg-[#0B3A66] text-[#0B3A66] hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer ml-auto"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Capacity</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Salesperson Settings Modal */}
      {activeSettingsModal && (
        <SalespersonSettingsModal
          isOpen={Boolean(activeSettingsModal)}
          onClose={() => setActiveSettingsModal(null)}
          settings={activeSettingsModal}
          onSuccess={() => fetchData(true)}
        />
      )}
    </div>
  );
};