import React, { useState } from 'react';
import type { Lead, Objection } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, CheckSquare, Loader2, Calendar } from 'lucide-react';

interface FollowUpModalProps {
  isOpen: boolean;
  lead: Lead | null;
  objections?: Objection[];
  onClose: () => void;
  onSuccess: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  lead,
  objections = [],
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<string>('Interested');
  const [temperature, setTemperature] = useState<string>('WARM');
  const [interestLevel, setInterestLevel] = useState<string>('High');
  const [objection, setObjection] = useState<string>('None');
  const [remark, setRemark] = useState<string>('');

  // Default next follow-up: tomorrow at 10:00 AM
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [nextFollowUpAt, setNextFollowUpAt] = useState<string>(getTomorrowString());

  if (!isOpen || !lead) return null;

  const leadId = lead.id || lead.leadId || '';
  const isNoFollowUpRequired = result === 'Admitted' || result === 'Not Interested';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      error('Invalid lead reference.');
      return;
    }

    if (!isNoFollowUpRequired && !nextFollowUpAt) {
      error('Next follow-up date and time is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.completeFollowUp({
        leadId,
        result,
        temperature,
        interestLevel,
        objection: objection !== 'None' ? objection : '',
        remark,
        nextFollowUpAt: isNoFollowUpRequired ? '' : nextFollowUpAt,
      });

      if (res.success) {
        success('Follow-up completed successfully.');
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to complete follow-up.');
      }
    } catch (err: any) {
      error(err.message || 'Error updating follow-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="bg-[#0B3A66] px-5 py-3.5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#E7D58A]" />
              <h3 className="font-bold text-sm">Complete Follow-up</h3>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              {lead.name} • {lead.phone} ({lead.course || 'HRCA'})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Result Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Follow-up Result <span className="text-rose-500">*</span>
            </label>
            <select
              value={result}
              onChange={(e) => {
                const val = e.target.value;
                setResult(val);
                if (val === 'Admitted') {
                  setTemperature('HOT');
                  setInterestLevel('Very High');
                } else if (val === 'More Interested') {
                  setTemperature('HOT');
                  setInterestLevel('Very High');
                } else if (val === 'Less Interested') {
                  setTemperature('COLD');
                  setInterestLevel('Low');
                } else if (val === 'Not Interested') {
                  setTemperature('COLD');
                  setInterestLevel('Low');
                }
              }}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              required
            >
              <option value="More Interested">More Interested</option>
              <option value="Interested">Interested</option>
              <option value="Less Interested">Less Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Admitted">Admitted</option>
              <option value="No Response">No Response</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Temperature */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temperature</label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                <option value="HOT">Hot</option>
                <option value="WARM">Warm</option>
                <option value="COLD">Cold</option>
              </select>
            </div>

            {/* Interest Level */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interest Level</label>
              <select
                value={interestLevel}
                onChange={(e) => setInterestLevel(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                <option value="Very High">Very High</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Objection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Objection / Reason</label>
            <select
              value={objection}
              onChange={(e) => setObjection(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
            >
              <option value="None">None / No Objection</option>
              {objections.length > 0 ? (
                objections.map((obj) => (
                  <option key={obj.name || obj.id} value={obj.name}>
                    {obj.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Price is High">Price is High</option>
                  <option value="Financial Issue">Financial Issue</option>
                  <option value="Waiting for Salary">Waiting for Salary</option>
                  <option value="Need Installment">Need Installment</option>
                  <option value="Need to Think">Need to Think</option>
                  <option value="Need to Discuss with Family">Need to Discuss with Family</option>
                  <option value="Will Join Later">Will Join Later</option>
                  <option value="Next Month">Next Month</option>
                  <option value="Next Year">Next Year</option>
                  <option value="Course Not Suitable">Course Not Suitable</option>
                  <option value="Need Different Course">Need Different Course</option>
                  <option value="Need More Course Details">Need More Course Details</option>
                  <option value="Need Placement Details">Need Placement Details</option>
                  <option value="Need Internship Details">Need Internship Details</option>
                  <option value="Comparing Another Institute">Comparing Another Institute</option>
                  <option value="Waiting for Another Institute">Waiting for Another Institute</option>
                  <option value="Need Certificate Details">Need Certificate Details</option>
                  <option value="Not Available Now">Not Available Now</option>
                  <option value="Asked Payment Link">Asked Payment Link</option>
                  <option value="Asked Admission Process">Asked Admission Process</option>
                  <option value="Asked Fee">Asked Fee</option>
                  <option value="Asked Installment">Asked Installment</option>
                  <option value="Asked Starting Date">Asked Starting Date</option>
                  <option value="Said Wants to Join">Said Wants to Join</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>

          {/* Remark */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remark / Discussion Notes</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="What did the lead say? What was agreed upon?"
              rows={2}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
            />
          </div>

          {/* Next Follow-Up Date & Time */}
          {!isNoFollowUpRequired ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  Next Follow-up Date & Time <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Required for active lead</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={nextFollowUpAt}
                  onChange={(e) => setNextFollowUpAt(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Result is <strong>{result}</strong>. Next follow-up is not required. Lead will be closed or moved to admission.
              </span>
            </div>
          )}

          {/* Footer Actions */}
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
              <span>Save & Complete</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
