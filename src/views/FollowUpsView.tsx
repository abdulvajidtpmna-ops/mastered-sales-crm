import React, { useState, useEffect } from 'react';
import type { FollowUpItem, Lead, Objection, Course } from '../types';
import { api } from '../services/api';
import { FollowUpCard } from '../components/leads/FollowUpCard';
import { FollowUpModal } from '../components/modals/FollowUpModal';
import { RescheduleModal } from '../components/modals/RescheduleModal';
import { LeadDetailModal } from '../components/modals/LeadDetailModal';
import { LeadModal } from '../components/modals/LeadModal';
import { AdmissionModal } from '../components/modals/AdmissionModal';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates';
import { CalendarCheck, AlertTriangle, RefreshCw } from 'lucide-react';

export const FollowUpsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [todayQueue, setTodayQueue] = useState<FollowUpItem[]>([]);
  const [overdueList, setOverdueList] = useState<FollowUpItem[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Modals state
  const [activeFollowUpLead, setActiveFollowUpLead] = useState<Lead | null>(null);
  const [activeRescheduleLead, setActiveRescheduleLead] = useState<Lead | null>(null);
  const [activeDetailLead, setActiveDetailLead] = useState<Lead | null>(null);
  const [activeEditLead, setActiveEditLead] = useState<Lead | null>(null);
  const [activeAdmissionLead, setActiveAdmissionLead] = useState<Lead | null>(null);

  const fetchFollowUps = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const [todayRes, overdueRes, objRes, courseRes] = await Promise.all([
        api.getDailyFollowUpQueue(),
        api.getOverdueFollowUps().catch(() => ({ success: false, data: [] })),
        api.getObjections().catch(() => ({ success: false, data: [] })),
        api.getCourses().catch(() => ({ success: false, data: [] })),
      ]);

      if (todayRes.success) {
        let items: FollowUpItem[] = [];
        if (Array.isArray(todayRes.data)) {
          items = todayRes.data;
        } else if (todayRes.data && Array.isArray((todayRes.data as any).queue)) {
          items = (todayRes.data as any).queue;
        }
        setTodayQueue(items);
      } else {
        setErrorMsg(todayRes.message || 'Failed to load daily queue.');
      }

      if (overdueRes.success) {
        let items: FollowUpItem[] = [];
        if (Array.isArray(overdueRes.data)) {
          items = overdueRes.data;
        } else if (overdueRes.data && Array.isArray((overdueRes.data as any).overdue)) {
          items = (overdueRes.data as any).overdue;
        }
        setOverdueList(items.map((it) => ({ ...it, isOverdue: true })));
      }

      if (objRes.success && Array.isArray(objRes.data)) setObjections(objRes.data);
      if (courseRes.success && Array.isArray(courseRes.data)) setCourses(courseRes.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error fetching follow-ups.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const currentList = activeTab === 'today' ? todayQueue : overdueList;

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#0B3A66]" />
            <h1 className="text-lg font-bold text-slate-900">Follow-Up Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute and clear scheduled communication touchpoints
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-[#0B3A66] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Today's Queue</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'today' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {todayQueue.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {overdueList.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchFollowUps(true)}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <LoadingState message="Fetching follow-ups from CRM..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => fetchFollowUps()} />
      ) : currentList.length === 0 ? (
        <EmptyState
          title={activeTab === 'today' ? "Today's queue is all done!" : 'No overdue follow-ups!'}
          description={
            activeTab === 'today'
              ? 'All daily scheduled follow-ups have been resolved.'
              : 'Great job staying on top of scheduled communications.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {currentList.map((item, index) => (
            <FollowUpCard
              key={item.id || item.leadId || item.phone || index}
              item={item}
              rankIndex={index}
              onComplete={(lead) => setActiveFollowUpLead(lead)}
              onReschedule={(lead) => setActiveRescheduleLead(lead)}
              onViewDetails={(lead) => setActiveDetailLead(lead)}
            />
          ))}
        </div>
      )}

      {/* Complete Follow-up Modal */}
      <FollowUpModal
        isOpen={!!activeFollowUpLead}
        lead={activeFollowUpLead}
        objections={objections}
        onClose={() => setActiveFollowUpLead(null)}
        onSuccess={() => fetchFollowUps(true)}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!activeRescheduleLead}
        lead={activeRescheduleLead}
        onClose={() => setActiveRescheduleLead(null)}
        onSuccess={() => fetchFollowUps(true)}
      />

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={!!activeDetailLead}
        lead={activeDetailLead}
        onClose={() => setActiveDetailLead(null)}
        onEditLead={(lead) => {
          setActiveDetailLead(null);
          setActiveEditLead(lead);
        }}
        onCompleteFollowUp={(lead) => {
          setActiveDetailLead(null);
          setActiveFollowUpLead(lead);
        }}
        onRescheduleFollowUp={(lead) => {
          setActiveDetailLead(null);
          setActiveRescheduleLead(lead);
        }}
        onCreateAdmission={(lead) => {
          setActiveDetailLead(null);
          setActiveAdmissionLead(lead);
        }}
      />

      {/* Edit Lead Modal */}
      <LeadModal
        isOpen={!!activeEditLead}
        lead={activeEditLead}
        courses={courses}
        objections={objections}
        onClose={() => setActiveEditLead(null)}
        onSuccess={() => fetchFollowUps(true)}
      />

      {/* Admission Modal */}
      <AdmissionModal
        isOpen={!!activeAdmissionLead}
        lead={activeAdmissionLead}
        courses={courses}
        onClose={() => setActiveAdmissionLead(null)}
        onSuccess={() => fetchFollowUps(true)}
      />
    </div>
  );
};
