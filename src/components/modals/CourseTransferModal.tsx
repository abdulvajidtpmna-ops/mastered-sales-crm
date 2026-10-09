import React, { useState } from 'react';
import type { Lead } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, ArrowRightLeft, Loader2, AlertTriangle } from 'lucide-react';

interface CourseTransferModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CourseTransferModal: React.FC<CourseTransferModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const previousCourse = lead?.course || 'HRCA';
  const suggestedNewCourse = previousCourse === 'HRCA' ? 'BHA' : 'HRCA';
  const [newCourse, setNewCourse] = useState(suggestedNewCourse);
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (lead) {
      setNewCourse(lead.course === 'HRCA' ? 'BHA' : 'HRCA');
      setReason('');
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const leadId = lead.id || lead.leadId || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      error('Invalid lead reference.');
      return;
    }

    if (newCourse === previousCourse) {
      error('New course must be different from current course.');
      return;
    }

    if (!reason.trim()) {
      error('Please provide a valid transfer reason.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.transferCourse({
        leadId,
        admissionId: lead.admissionId,
        previousCourse,
        newCourse,
        reason: reason.trim(),
      });

      if (res.success) {
        success(`Course transferred from ${previousCourse} to ${newCourse} successfully.`);
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Course transfer failed.');
      }
    } catch (err: any) {
      error(err.message || 'Error processing course transfer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0B3A66] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#E7D58A]" />
            <h3 className="font-bold text-sm">Course Transfer (Chairman)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            Transferring course creates an immutable audit trail record. Historical records will be preserved.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Student / Lead:</span>
            <span className="font-bold text-slate-900 text-sm">{lead.name}</span>
            <span className="text-slate-500 font-mono ml-2">({lead.phone})</span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                Current Course
              </label>
              <div className="font-bold text-slate-800 text-sm mt-1">{previousCourse}</div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase">
                Transfer To
              </label>
              <select
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1 text-[#0B3A66] focus:outline-none focus:ring-1 focus:ring-[#0B3A66] mt-1"
              >
                <option value="HRCA">HRCA</option>
                <option value="BHA">BHA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Course Transfer <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student preferred hospital management domain after career counseling..."
              rows={3}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              required
            />
          </div>

          {/* Footer */}
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
              <span>Confirm Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
