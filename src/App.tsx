import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import type { NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { LoginView } from './views/LoginView';
import { SalespersonHomeView } from './views/SalespersonHomeView';
import { LeadsView } from './views/LeadsView';
import { FollowUpsView } from './views/FollowUpsView';
import { AdmissionsView } from './views/AdmissionsView';
import { PerformanceView } from './views/PerformanceView';
import { ChairmanDashboardView } from './views/ChairmanDashboardView';
import { SalesTeamView } from './views/SalesTeamView';
import { ReportsView } from './views/ReportsView';
import { WhatsAppActivityView } from './views/WhatsAppActivityView';
import { LeadModal } from './components/modals/LeadModal';
import { LoadingState } from './components/common/FeedbackStates';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isChairman } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItemKey>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalCreateLeadOpen, setIsGlobalCreateLeadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Set default tab on login based on role
  useEffect(() => {
    if (isAuthenticated) {
      if (isChairman) {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('home');
      }
    }
  }, [isAuthenticated, isChairman]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center">
        <LoadingState message="Initializing Mastered CRM..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'home':
        return <SalespersonHomeView key={refreshKey} onNavigateToLeads={() => setCurrentTab('leads')} />;
      case 'dashboard':
        return <ChairmanDashboardView key={refreshKey} onNavigate={(tab) => setCurrentTab(tab as NavItemKey)} />;
      case 'leads':
        return <LeadsView key={refreshKey} />;
      case 'followups':
        return <FollowUpsView key={refreshKey} />;
      case 'admissions':
        return <AdmissionsView key={refreshKey} />;
      case 'performance':
        return <PerformanceView key={refreshKey} />;
      case 'sales_team':
        return <SalesTeamView key={refreshKey} onSelectSalesperson={() => setCurrentTab('leads')} />;
      case 'reports':
        return <ReportsView key={refreshKey} />;
      case 'whatsapp':
        return <WhatsAppActivityView key={refreshKey} />;
      default:
        return isChairman ? (
          <ChairmanDashboardView key={refreshKey} onNavigate={(tab) => setCurrentTab(tab as NavItemKey)} />
        ) : (
          <SalespersonHomeView key={refreshKey} onNavigateToLeads={() => setCurrentTab('leads')} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col md:flex-row font-sans text-[#17212B]">
      {/* Sidebar (Desktop / Drawer on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenCreateLead={() => setIsGlobalCreateLeadOpen(true)}
          onRefresh={handleRefresh}
        />

        {/* Dynamic View Container protected by ErrorBoundary */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <ErrorBoundary fallbackTitle="Error loading view">
            {renderActiveView()}
          </ErrorBoundary>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNavigation currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Global Create Lead Modal */}
        <LeadModal
          isOpen={isGlobalCreateLeadOpen}
          onClose={() => setIsGlobalCreateLeadOpen(false)}
          onSuccess={() => {
            setIsGlobalCreateLeadOpen(false);
            handleRefresh();
          }}
        />
      </div>
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <ToastProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
