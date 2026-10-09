import React, { useState } from 'react';
import type { Lead } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, UserCheck, Loader2 } from 'lucide-react';

interface AssignLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  salespeople: { userId: string; name: string; email?: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignLeadModal: React.FC<AssignLeadModalProps> = ({
  isOpen,
  lead,
  salespeople = [],
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>(
    lead?.assignedSalespersonId || (salespeople[0]?.userId || '')
  );

  React.useEffect(() => {
    if (lead) {
      setSelectedSalespersonId(lead.assignedSalespersonId || salespeople[0]?.userId || '');
    }
  }, [lead, salespeople]);

  if (!isOpen || !lead) return null;

  const leadId = lead.id || lead.leadId || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      error('Invalid lead reference.');
      return;
    }

    if (!selectedSalespersonId) {
      error('Please select a salesperson.');
      return;
    }

    const sp = salespeople.find((s) => s.userId === selectedSalespersonId);
    const spName = sp ? sp.name : '';

    setLoading(true);
    try {
      const res = await api.assignLead(leadId, selectedSalespersonId, spName);
      if (res.success) {
        success(`Lead assigned to ${spName || 'Salesperson'} successfully.`);
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to assign lead.');
      }
    } catch (err: any) {
      error(err.message || 'Error assigning lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#0B3A66] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#E7D58A]" />
            <h3 className="font-bold text-sm">Assign Lead</h3>
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
            <span className="text-slate-500 block text-[10px]">Lead Name:</span>
            <span className="font-bold text-slate-900 text-sm">{lead.name}</span>
            <span className="text-slate-500 font-mono ml-2">({lead.phone})</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Salesperson <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSalespersonId}
              onChange={(e) => setSelectedSalespersonId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              required
            >
              <option value="" disabled>Choose Sales Representative...</option>
              {salespeople.map((sp) => (
                <option key={sp.userId} value={sp.userId}>
                  {sp.name} {sp.email ? `(${sp.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          {lead.assignedSalespersonName && (
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
              Currently assigned to: <strong className="text-slate-800">{lead.assignedSalespersonName}</strong>
            </div>
          )}

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
              disabled={loading || !selectedSalespersonId}
              className="px-4 py-2 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Assign Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
