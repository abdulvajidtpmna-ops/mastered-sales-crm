import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { NavItemKey } from './Sidebar';
import { Home, Users, CalendarCheck, BarChart3, LayoutDashboard, GraduationCap } from 'lucide-react';

interface BottomNavigationProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { isChairman } = useAuth();

  const salespersonTabs: { key: NavItemKey; label: string; icon: any }[] = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'leads', label: 'Leads', icon: Users },
    { key: 'followups', label: 'Follow-ups', icon: CalendarCheck },
    { key: 'performance', label: 'Performance', icon: BarChart3 },
  ];

  const chairmanTabs: { key: NavItemKey; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'leads', label: 'Leads', icon: Users },
    { key: 'followups', label: 'Follow-ups', icon: CalendarCheck },
    { key: 'admissions', label: 'Admissions', icon: GraduationCap },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const tabs = isChairman ? chairmanTabs : salespersonTabs;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#072A4A] border-t border-[#0B3A66] px-2 py-1 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-md transition-colors cursor-pointer min-w-[64px] ${
              isActive ? 'text-[#E7D58A]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-md ${isActive ? 'bg-[#0B3A66]' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-[#E7D58A]' : 'text-slate-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
