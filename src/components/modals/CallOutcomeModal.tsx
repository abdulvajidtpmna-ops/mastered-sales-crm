import React, { useState } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  PhoneOff,
  PhoneForwarded,
  X,
  Loader2,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { CallResult } from '../../types';

interface CallOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string;
  name?: string;
  phone: string;
  onSuccess?: () => void;
}

export const CallOutcomeModal: React.FC<CallOutcomeModalProps> = ({
  isOpen,
  onClose,
  leadId,
  name,
  phone,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [selectedResult, setSelectedResult] = useState<CallResult>('CALL_ANSWERED');
  const [remark, setRemark] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const outcomeOptions: {
    result: CallResult;
    label: string;
    description: string;
    icon: any;
    colorClasses: string;
    activeClasses: string;
  }[] = [
    {
      result: 'CALL_ANSWERED',
      label: 'Call Answered',
      description: 'Customer answered and spoke with counsellor',
      icon: CheckCircle2,
      colorClasses: 'border-emerald-200 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50',
      activeClasses: 'border-emerald-600 bg-emerald-100 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold',
    },
    {
      result: 'CALL_CALLBACK_REQUESTED',
      label: 'Callback Requested',
      description: 'Customer is busy or requested a callback later',
      icon: PhoneForwarded,
      colorClasses: 'border-blue-200 text-blue-800 bg-blue-50/50 hover:bg-blue-50',
      activeClasses: 'border-blue-600 bg-blue-100 ring-2 ring-blue-500/20 text-blue-950 font-semibold',
    },
    {
      result: 'CALL_NO_ANSWER',
      label: 'No Answer / Ringing',
      description: 'Call rang fully but was not answered',
      icon: Clock,
      colorClasses: 'border-amber-200 text-amber-800 bg-amber-50/50 hover:bg-amber-50',
      activeClasses: 'border-amber-600 bg-amber-100 ring-2 ring-amber-500/20 text-amber-950 font-semibold',
    },
    {
      result: 'CALL_BUSY',
      label: 'Line Busy / Engaged',
      description: 'User busy tone or declined incoming call',
      icon: PhoneCall,
      colorClasses: 'border-orange-200 text-orange-800 bg-orange-50/50 hover:bg-orange-50',
      activeClasses: 'border-orange-600 bg-orange-100 ring-2 ring-orange-500/20 text-orange-950 font-semibold',
    },
    {
      result: 'CALL_NUMBER_INVALID',
      label: 'Switched Off / Invalid',
      description: 'Out of coverage, switched off, or wrong number',
      icon: PhoneOff,
      colorClasses: 'border-rose-200 text-rose-800 bg-rose-50/50 hover:bg-rose-50',
      activeClasses: 'border-rose-600 bg-rose-100 ring-2 ring-rose-500/20 text-rose-950 font-semibold',
    },
  ];

  const handleQuickNote = (note: string) => {
    setRemark((prev) => (prev ? `${prev} | ${note}` : note));
  };

  const handleSetQuickFollowUp = (hoursAhead: number) => {
    const target = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    // Format YYYY-MM-DDTHH:mm
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');
    setNextFollowUpAt(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await api.logCall({
        leadId: leadId || '',
        phone: phone || '',
        eventType: 'CALL_ATTEMPT_RECORDED',
        callResult: selectedResult,
        remark: remark.trim(),
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : '',
      });

      if (res.success) {
        success('Call outcome recorded successfully.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to record call outcome.');
      }
    } catch (err: any) {
      error(err.message || 'Error recording call outcome.');
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
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Log Call Outcome</h3>
              <p className="text-xs text-slate-300">
                {name ? `${name} • ` : ''}
                {phone}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Outcome Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              How did the call go?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {outcomeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedResult === opt.result;
                return (
                  <button
                    key={opt.result}
                    type="button"
                    onClick={() => setSelectedResult(opt.result)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected ? opt.activeClasses : opt.colorClasses
                    }`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold leading-tight">{opt.label}</div>
                      <div className="text-[10.5px] opacity-80 mt-0.5 leading-snug line-clamp-2">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Note Suggestions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Quick Remarks
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Discussed course fees',
                'Sent syllabus on WhatsApp',
                'Will discuss with parents',
                'Call back tomorrow morning',
                'Interested in weekend batch',
                'Looking for job placement guarantee',
              ].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleQuickNote(pill)}
                  className="text-[11px] bg-slate-100 hover:bg-[#E7D58A]/30 text-slate-700 hover:text-[#0B3A66] px-2.5 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
                >
                  + {pill}
                </button>
              ))}
            </div>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              placeholder="Add counsellor discussion notes, objections raised, or reason for callback..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0B3A66] focus:border-transparent"
            />
          </div>

          {/* Follow-up Rescheduling */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0B3A66]" />
                Next Follow-Up (Optional)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(3)}
                  className="text-[10px] bg-white hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300 font-medium text-slate-700 transition-colors"
                >
                  +3 Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(24)}
                  className="text-[10px] bg-white hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300 font-medium text-slate-700 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(72)}
                  className="text-[10px] bg-white hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300 font-medium text-slate-700 transition-colors"
                >
                  3 Days
                </button>
              </div>
            </div>
            <input
              type="datetime-local"
              value={nextFollowUpAt}
              onChange={(e) => setNextFollowUpAt(e.target.value)}
              className="w-full text-xs bg-white rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Skip
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
                'Save Outcome'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};