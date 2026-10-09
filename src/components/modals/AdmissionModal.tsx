import React, { useState } from 'react';
import type { Lead, Course } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, GraduationCap, Loader2, Info } from 'lucide-react';

interface AdmissionModalProps {
  isOpen: boolean;
  lead: Lead | null;
  courses?: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AdmissionModal: React.FC<AdmissionModalProps> = ({
  isOpen,
  lead,
  courses = [],
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [studentName, setStudentName] = useState(lead?.name || '');
  const [course, setCourse] = useState(lead?.course || 'HRCA');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [admissionAmount, setAdmissionAmount] = useState<number>(35000);
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [notes, setNotes] = useState('');

  // Sync state when lead opens
  React.useEffect(() => {
    if (lead) {
      setStudentName(lead.name || '');
      setCourse(lead.course || 'HRCA');
      setAdmissionDate(new Date().toISOString().slice(0, 10));
      setAdmissionAmount(lead.course === 'BHA' ? 45000 : 35000);
      setPaymentStatus('PAID');
      setNotes('');
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

    if (!studentName.trim()) {
      error('Student name is required.');
      return;
    }

    if (!admissionAmount || admissionAmount <= 0) {
      error('Please specify a valid admission amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createAdmission({
        leadId,
        studentName: studentName.trim(),
        course,
        admissionDate,
        admissionAmount: Number(admissionAmount),
        paymentStatus,
        notes: notes.trim(),
      });

      if (res.success) {
        success(`Admission successfully created for ${studentName}! Lead moved to Admitted.`);
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Failed to create admission.');
      }
    } catch (err: any) {
      error(err.message || 'Error processing admission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#16834B] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-sm">Create Student Admission</h3>
              <p className="text-[11px] text-emerald-100">Enroll lead and generate admission record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-2.5 text-xs text-emerald-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Completing admission removes the student from active daily follow-up queue.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Student Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16834B]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Course */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Enrolled Course</label>
              <select
                value={course}
                onChange={(e) => {
                  const c = e.target.value;
                  setCourse(c);
                  setAdmissionAmount(c === 'BHA' ? 45000 : 35000);
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16834B]"
              >
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <option key={c.code || c.name} value={c.code || c.name}>
                      {c.code || c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="HRCA">HRCA (6 Months)</option>
                    <option value="BHA">BHA (Hospital Admin + HR)</option>
                  </>
                )}
              </select>
            </div>

            {/* Admission Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admission Date</label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16834B]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Admission Amount */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Fee Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={admissionAmount}
                onChange={(e) => setAdmissionAmount(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16834B]"
                required
              />
            </div>

            {/* Payment Status */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16834B]"
              >
                <option value="PAID">PAID (Full Payment)</option>
                <option value="PARTIAL">PARTIAL (Installment)</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batch / Enrollment Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch timing, payment transaction reference, discount details..."
              rows={2}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16834B]"
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
              className="px-4 py-2 bg-[#16834B] hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Admission</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
