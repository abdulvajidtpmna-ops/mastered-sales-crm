import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, UserPlus, RefreshCw, Download } from 'lucide-react';

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install on iOS/Safari: tap "Share" and select "Add to Home Screen". On Android/Chrome: tap browser menu (3 dots) and select "Install app".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200">
            <img src="/logo.png" alt="Mastered Logo" className="w-full h-full object-cover" />
          </div>
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
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          title="Install CRM App on your device"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#0B3A66] bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#C9A227]" />
          <span className="hidden sm:inline">Install App</span>
        </button>

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
