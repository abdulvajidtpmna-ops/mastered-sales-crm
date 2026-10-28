import React, { useState } from 'react';
import {
  X,
  Sliders,
  Calendar,
  CheckCircle2,
  PauseCircle,
  UserX,
  Loader2,
  Gauge,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { SalespersonSettings } from '../../types';

interface SalespersonSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SalespersonSettings;
  onSuccess: () => void;
}

export const SalespersonSettingsModal: React.FC<SalespersonSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [status, setStatus] = useState<SalespersonSettings['status']>(settings.status || 'ACTIVE');
  const [dailyLeadCap, setDailyLeadCap] = useState<number>(settings.dailyLeadCap ?? 20);
  const [maxOpenEnquiries, setMaxOpenEnquiries] = useState<number>(settings.maxOpenEnquiries ?? 50);
  const [lifetimeCapEnabled, setLifetimeCapEnabled] = useState<boolean>(
    Boolean(settings.lifetimeCapEnabled)
  );
  const [lifetimeCap, setLifetimeCap] = useState<number>(settings.lifetimeCap ?? 500);
  const [allocationWeight, setAllocationWeight] = useState<number>(settings.allocationWeight ?? 1);
  const [leaveStartDate, setLeaveStartDate] = useState<string>(settings.leaveStartDate || '');
  const [leaveEndDate, setLeaveEndDate] = useState<string>(settings.leaveEndDate || '');
  const [leaveReason, setLeaveReason] = useState<string>(settings.leaveReason || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await api.updateSalespersonSettings({
        salespersonId: settings.salespersonId,
        status,
        dailyLeadCap: Number(dailyLeadCap) || 20,
        maxOpenEnquiries: Number(maxOpenEnquiries) || 50,
        lifetimeCapEnabled,
        lifetimeCap: Number(lifetimeCap) || 500,
        allocationWeight: Number(allocationWeight) || 1,
        leaveStartDate: status === 'ON_LEAVE' ? leaveStartDate : '',
        leaveEndDate: status === 'ON_LEAVE' ? leaveEndDate : '',
        leaveReason: status === 'ON_LEAVE' ? leaveReason : '',
      });

      if (res.success) {
        success(`Allocation settings for ${settings.name} updated.`);
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to update settings.');
      }
    } catch (err: any) {
      error(err.message || 'Error updating settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#072A4A] to-[#0B3A66] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center text-[#E7D58A]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Lead Allocation & Capacity</h3>
              <p className="text-xs text-slate-300">
                {settings.name} • {settings.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Salesperson Availability Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'ACTIVE',
                  label: 'Active',
                  desc: 'Eligible for auto leads',
                  icon: CheckCircle2,
                  color: 'border-emerald-500 bg-emerald-50 text-emerald-900',
                  inactive: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                },
                {
                  id: 'ON_LEAVE',
                  label: 'On Leave',
                  desc: 'Excluded until return',
                  icon: Calendar,
                  color: 'border-amber-500 bg-amber-50 text-amber-900',
                  inactive: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                },
                {
                  id: 'PAUSED',
                  label: 'Paused',
                  desc: 'Temporarily halted',
                  icon: PauseCircle,
                  color: 'border-blue-500 bg-blue-50 text-blue-900',
                  inactive: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                },
                {
                  id: 'INACTIVE',
                  label: 'Inactive',
                  desc: 'Permanently removed',
                  icon: UserX,
                  color: 'border-rose-500 bg-rose-50 text-rose-900',
                  inactive: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                },
              ].map((st) => {
                const Icon = st.icon;
                const isSel = status === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatus(st.id as any)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSel ? `${st.color} ring-2 ring-offset-1` : st.inactive
                    }`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">{st.label}</div>
                      <div className="text-[10px] opacity-75">{st.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Leave Details if ON_LEAVE */}
          {status === 'ON_LEAVE' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-700" />
                Leave Schedule
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Medical leave, Annual leave"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}

          {/* Capacity Limits */}
          <div className="space-y-4 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-[#0B3A66]" />
              Workload & Capacity Limits
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily New-Lead Cap
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={dailyLeadCap}
                  onChange={(e) => setDailyLeadCap(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0B3A66]"
                />
                <span className="text-[10px] text-slate-500">Max new leads assigned per day</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Open Enquiries
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={maxOpenEnquiries}
                  onChange={(e) => setMaxOpenEnquiries(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0B3A66]"
                />
                <span className="text-[10px] text-slate-500">Max concurrent active leads</span>
              </div>
            </div>

            {/* Allocation Weight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Allocation Weight / Distribution Ratio
                </label>
                <span className="text-xs font-bold text-[#0B3A66]">{allocationWeight}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={allocationWeight}
                onChange={(e) => setAllocationWeight(Number(e.target.value))}
                className="w-full accent-[#0B3A66] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (Zero allocation)</span>
                <span>1 (Standard)</span>
                <span>3 (High)</span>
                <span>5 (Maximum)</span>
              </div>
            </div>

            {/* Lifetime Assignment Cap */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lifetimeCapEnabled}
                  onChange={(e) => setLifetimeCapEnabled(e.target.checked)}
                  className="rounded text-[#0B3A66] focus:ring-[#0B3A66] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Enable Lifetime Allocation Cap
                </span>
              </label>

              {lifetimeCapEnabled && (
                <div className="pl-6 pt-1">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={lifetimeCap}
                    onChange={(e) => setLifetimeCap(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">
                    Stops receiving automatic leads once total career assignments reach this limit.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-[#0B3A66] hover:bg-[#072A4A] text-[#F5F8FC] font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};