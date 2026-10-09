import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  BarChart3,
  MessageSquare,
  LogOut,
  UserCheck,
  Home,
} from 'lucide-react';

export type NavItemKey =
  | 'home'
  | 'dashboard'
  | 'leads'
  | 'followups'
  | 'sales_team'
  | 'admissions'
  | 'reports'
  | 'whatsapp'
  | 'performance';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen = false,
  onClose,
}) => {
  const { user, isChairman, logout } = useAuth();

  const chairmanItems: { key: NavItemKey; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'leads', label: 'All Leads', icon: Users },
    { key: 'sales_team', label: 'Sales Team', icon: UserCheck },
    { key: 'followups', label: 'Follow-ups', icon: CalendarCheck },
    { key: 'admissions', label: 'Admissions', icon: GraduationCap },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'whatsapp', label: 'WhatsApp Activity', icon: MessageSquare },
  ];

  const salespersonItems: { key: NavItemKey; label: string; icon: any }[] = [
    { key: 'home', label: 'Today\'s Work (Queue)', icon: Home },
    { key: 'leads', label: 'My Leads', icon: Users },
    { key: 'followups', label: 'Follow-up Queue', icon: CalendarCheck },
    { key: 'admissions', label: 'Admissions', icon: GraduationCap },
    { key: 'performance', label: 'My Performance', icon: BarChart3 },
  ];

  const items = isChairman ? chairmanItems : salespersonItems;

  return (
    <>
      {/* Mobile / Tablet Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#072A4A] text-white flex flex-col justify-between border-r border-[#0B3A66] transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-5 border-b border-[#0B3A66]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 border border-blue-400/30">
                <img src="/logo.png" alt="Mastered Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-wider text-[#E7D58A] uppercase">
                  Mastered Skill Academy
                </div>
                <div className="text-base font-extrabold text-white tracking-tight leading-none mt-0.5">
                  MASTERED CRM
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isChairman ? 'Chairman Workspace' : 'Sales Workspace'}
            </div>

            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.key);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B3A66] text-white font-bold shadow-xs border-l-3 border-[#C9A227]'
                      : 'text-slate-300 hover:bg-[#0B3A66]/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E7D58A]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-[#0B3A66]/60 bg-[#051F36]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#0B3A66] text-[#E7D58A] border border-[#C9A227]/40 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                isChairman
                  ? 'bg-[#C9A227]/20 text-[#E7D58A] border border-[#C9A227]/40'
                  : 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
              }`}
            >
              {user?.role || 'User'}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-white/5 hover:bg-rose-900/30 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-800/40 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
