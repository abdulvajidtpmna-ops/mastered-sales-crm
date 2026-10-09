import React from 'react';
import type { Lead } from '../../types';
import { TemperatureBadge, PriorityBadge, StatusBadge, InterestBadge, CourseBadge } from '../common/Badges';
import { CallButton, WhatsAppButton } from '../common/Buttons';
import { CheckSquare, CalendarClock, ChevronRight, UserCheck } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onCompleteFollowUp?: (lead: Lead) => void;
  onRescheduleFollowUp?: (lead: Lead) => void;
  onViewDetails?: (lead: Lead) => void;
  onAssign?: (lead: Lead) => void;
  isChairman?: boolean;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onCompleteFollowUp,
  onRescheduleFollowUp,
  onViewDetails,
  onAssign,
  isChairman = false,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Lead Name & Phone</th>
              <th className="py-3 px-3">Course</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Temperature</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Interest</th>
              <th className="py-3 px-3">Objection</th>
              <th className="py-3 px-3">Next Follow-up</th>
              {isChairman && <th className="py-3 px-3">Salesperson</th>}
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const leadId = lead.id || lead.leadId || '';
              return (
                <tr
                  key={leadId || lead.phone}
                  onClick={() => onViewDetails?.(lead)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-[#0B3A66] transition-colors">
                      {lead.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.phone}</div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <CourseBadge course={lead.course || 'HRCA'} size="sm" />
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <PriorityBadge tier={lead.priorityTier} score={lead.priorityScore} size="sm" />
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <TemperatureBadge temperature={lead.temperature} size="sm" />
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={lead.status} size="sm" />
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {lead.interestLevel ? (
                      <InterestBadge interest={lead.interestLevel} size="sm" />
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 max-w-[150px] truncate" title={lead.objection || ''}>
                    {lead.objection && lead.objection !== 'None' ? (
                      <span className="font-medium text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {lead.objection}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    {lead.nextFollowUpAt ? (
                      <span>
                        {new Date(lead.nextFollowUpAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {isChairman && (
                    <td className="py-3 px-3 whitespace-nowrap">
                      {lead.assignedSalespersonName ? (
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {lead.assignedSalespersonName}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">Unassigned</span>
                      )}
                    </td>
                  )}

                  <td
                    className="py-3 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <CallButton phone={lead.phone} name={lead.name} size="sm" />
                      <WhatsAppButton
                        leadId={leadId}
                        phone={lead.whatsapp || lead.phone}
                        name={lead.name}
                        size="sm"
                      />

                      {onCompleteFollowUp && (
                        <button
                          type="button"
                          onClick={() => onCompleteFollowUp(lead)}
                          title="Complete Follow-up"
                          className="p-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onRescheduleFollowUp && (
                        <button
                          type="button"
                          onClick={() => onRescheduleFollowUp(lead)}
                          title="Reschedule Follow-up"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isChairman && onAssign && (
                        <button
                          type="button"
                          onClick={() => onAssign(lead)}
                          title="Assign Salesperson"
                          className="p-1.5 text-[#0B3A66] hover:bg-blue-50 border border-[#0B3A66]/30 rounded-md transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onViewDetails?.(lead)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        title="View Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
