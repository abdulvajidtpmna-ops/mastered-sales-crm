import React from 'react';
import { Filter, X } from 'lucide-react';
import type { Course } from '../../types';

export interface FilterState {
  course?: string;
  temperature?: string;
  status?: string;
  interestLevel?: string;
  leadSource?: string;
  priorityTier?: string;
  salespersonId?: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  courses?: Course[];
  leadSources?: string[];
  salespeople?: { userId: string; name: string }[];
  showSalespersonFilter?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
  courses = [],
  leadSources = [],
  salespeople = [],
  showSalespersonFilter = false,
}) => {
  const hasActiveFilters = Object.values(filters).some((v) => !!v);

  const handleSelect = (key: keyof FilterState, value: string) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-4">
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-[#0B3A66]" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#C9A227]"></span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {/* Course Filter */}
        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Course
          </label>
          <select
            value={filters.course || ''}
            onChange={(e) => handleSelect('course', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
          >
            <option value="">All Courses</option>
            {courses.length > 0 ? (
              courses.map((c) => (
                <option key={c.code || c.name} value={c.code || c.name}>
                  {c.code || c.name}
                </option>
              ))
            ) : (
              <>
                <option value="HRCA">HRCA</option>
                <option value="BHA">BHA</option>
              </>
            )}
          </select>
        </div>

        {/* Temperature Filter */}
        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Temperature
          </label>
          <select
            value={filters.temperature || ''}
            onChange={(e) => handleSelect('temperature', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
          >
            <option value="">All Temps</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleSelect('status', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Follow-up">In Follow-up</option>
            <option value="Interested">Interested</option>
            <option value="Callback Requested">Callback Requested</option>
            <option value="Admission In Progress">Admission In Progress</option>
            <option value="Admitted">Admitted</option>
            <option value="Not Interested">Not Interested</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Priority Tier
          </label>
          <select
            value={filters.priorityTier || ''}
            onChange={(e) => handleSelect('priorityTier', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Medium</option>
            <option value="P4">P4 Low</option>
            <option value="P5">P5 Minimal</option>
          </select>
        </div>

        {/* Lead Source Filter */}
        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Lead Source
          </label>
          <select
            value={filters.leadSource || ''}
            onChange={(e) => handleSelect('leadSource', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
          >
            <option value="">All Sources</option>
            {leadSources.length > 0 ? (
              leadSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))
            ) : (
              <>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Organic">Organic</option>
                <option value="Referral">Referral</option>
                <option value="Direct Call">Direct Call</option>
                <option value="Website">Website</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Other">Other</option>
              </>
            )}
          </select>
        </div>

        {/* Salesperson Filter (for Chairman) */}
        {showSalespersonFilter && (
          <div>
            <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Salesperson
            </label>
            <select
              value={filters.salespersonId || ''}
              onChange={(e) => handleSelect('salespersonId', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A66]"
            >
              <option value="">All Salespeople</option>
              {salespeople.map((sp) => (
                <option key={sp.userId} value={sp.userId}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
