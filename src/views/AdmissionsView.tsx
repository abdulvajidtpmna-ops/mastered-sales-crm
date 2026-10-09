import React, { useState, useEffect, useMemo } from 'react';
import type { Admission, CourseTransfer, Lead } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CourseBadge } from '../components/common/Badges';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates';
import { SearchBar } from '../components/common/SearchBar';
import { CourseTransferModal } from '../components/modals/CourseTransferModal';
import {
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';

export const AdmissionsView: React.FC = () => {
  const { isChairman } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [transferHistory, setTransferHistory] = useState<CourseTransfer[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Modals state
  const [activeTransferAdmission, setActiveTransferAdmission] = useState<Admission | null>(null);
  const [selectedAdmissionForPayment, setSelectedAdmissionForPayment] = useState<Admission | null>(null);
  const [paymentStatusUpdate, setPaymentStatusUpdate] = useState<'PAID' | 'PARTIAL' | 'PENDING'>('PAID');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const fetchAdmissionsData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const [admRes, transferRes] = await Promise.all([
        api.getAdmissions(),
        api.getCourseTransferHistory().catch(() => ({ success: false, data: [] })),
      ]);

      if (admRes && admRes.success) {
        let items: Admission[] = [];
        if (Array.isArray(admRes.data)) {
          items = admRes.data;
        } else if (admRes.data && Array.isArray((admRes.data as any).admissions)) {
          items = (admRes.data as any).admissions;
        } else if (Array.isArray((admRes as any).admissions)) {
          items = (admRes as any).admissions;
        } else if (admRes.data && Array.isArray((admRes.data as any).list)) {
          items = (admRes.data as any).list;
        }
        setAdmissions(items);
      } else {
        setErrorMsg(admRes?.message || 'Failed to fetch admissions.');
      }

      if (transferRes && transferRes.success) {
        let transfers: CourseTransfer[] = [];
        if (Array.isArray(transferRes.data)) {
          transfers = transferRes.data;
        } else if (transferRes.data && Array.isArray((transferRes.data as any).transfers)) {
          transfers = (transferRes.data as any).transfers;
        } else if (Array.isArray((transferRes as any).transfers)) {
          transfers = (transferRes as any).transfers;
        }
        setTransferHistory(transfers);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error loading admissions data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdmissionsData();
  }, []);

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionForPayment) return;

    const admId =
      selectedAdmissionForPayment.id ||
      selectedAdmissionForPayment.admissionId ||
      (selectedAdmissionForPayment as any).AdmissionID ||
      '';
    if (!admId) {
      error('Invalid admission ID.');
      return;
    }

    setUpdatingPayment(true);
    try {
      const res = await api.updateAdmissionPayment({
        admissionId: admId,
        paymentStatus: paymentStatusUpdate,
      });

      if (res && res.success) {
        success('Payment status updated successfully.');
        setSelectedAdmissionForPayment(null);
        fetchAdmissionsData(true);
      } else {
        error(res?.message || 'Failed to update payment status.');
      }
    } catch (err: any) {
      error(err?.message || 'Error updating payment.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm: any) => {
      const studentName = adm.studentName || adm.StudentName || adm.name || '';
      const phone = adm.phone || adm.Phone || '';
      const course = adm.course || adm.Course || '';
      const paymentStatus = adm.paymentStatus || adm.PaymentStatus || 'PENDING';

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = studentName.toLowerCase().includes(q);
        const matchesPhone = phone.toLowerCase().includes(q);
        const matchesCourse = course.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesCourse) return false;
      }

      if (courseFilter && course !== courseFilter) return false;
      if (paymentFilter && paymentStatus.toUpperCase() !== paymentFilter.toUpperCase()) return false;

      return true;
    });
  }, [admissions, searchQuery, courseFilter, paymentFilter]);

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#16834B]" />
            <h1 className="text-lg font-bold text-slate-900">Student Admissions & Enrollment</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed admissions, fee statuses, and transfer audits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-1.5 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Total Enrolled</span>
            <div className="text-base font-black text-emerald-950 leading-tight">
              {admissions.length} Students
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAdmissionsData(true)}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Admissions"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search enrolled student by name, phone..."
          />
        </div>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
        >
          <option value="">All Courses</option>
          <option value="HRCA">HRCA</option>
          <option value="BHA">BHA</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
        >
          <option value="">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingState message="Loading admissions log..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => fetchAdmissionsData()} />
      ) : filteredAdmissions.length === 0 ? (
        <EmptyState
          title="No admissions found"
          description={
            admissions.length === 0
              ? 'No student admissions recorded in the database yet.'
              : 'No admissions match your search or filter criteria.'
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Admission Date</th>
                  <th className="py-3 px-3">Fee Amount</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3">Salesperson</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmissions.map((adm: any, idx: number) => {
                  const studentName = adm.studentName || adm.StudentName || adm.name || 'Student';
                  const phone = adm.phone || adm.Phone || '';
                  const course = adm.course || adm.Course || 'HRCA';
                  const paymentStatus = (adm.paymentStatus || adm.PaymentStatus || 'PENDING').toUpperCase();
                  const isPaid = paymentStatus === 'PAID';
                  const isPartial = paymentStatus === 'PARTIAL';
                  const amount = Number(adm.admissionAmount ?? adm.amount ?? adm.fee ?? adm.Fee ?? 0);
                  const salespersonName = adm.salespersonName || adm.SalespersonName || adm.salesperson || '-';
                  const admDate = adm.admissionDate || adm.AdmissionDate || adm.createdAt;
                  const admId = adm.id || adm.admissionId || adm.AdmissionID || adm.leadId || `ADM-${idx + 1}`;

                  return (
                    <tr key={admId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{studentName}</div>
                        {phone && <div className="text-[11px] text-slate-500 font-mono">{phone}</div>}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <CourseBadge course={course} size="sm" />
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {admDate ? new Date(admDate).toLocaleDateString() : '-'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                        ₹{amount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPartial
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {salespersonName}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAdmissionForPayment(adm);
                              setPaymentStatusUpdate(
                                (paymentStatus as any) || 'PAID'
                              );
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors cursor-pointer"
                          >
                            Update Payment
                          </button>

                          {isChairman && (
                            <button
                              type="button"
                              onClick={() => setActiveTransferAdmission(adm)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#0B3A66] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                            >
                              Transfer Course
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Transfer Audit Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#0B3A66]" />
          <h3 className="font-bold text-sm text-slate-900">Historical Course Transfer Audit Log</h3>
        </div>

        {transferHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 italic">
            No course transfer operations recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {transferHistory.map((t: any, index: number) => {
              const studentName = t.studentName || t.StudentName || t.name || 'Student';
              const prevCourse = t.previousCourse || t.PreviousCourse || 'HRCA';
              const nextCourse = t.newCourse || t.NewCourse || 'BHA';
              const reason = t.reason || t.Reason || '-';
              const changedBy = t.changedByName || t.changedBy || t.ChangedByName || 'Chairman';
              const changedAt = t.changedAt || t.ChangedAt;
              const transferId = t.id || t.transferId || t.TransferID || index;

              return (
                <div
                  key={transferId}
                  className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{studentName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[11px]">
                        {prevCourse}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-[#0B3A66] rounded font-bold text-[11px]">
                        {nextCourse}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">
                      <strong>Reason:</strong> {reason}
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    <div>Authorized by: <strong className="text-slate-700">{changedBy}</strong></div>
                    <div>{changedAt ? new Date(changedAt).toLocaleString() : 'Recent'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Update Payment Modal */}
      {selectedAdmissionForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-sm text-slate-900 mb-1">Update Payment Status</h3>
            <p className="text-xs text-slate-500 mb-4">
              {(selectedAdmissionForPayment as any).studentName || (selectedAdmissionForPayment as any).StudentName}
            </p>

            <form onSubmit={handleUpdatePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatusUpdate}
                  onChange={(e) => setPaymentStatusUpdate(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                >
                  <option value="PAID">PAID (Full Payment)</option>
                  <option value="PARTIAL">PARTIAL (Installment)</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAdmissionForPayment(null)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayment}
                  className="px-4 py-1.5 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {updatingPayment ? 'Updating...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Transfer Modal */}
      <CourseTransferModal
        isOpen={!!activeTransferAdmission}
        lead={
          activeTransferAdmission
            ? ({
                id: (activeTransferAdmission as any).leadId || (activeTransferAdmission as any).LeadID,
                leadId: (activeTransferAdmission as any).leadId || (activeTransferAdmission as any).LeadID,
                name: (activeTransferAdmission as any).studentName || (activeTransferAdmission as any).StudentName,
                phone: (activeTransferAdmission as any).phone || (activeTransferAdmission as any).Phone || '',
                course: (activeTransferAdmission as any).course || (activeTransferAdmission as any).Course,
                admissionId: (activeTransferAdmission as any).admissionId || (activeTransferAdmission as any).AdmissionID || activeTransferAdmission.id,
              } as Lead)
            : null
        }
        onClose={() => setActiveTransferAdmission(null)}
        onSuccess={() => fetchAdmissionsData(true)}
      />
    </div>
  );
};
