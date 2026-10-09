import React from 'react';
import type { FollowUpItem } from '../../types';
import { TemperatureBadge, PriorityBadge, InterestBadge, CourseBadge } from '../common/Badges';
import { CallButton, WhatsAppButton } from '../common/Buttons';
import { CheckSquare, CalendarClock, Target, AlertCircle, Clock } from 'lucide-react';

interface FollowUpCardProps {
  item: FollowUpItem;
  rankIndex?: number;
  onComplete: (item: FollowUpItem) => void;
  onReschedule: (item: FollowUpItem) => void;
  onViewDetails?: (item: FollowUpItem) => void;
}

export const FollowUpCard: React.FC<FollowUpCardProps> = ({
  item,
  rankIndex,
  onComplete,
  onReschedule,
  onViewDetails,
}) => {
  const leadId = item.id || item.leadId || '';
  const isOverdue = item.isOverdue || (item.nextFollowUpAt && new Date(item.nextFollowUpAt) < new Date());

  return (
    <div
      onClick={() => onViewDetails?.(item)}
      className={`bg-white rounded-lg border transition-all duration-150 p-4 shadow-xs hover:shadow-md cursor-pointer ${
        isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Bar with Queue Rank & Priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {rankIndex !== undefined && (
            <span className="w-5 h-5 rounded-full bg-[#0B3A66] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {rankIndex + 1}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 hover:text-[#0B3A66] transition-colors">
                {item.name}
              </h4>
              <CourseBadge course={item.course || 'HRCA'} size="sm" />
            </div>
            <p className="text-xs text-slate-500 font-mono">{item.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PriorityBadge tier={item.priorityTier} score={item.priorityScore} size="sm" />
        </div>
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <TemperatureBadge temperature={item.temperature} size="sm" />
        {item.interestLevel && <InterestBadge interest={item.interestLevel} size="sm" />}
        {isOverdue && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Overdue
          </span>
        )}
      </div>

      {/* Objection & Recommended Action */}
      {(item.objection || item.suggestedObjective || item.recommendedAction) && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-2 text-xs space-y-1 my-2">
          {item.objection && item.objection !== 'None' && (
            <div className="flex items-start gap-1.5 text-amber-900">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-800">
                  Objection:
                </span>{' '}
                <span className="font-medium">{item.objection}</span>
              </div>
            </div>
          )}

          {(item.suggestedObjective || item.recommendedAction) && (
            <div className="flex items-start gap-1.5 text-slate-700">
              <Target className="w-3.5 h-3.5 text-[#0B3A66] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[11px] uppercase tracking-wider text-[#0B3A66]">
                  Objective:
                </span>{' '}
                <span>{item.suggestedObjective || item.recommendedAction}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Timing */}
      <div className="text-[11px] text-slate-500 mb-3 flex items-center justify-between">
        <span>
          Scheduled:{' '}
          <strong className="text-slate-700">
            {item.nextFollowUpAt
              ? new Date(item.nextFollowUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Today'}
          </strong>
        </span>
        <span>
          Last Contact:{' '}
          <span className="text-slate-600 font-medium">
            {item.lastContactAt
              ? new Date(item.lastContactAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'Never'}
          </span>
        </span>
      </div>

      {/* 4 Direct Touch Actions */}
      <div
        className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <CallButton phone={item.phone} name={item.name} size="sm" className="w-full justify-center" />
        <WhatsAppButton
          leadId={leadId}
          phone={item.whatsapp || item.phone}
          name={item.name}
          size="sm"
          className="w-full justify-center"
        />
        <button
          type="button"
          onClick={() => onComplete(item)}
          className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
        <button
          type="button"
          onClick={() => onReschedule(item)}
          className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors cursor-pointer"
        >
          <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
          <span>Later</span>
        </button>
      </div>
    </div>
  );
};
