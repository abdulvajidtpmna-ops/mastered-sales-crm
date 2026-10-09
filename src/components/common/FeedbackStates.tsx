import React from 'react';
import { Loader2, AlertCircle, Inbox, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlightColor?: string;
  badge?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlightColor,
  badge,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-4 shadow-xs transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
        {Icon && (
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              highlightColor ? highlightColor : 'bg-blue-50 text-[#0B3A66]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value !== undefined && value !== null ? value : '-'}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string; compact?: boolean }> = ({
  message = 'Loading CRM data...',
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-slate-500 ${
        compact ? 'py-8' : 'py-16'
      }`}
    >
      <Loader2 className="w-7 h-7 animate-spin text-[#0B3A66]" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}> = ({
  title = 'No leads yet',
  description = 'There are no records found for the selected view or filter.',
  actionText,
  onAction,
  icon: Icon = Inbox,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-lg border border-dashed border-slate-200 my-2">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3.5 py-1.5 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Something went wrong',
  message = 'Could not load data from the server.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-red-50/50 rounded-lg border border-red-200 my-2">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="text-xs text-red-700 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-[#0B3A66]'
              }`}
            >
              {isDanger ? <AlertCircle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-600 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-5 py-3 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0B3A66] hover:bg-[#072A4A]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
