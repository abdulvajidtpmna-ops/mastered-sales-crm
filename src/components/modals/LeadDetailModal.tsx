import React, { useState, useEffect } from 'react';
import type { Lead, FollowUpHistoryItem, CourseTransfer } from '../../types';
import { api } from '../../services/api';
import { TemperatureBadge, PriorityBadge, StatusBadge, InterestBadge, CourseBadge } from '../common/Badges';
import { CallButton, WhatsAppButton } from '../common/Buttons';
import {
  X,
  User,
  Calendar,
  Clock,
  History,
  GraduationCap,
  ArrowRightLeft,
  Target,
  HelpCircle,
  Edit,
  CheckSquare,
  CalendarClock,
  Loader2,
} from 'lucide-react';

interface LeadDetailModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onEditLead: (lead: Lead) => void;
  onCompleteFollowUp: (lead: Lead) => void;
  onRescheduleFollowUp: (lead: Lead) => void;
  onCreateAdmission?: (lead: Lead) => void;
  onTransferCourse?: (lead: Lead) => void;
  isChairman?: boolean;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  lead,
  onClose,
  onEditLead,
  onCompleteFollowUp,
  onRescheduleFollowUp,
  onCreateAdmission,
  onTransferCourse,
  isChairman,
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<FollowUpHistoryItem[]>([]);
  const [transfers, setTransfers] = useState<CourseTransfer[]>([]);

  const leadId = lead?.id || lead?.leadId || '';

  useEffect(() => {
    if (isOpen && leadId) {
      setLoading(true);
      Promise.all([
        api.getLead(leadId).catch(() => ({ success: false, data: null })),
        api.getCourseTransferHistory(leadId).catch(() => ({ success: false, data: [] })),
      ])
        .then(([leadRes, transferRes]) => {
          if (leadRes.success && leadRes.data?.history) {
            setHistory(leadRes.data.history);
          } else {
            setHistory([]);
          }

          if (transferRes.success && Array.isArray(transferRes.data)) {
            setTransfers(transferRes.data);
          } else {
            setTransfers([]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, leadId]);

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0B3A66] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#E7D58A] font-bold text-base">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">{lead.name}</h3>
                <CourseBadge course={lead.course || 'HRCA'} size="sm" />
              </div>
              <p className="text-xs text-blue-100 font-mono mt-0.5">
                {lead.phone} {lead.location ? `• ${lead.location}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditLead(lead)}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <CallButton phone={lead.phone} name={lead.name} size="sm" />
            <WhatsAppButton
              leadId={leadId}
              phone={lead.whatsapp || lead.phone}
              name={lead.name}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCompleteFollowUp(lead)}
              className="px-3 py-1.5 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Complete Follow-up</span>
            </button>
            <button
              type="button"
              onClick={() => onRescheduleFollowUp(lead)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
              <span>Reschedule</span>
            </button>

            {onCreateAdmission && lead.admissionStatus !== 'Admitted' && (
              <button
                type="button"
                onClick={() => onCreateAdmission(lead)}
                className="px-3 py-1.5 bg-[#16834B] hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Admit Student</span>
              </button>
            )}

            {onTransferCourse && isChairman && (
              <button
                type="button"
                onClick={() => onTransferCourse(lead)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Section 1: Profile & Sales Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Info */}
            <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0B3A66]" />
                Profile Information
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800 font-mono">{lead.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="font-semibold text-slate-800 font-mono">{lead.whatsapp || lead.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-800">{lead.location || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Lead Source:</span>
                  <span className="font-semibold text-slate-800">{lead.leadSource || 'Meta Ads'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Assigned Salesperson:</span>
                  <span className="font-semibold text-[#0B3A66]">
                    {lead.assignedSalespersonName || 'Not Assigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales Status */}
            <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#0B3A66]" />
                Sales & Priority Status
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Priority Tier:</span>
                  <PriorityBadge tier={lead.priorityTier} score={lead.priorityScore} size="sm" />
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Temperature:</span>
                  <TemperatureBadge temperature={lead.temperature} size="sm" />
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Status:</span>
                  <StatusBadge status={lead.status} size="sm" />
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Interest Level:</span>
                  <InterestBadge interest={lead.interestLevel || 'Moderate'} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Objection & Suggested Strategy */}
          <div className="bg-amber-50/60 rounded-lg p-4 border border-amber-200">
            <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              Objection & Counseling Strategy
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-amber-900 w-28 shrink-0">Current Objection:</span>
                <span className="font-bold text-amber-950">
                  {lead.objection && lead.objection !== 'None' ? lead.objection : 'No active objection'}
                </span>
              </div>
              {lead.remark && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-amber-900 w-28 shrink-0">Sales Remark:</span>
                  <span className="text-slate-800 italic">"{lead.remark}"</span>
                </div>
              )}
              {lead.suggestedObjective && (
                <div className="flex items-start gap-2 bg-white/70 p-2 rounded border border-amber-200/60">
                  <span className="font-semibold text-[#0B3A66] w-28 shrink-0">Suggested Objective:</span>
                  <span className="text-slate-800">{lead.suggestedObjective}</span>
                </div>
              )}
              {lead.suggestedQuestion && (
                <div className="flex items-start gap-2 bg-white/70 p-2 rounded border border-amber-200/60">
                  <span className="font-semibold text-emerald-800 w-28 shrink-0">Suggested Question:</span>
                  <span className="text-slate-800 font-medium">"{lead.suggestedQuestion}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Follow-Up Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-[#0B3A66] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Next Scheduled Follow-up
                </span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {lead.nextFollowUpAt
                    ? new Date(lead.nextFollowUpAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'No follow-up scheduled'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Last Contact Date
                </span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {lead.lastContactAt
                    ? new Date(lead.lastContactAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Never contacted yet'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Admission Status (if any) */}
          {lead.admissionStatus && (
            <div className="bg-emerald-50/70 rounded-lg p-4 border border-emerald-200">
              <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                Admission Record
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Status:</span>
                  <span className="font-bold text-emerald-800">{lead.admissionStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Enrolled Course:</span>
                  <span className="font-semibold text-slate-800">{lead.course}</span>
                </div>
                {lead.admissionId && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">Admission ID:</span>
                    <span className="font-mono text-slate-700">{lead.admissionId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 5: Course Transfer History (if any) */}
          {transfers.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#0B3A66]" />
                Course Transfer History
              </h4>
              <div className="space-y-2">
                {transfers.map((t, idx) => (
                  <div
                    key={t.id || t.transferId || idx}
                    className="bg-white p-2.5 rounded border border-slate-200 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                          {t.previousCourse}
                        </span>
                        <span>→</span>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded font-bold">
                          {t.newCourse}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">
                        <strong>Reason:</strong> {t.reason}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{t.changedByName || t.changedBy}</div>
                      <div>{new Date(t.changedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Chronological Follow-Up History */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0B3A66]" />
              Follow-Up Activity History
            </h4>

            {loading ? (
              <div className="py-6 flex items-center justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#0B3A66] mr-2" />
                <span>Loading activity log...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                {history.map((h, i) => (
                  <div key={h.id || h.historyId || i} className="relative">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#0B3A66] border-2 border-white" />

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-800">
                          {h.salespersonName || 'Salesperson'}
                        </span>
                        <span>
                          {h.contactedAt ? new Date(h.contactedAt).toLocaleString() : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-xs text-[#0B3A66]">{h.result}</span>
                        {h.temperature && <TemperatureBadge temperature={h.temperature} size="sm" />}
                        {h.interestLevel && <InterestBadge interest={h.interestLevel} size="sm" />}
                      </div>
                      {h.objection && (
                        <div className="text-[11px] text-amber-800 font-medium mb-1">
                          Objection: {h.objection}
                        </div>
                      )}
                      {h.remark && (
                        <p className="text-slate-700 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                          "{h.remark}"
                        </p>
                      )}
                      {h.nextFollowUpAt && (
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            Next Follow-up set for: {new Date(h.nextFollowUpAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                No past follow-up records for this lead yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
