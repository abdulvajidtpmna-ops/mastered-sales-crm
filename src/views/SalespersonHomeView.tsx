import React, { useState, useEffect, useMemo } from 'react';
import type { FollowUpItem, Lead, Objection, Course } from '../types';
import { api } from '../services/api';
import { FollowUpCard } from '../components/leads/FollowUpCard';
import { FollowUpModal } from '../components/modals/FollowUpModal';
import { RescheduleModal } from '../components/modals/RescheduleModal';
import { LeadDetailModal } from '../components/modals/LeadDetailModal';
import { LeadModal } from '../components/modals/LeadModal';
import { AdmissionModal } from '../components/modals/AdmissionModal';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates';
import {
  Flame,
  ShieldAlert,
  Zap,
  ListOrdered,
  RefreshCw,
} from 'lucide-react';

interface SalespersonHomeViewProps {
  onNavigateToLeads?: () => void;
}

export const SalespersonHomeView: React.FC<SalespersonHomeViewProps> = ({ onNavigateToLeads }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [queue, setQueue] = useState<FollowUpItem[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Selected lead for modal actions
  const [activeFollowUpLead, setActiveFollowUpLead] = useState<Lead | null>(null);
  const [activeRescheduleLead, setActiveRescheduleLead] = useState<Lead | null>(null);
  const [activeDetailLead, setActiveDetailLead] = useState<Lead | null>(null);
  const [activeEditLead, setActiveEditLead] = useState<Lead | null>(null);
  const [activeAdmissionLead, setActiveAdmissionLead] = useState<Lead | null>(null);

  const [selectedFilterTier, setSelectedFilterTier] = useState<string>('ALL');

  const fetchQueueData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const [queueRes, objRes, courseRes] = await Promise.all([
        api.getDailyFollowUpQueue(),
        api.getObjections().catch(() => ({ success: false, data: [] })),
        api.getCourses().catch(() => ({ success: false, data: [] })),
      ]);

      if (queueRes.success) {
        let items: FollowUpItem[] = [];
        if (Array.isArray(queueRes.data)) {
          items = queueRes.data;
        } else if (queueRes.data && Array.isArray((queueRes.data as any).queue)) {
          items = (queueRes.data as any).queue;
        }

        // Sort items according to rules: PriorityScore DESC, NextFollowUpAt ASC, LastContactAt ASC
        items.sort((a, b) => {
          const scoreA = a.priorityScore || 0;
          const scoreB = b.priorityScore || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;

          const nextA = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : 0;
          const nextB = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : 0;
          if (nextA !== nextB) return nextA - nextB;

          const lastA = a.lastContactAt ? new Date(a.lastContactAt).getTime() : 0;
          const lastB = b.lastContactAt ? new Date(b.lastContactAt).getTime() : 0;
          return lastA - lastB;
        });

        // Limit to 60 system
        setQueue(items.slice(0, 60));
      } else {
        setErrorMsg(queueRes.message || 'Failed to load follow-up queue.');
      }

      if (objRes.success && Array.isArray(objRes.data)) {
        setObjections(objRes.data);
      }
      if (courseRes.success && Array.isArray(courseRes.data)) {
        setCourses(courseRes.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error fetching daily follow-up queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  // Priority Summary Counts
  const p1Count = useMemo(() => {
    return queue.filter(
      (item) => (item.priorityTier || '').toUpperCase().includes('P1') || (item.priorityTier || '').toUpperCase().includes('CRITICAL')
    ).length;
  }, [queue]);

  const p2Count = useMemo(() => {
    return queue.filter(
      (item) => (item.priorityTier || '').toUpperCase().includes('P2') || (item.priorityTier || '').toUpperCase().includes('HIGH')
    ).length;
  }, [queue]);

  const p3Count = useMemo(() => {
    return queue.filter(
      (item) => (item.priorityTier || '').toUpperCase().includes('P3') || (item.priorityTier || '').toUpperCase().includes('MEDIUM')
    ).length;
  }, [queue]);

  const filteredQueue = useMemo(() => {
    if (selectedFilterTier === 'ALL') return queue;
    return queue.filter((item) => {
      const tier = (item.priorityTier || '').toUpperCase();
      return tier.includes(selectedFilterTier);
    });
  }, [queue, selectedFilterTier]);

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      {/* Work-Focused Hero Widget */}
      <div className="bg-[#0B3A66] rounded-xl text-white p-4 sm:p-6 shadow-md border border-[#072A4A] relative overflow-hidden">
        {/* Accent Decor */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-[#C9A227]/10 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E7D58A]">
                60 Daily Follow-Up System
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Today's Priority Queue
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Counter Badge */}
              <div className="bg-[#072A4A]/80 border border-[#1E5A91] rounded-lg px-4 py-2 text-right">
                <div className="text-xs text-blue-200">Daily Target</div>
                <div className="text-xl sm:text-2xl font-black text-[#E7D58A] leading-tight">
                  {queue.length} <span className="text-xs font-normal text-blue-300">/ 60</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchQueueData(true)}
                disabled={refreshing}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                title="Refresh Queue"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Priority Summary Selector */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-blue-800/60">
            {/* ALL */}
            <button
              type="button"
              onClick={() => setSelectedFilterTier('ALL')}
              className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                selectedFilterTier === 'ALL'
                  ? 'bg-white text-[#0B3A66] font-bold shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">All Queue</div>
              <div className="text-base sm:text-lg font-black">{queue.length}</div>
            </button>

            {/* P1 Critical */}
            <button
              type="button"
              onClick={() => setSelectedFilterTier('P1')}
              className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                selectedFilterTier === 'P1'
                  ? 'bg-rose-500 text-white font-bold shadow-xs'
                  : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-200 border border-rose-800/40'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> P1 Critical
              </div>
              <div className="text-base sm:text-lg font-black">{p1Count}</div>
            </button>

            {/* P2 High */}
            <button
              type="button"
              onClick={() => setSelectedFilterTier('P2')}
              className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                selectedFilterTier === 'P2'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-800/40'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center gap-1">
                <Flame className="w-3 h-3" /> P2 High
              </div>
              <div className="text-base sm:text-lg font-black">{p2Count}</div>
            </button>

            {/* P3 Medium */}
            <button
              type="button"
              onClick={() => setSelectedFilterTier('P3')}
              className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                selectedFilterTier === 'P3'
                  ? 'bg-blue-400 text-slate-900 font-bold shadow-xs'
                  : 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-200 border border-blue-800/40'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center gap-1">
                <Zap className="w-3 h-3" /> P3 Medium
              </div>
              <div className="text-base sm:text-lg font-black">{p3Count}</div>
            </button>
          </div>
        </div>
      </div>

      {/* Queue Content Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-[#0B3A66]" />
            <h2 className="text-sm font-bold text-slate-900">
              {selectedFilterTier === 'ALL'
                ? 'Ranked Action Queue'
                : `Filtered Queue: ${selectedFilterTier}`}
            </h2>
            <span className="text-xs text-slate-500 font-medium">({filteredQueue.length} leads)</span>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            Sorted by: <strong>Priority Score → Urgency → Last Touch</strong>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Calculating 60-action priority queue..." />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={() => fetchQueueData()} />
        ) : filteredQueue.length === 0 ? (
          <EmptyState
            title="Queue is empty!"
            description={
              selectedFilterTier !== 'ALL'
                ? `No follow-ups matching tier ${selectedFilterTier}.`
                : "Great job! You've completed all scheduled follow-ups for today."
            }
            actionText="View All Leads"
            onAction={onNavigateToLeads}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredQueue.map((item, index) => (
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
      </div>

      {/* Complete Follow-up Modal */}
      <FollowUpModal
        isOpen={!!activeFollowUpLead}
        lead={activeFollowUpLead}
        objections={objections}
        onClose={() => setActiveFollowUpLead(null)}
        onSuccess={() => fetchQueueData(true)}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!activeRescheduleLead}
        lead={activeRescheduleLead}
        onClose={() => setActiveRescheduleLead(null)}
        onSuccess={() => fetchQueueData(true)}
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
        onSuccess={() => fetchQueueData(true)}
      />

      {/* Admission Modal */}
      <AdmissionModal
        isOpen={!!activeAdmissionLead}
        lead={activeAdmissionLead}
        courses={courses}
        onClose={() => setActiveAdmissionLead(null)}
        onSuccess={() => fetchQueueData(true)}
      />
    </div>
  );
};
