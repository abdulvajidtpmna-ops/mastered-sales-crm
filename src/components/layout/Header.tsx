import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, UserPlus, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenCreateLead?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenCreateLead,
  onRefresh,
  isRefreshing = false,
}) => {
  const { user, isChairman } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B3A66]">
              MASTERED CRM
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                isChairman
                  ? 'bg-[#C9A227]/20 text-amber-900 border border-[#C9A227]/40'
                  : 'bg-blue-100 text-[#0B3A66] border border-blue-200'
              }`}
            >
              {isChairman ? 'CHAIRMAN' : 'SALES REP'}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            {getGreeting()}, <span className="text-[#0B3A66]">{firstName}</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh CRM data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
          </button>
        )}

        {onOpenCreateLead && (
          <button
            type="button"
            onClick={onOpenCreateLead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#E7D58A]" />
            <span className="hidden sm:inline">New Lead</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>
    </header>
  );
};
