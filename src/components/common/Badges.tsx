import React from 'react';
import type { LeadTemperature, LeadStatus, InterestLevel, PriorityTier } from '../../types';
import { Flame, ShieldAlert, Zap, Clock, CheckCircle2 } from 'lucide-react';

export const TemperatureBadge: React.FC<{ temperature?: LeadTemperature | string; size?: 'sm' | 'md' }> = ({
  temperature = 'COLD',
  size = 'md',
}) => {
  const temp = (temperature || '').toUpperCase();
  const isSm = size === 'sm';

  if (temp === 'HOT') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <Flame className={isSm ? 'w-3 h-3 text-red-600' : 'w-3.5 h-3.5 text-red-600'} />
        Hot
      </span>
    );
  }

  if (temp === 'WARM') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 ${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <Zap className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
        Warm
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Clock className={isSm ? 'w-3 h-3 text-blue-500' : 'w-3.5 h-3.5 text-blue-500'} />
      Cold
    </span>
  );
};

export const PriorityBadge: React.FC<{
  tier?: PriorityTier | string;
  score?: number;
  size?: 'sm' | 'md';
}> = ({ tier = 'P3', score, size = 'md' }) => {
  const t = (tier || '').toUpperCase();
  const isSm = size === 'sm';

  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = tier || 'P3';

  if (t.includes('P1') || t.includes('CRITICAL')) {
    colorClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    label = 'P1 Critical';
  } else if (t.includes('P2') || t.includes('HIGH')) {
    colorClass = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
    label = 'P2 High';
  } else if (t.includes('P3') || t.includes('MEDIUM')) {
    colorClass = 'bg-blue-100 text-blue-800 border-blue-200 font-medium';
    label = 'P3 Medium';
  } else if (t.includes('P4') || t.includes('LOW')) {
    colorClass = 'bg-slate-100 text-slate-700 border-slate-200 font-normal';
    label = 'P4 Low';
  } else if (t.includes('P5')) {
    colorClass = 'bg-gray-100 text-gray-600 border-gray-200 font-normal';
    label = 'P5 Minimal';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${colorClass} ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {t.includes('P1') && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
      <span>{label}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-75 font-mono text-[10px] bg-black/5 px-1 py-0.2 rounded">
          {score}
        </span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status?: LeadStatus | string; size?: 'sm' | 'md' }> = ({
  status = 'New',
  size = 'md',
}) => {
  const s = (status || '').toString().toLowerCase();
  const isSm = size === 'sm';

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s.includes('admitted')) {
    bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (s.includes('interested') && !s.includes('not')) {
    bgClass = 'bg-indigo-100 text-indigo-800 border-indigo-300';
  } else if (s.includes('follow-up') || s.includes('followup') || s.includes('in_followup')) {
    bgClass = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (s.includes('admission in progress')) {
    bgClass = 'bg-teal-100 text-teal-800 border-teal-300';
  } else if (s.includes('callback')) {
    bgClass = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (s.includes('not interested') || s.includes('invalid')) {
    bgClass = 'bg-gray-100 text-gray-500 border-gray-200';
  } else if (s.includes('new')) {
    bgClass = 'bg-sky-100 text-sky-800 border-sky-300';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${bgClass} ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {s.includes('admitted') && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
      {status}
    </span>
  );
};

export const InterestBadge: React.FC<{ interest?: InterestLevel | string; size?: 'sm' | 'md' }> = ({
  interest = 'Interested',
  size = 'md',
}) => {
  const i = (interest || '').toString().toUpperCase();
  const isSm = size === 'sm';

  let cls = 'bg-slate-100 text-slate-700 border-slate-200';

  if (i.includes('HIGHLY') || i.includes('VERY_HIGH') || i.includes('VERY HIGH')) {
    cls = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
  } else if (i === 'INTERESTED' || i.includes('HIGH')) {
    cls = 'bg-teal-50 text-teal-700 border-teal-200 font-medium';
  } else if (i.includes('MODERAT')) {
    cls = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (i.includes('LESS') || i.includes('LOW')) {
    cls = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (i.includes('NOT') || i.includes('COLD')) {
    cls = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span
      className={`inline-flex items-center rounded border ${cls} ${
        isSm ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {interest}
    </span>
  );
};

export const CourseBadge: React.FC<{ course: string; size?: 'sm' | 'md' }> = ({
  course,
  size = 'md',
}) => {
  const isHRCA = (course || '').toUpperCase().includes('HRCA');
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${
        isHRCA
          ? 'bg-blue-900/10 text-[#0B3A66] border-[#0B3A66]/20'
          : 'bg-amber-900/10 text-[#C9A227] border-[#C9A227]/30'
      } ${isSm ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
    >
      {course}
    </span>
  );
};
