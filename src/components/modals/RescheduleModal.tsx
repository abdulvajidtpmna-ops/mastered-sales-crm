import React, { useState } from 'react';
import type { Lead } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, CalendarClock, Loader2 } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  // Default to tomorrow 11:00 AM
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(11, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [nextFollowUpAt, setNextFollowUpAt] = useState<string>(getTomorrowString());
  const [reason, setReason] = useState<string>('Client requested callback at a later time');

  if (!isOpen || !lead) return null;

  const leadId = lead.id || lead.leadId || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      error('Invalid lead reference.');
      return;
    }

    if (!nextFollowUpAt) {
      error('Please select a new date and time.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.rescheduleFollowUp({
        leadId,
        nextFollowUpAt,
        reason: reason.trim() || 'Rescheduled',
      });

      if (res.success) {
        success('Follow-up rescheduled.');
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to reschedule follow-up.');
      }
    } catch (err: any) {
      error(err.message || 'Error rescheduling follow-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0B3A66] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#E7D58A]" />
            <h3 className="font-bold text-sm">Reschedule Follow-up</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <div className="text-slate-800 font-bold text-sm">{lead.name}</div>
            <div className="text-slate-500 font-mono text-xs">{lead.phone} • {lead.course || 'HRCA'}</div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Follow-up Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={nextFollowUpAt}
              onChange={(e) => setNextFollowUpAt(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Rescheduling</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] mb-2"
            >
              <option value="Client requested callback at a later time">Client requested callback later</option>
              <option value="Client busy / In meeting">Client busy / In meeting</option>
              <option value="Phone switched off / Unreachable">Phone switched off / Unreachable</option>
              <option value="Waiting for salary / month end">Waiting for salary / month end</option>
              <option value="Wants discussion with parents/family">Wants discussion with parents/family</option>
              <option value="Other">Other reason</option>
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                placeholder="Specify reason..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Reschedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
