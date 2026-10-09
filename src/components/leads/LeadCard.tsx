import React from 'react';
import type { Lead } from '../../types';
import { TemperatureBadge, PriorityBadge, StatusBadge, InterestBadge, CourseBadge } from '../common/Badges';
import { CallButton, WhatsAppButton } from '../common/Buttons';
import { Calendar, Clock, AlertCircle, ChevronRight, CheckSquare, CalendarClock } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onCompleteFollowUp?: (lead: Lead) => void;
  onRescheduleFollowUp?: (lead: Lead) => void;
  onViewDetails?: (lead: Lead) => void;
  onAssign?: (lead: Lead) => void;
  isChairman?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onCompleteFollowUp,
  onRescheduleFollowUp,
  onViewDetails,
  onAssign,
  isChairman,
}) => {
  const leadId = lead.id || lead.leadId || '';

  return (
    <div
      onClick={() => onViewDetails?.(lead)}
      className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-150 p-4 flex flex-col justify-between gap-3 cursor-pointer group"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3A66] transition-colors">
                {lead.name}
              </h3>
              <CourseBadge course={lead.course || 'HRCA'} size="sm" />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.phone}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <PriorityBadge tier={lead.priorityTier} score={lead.priorityScore} size="sm" />
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 my-2">
          <TemperatureBadge temperature={lead.temperature} size="sm" />
          <StatusBadge status={lead.status} size="sm" />
          {lead.interestLevel && <InterestBadge interest={lead.interestLevel} size="sm" />}
        </div>

        {/* Objection & Suggested Action (if any) */}
        {lead.objection && lead.objection !== 'None' && lead.objection !== 'Other' && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded px-2.5 py-1.5 text-xs text-amber-900 my-1.5 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-semibold">{lead.objection}</span>
              {lead.remark && <span className="text-amber-800 ml-1 text-[11px]">— {lead.remark}</span>}
            </div>
          </div>
        )}

        {/* Timing Information */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 truncate">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Next: </span>
            <span className="font-medium text-slate-700 truncate">
              {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'None'}
            </span>
          </div>
          <div className="flex items-center gap-1 truncate justify-end">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Last: </span>
            <span className="font-medium text-slate-700 truncate">
              {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
            </span>
          </div>
        </div>

        {isChairman && lead.assignedSalespersonName && (
          <div className="text-[11px] text-slate-500 mt-1 bg-slate-50 px-2 py-0.5 rounded flex items-center justify-between">
            <span>Assigned to:</span>
            <span className="font-semibold text-slate-700">{lead.assignedSalespersonName}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center gap-1.5 pt-2 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <CallButton phone={lead.phone} name={lead.name} size="sm" className="flex-1" />
        <WhatsAppButton
          leadId={leadId}
          phone={lead.whatsapp || lead.phone}
          name={lead.name}
          size="sm"
          className="flex-1"
        />

        {onCompleteFollowUp && (
          <button
            type="button"
            onClick={() => onCompleteFollowUp(lead)}
            title="Complete Follow-up"
            className="p-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        )}

        {onRescheduleFollowUp && (
          <button
            type="button"
            onClick={() => onRescheduleFollowUp(lead)}
            title="Reschedule Follow-up"
            className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            <CalendarClock className="w-4 h-4" />
          </button>
        )}

        {isChairman && onAssign && (
          <button
            type="button"
            onClick={() => onAssign(lead)}
            className="px-2 py-1 text-xs font-semibold text-[#0B3A66] hover:bg-blue-50 border border-blue-200 rounded-md transition-colors cursor-pointer"
          >
            Assign
          </button>
        )}

        <button
          type="button"
          onClick={() => onViewDetails?.(lead)}
          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors ml-auto"
          title="View Lead Profile"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
