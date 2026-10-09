import React, { useState, useEffect, useMemo } from 'react';
import type { Lead, Course, Objection } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadTable } from '../components/leads/LeadTable';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';
import type { FilterState } from '../components/common/FilterBar';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates';
import { LeadModal } from '../components/modals/LeadModal';
import { LeadDetailModal } from '../components/modals/LeadDetailModal';
import { FollowUpModal } from '../components/modals/FollowUpModal';
import { RescheduleModal } from '../components/modals/RescheduleModal';
import { AdmissionModal } from '../components/modals/AdmissionModal';
import { CourseTransferModal } from '../components/modals/CourseTransferModal';
import { AssignLeadModal } from '../components/modals/AssignLeadModal';
import { LayoutGrid, Table as TableIcon, UserPlus, RefreshCw, Users } from 'lucide-react';

interface LeadsViewProps {
  openCreateModalDirectly?: boolean;
  onModalClosed?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  openCreateModalDirectly = false,
  onModalClosed,
}) => {
  const { isChairman } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [salespeople, setSalespeople] = useState<{ userId: string; name: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openCreateModalDirectly);
  const [activeDetailLead, setActiveDetailLead] = useState<Lead | null>(null);
  const [activeEditLead, setActiveEditLead] = useState<Lead | null>(null);
  const [activeFollowUpLead, setActiveFollowUpLead] = useState<Lead | null>(null);
  const [activeRescheduleLead, setActiveRescheduleLead] = useState<Lead | null>(null);
  const [activeAdmissionLead, setActiveAdmissionLead] = useState<Lead | null>(null);
  const [activeTransferLead, setActiveTransferLead] = useState<Lead | null>(null);
  const [activeAssignLead, setActiveAssignLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (openCreateModalDirectly) {
      setIsCreateModalOpen(true);
    }
  }, [openCreateModalDirectly]);

  const fetchLeadsData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    try {
      const [leadsRes, coursesRes, objRes, sourcesRes, dashboardRes] = await Promise.all([
        api.getLeads(),
        api.getCourses().catch(() => ({ success: false, data: [] })),
        api.getObjections().catch(() => ({ success: false, data: [] })),
        api.getLeadSources().catch(() => ({ success: false, data: [] })),
        isChairman ? api.getDashboard().catch(() => ({ success: false, data: null })) : Promise.resolve({ success: false, data: null }),
      ]);

      if (leadsRes.success) {
        let items: Lead[] = [];
        if (Array.isArray(leadsRes.data)) {
          items = leadsRes.data;
        } else if (leadsRes.data && Array.isArray((leadsRes.data as any).leads)) {
          items = (leadsRes.data as any).leads;
        }
        setLeads(items);
      } else {
        setErrorMsg(leadsRes.message || 'Failed to load leads.');
      }

      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data);
      }
      if (objRes.success && Array.isArray(objRes.data)) {
        setObjections(objRes.data);
      }
      if (sourcesRes.success && Array.isArray(sourcesRes.data)) {
        setLeadSources(
          sourcesRes.data.map((s: any) => (typeof s === 'string' ? s : s.source || s.name))
        );
      }

      if (dashboardRes.success && dashboardRes.data?.salespersonPerformance) {
        setSalespeople(
          dashboardRes.data.salespersonPerformance.map((sp: any) => ({
            userId: sp.salespersonId,
            name: sp.salespersonName,
          }))
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, []);

  // Filter and search logic
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (lead.name || '').toLowerCase().includes(q);
        const matchesPhone = (lead.phone || '').toLowerCase().includes(q);
        const matchesCourse = (lead.course || '').toLowerCase().includes(q);
        const matchesLocation = (lead.location || '').toLowerCase().includes(q);
        const matchesSalesperson = (lead.assignedSalespersonName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesCourse && !matchesLocation && !matchesSalesperson) {
          return false;
        }
      }

      // Course Filter
      if (filters.course && lead.course !== filters.course) {
        return false;
      }

      // Temperature Filter
      if (filters.temperature && (lead.temperature || '').toUpperCase() !== filters.temperature.toUpperCase()) {
        return false;
      }

      // Status Filter
      if (filters.status && lead.status !== filters.status) {
        return false;
      }

      // Priority Filter
      if (filters.priorityTier && !(lead.priorityTier || '').toUpperCase().includes(filters.priorityTier.toUpperCase())) {
        return false;
      }

      // Lead Source Filter
      if (filters.leadSource && lead.leadSource !== filters.leadSource) {
        return false;
      }

      // Salesperson Filter
      if (filters.salespersonId && lead.assignedSalespersonId !== filters.salespersonId) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, filters]);

  const existingPhoneNumbers = useMemo(() => {
    return leads.map((l) => (l.phone || '').replace(/[^0-9+]/g, ''));
  }, [leads]);

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0B3A66]" />
            <h1 className="text-lg font-bold text-slate-900">
              {isChairman ? 'All Academy Leads' : 'My Assigned Leads'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {filteredLeads.length} of {leads.length} leads matching criteria
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#0B3A66] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                viewMode === 'card'
                  ? 'bg-white text-[#0B3A66] shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchLeadsData(true)}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-[#E7D58A]" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="space-y-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by student name, phone, course, location..."
        />

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({})}
          courses={courses}
          leadSources={leadSources}
          salespeople={salespeople}
          showSalespersonFilter={isChairman}
        />
      </div>

      {/* Main Leads List / Table */}
      {loading ? (
        <LoadingState message="Fetching leads database..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => fetchLeadsData()} />
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description={
            leads.length === 0
              ? 'No leads yet in the CRM. Click below to add your first lead.'
              : 'No leads match the selected filter or search term.'
          }
          actionText={leads.length === 0 ? 'Create New Lead' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'table' ? (
        <div className="space-y-4">
          <LeadTable
            leads={filteredLeads}
            onCompleteFollowUp={(lead) => setActiveFollowUpLead(lead)}
            onRescheduleFollowUp={(lead) => setActiveRescheduleLead(lead)}
            onViewDetails={(lead) => setActiveDetailLead(lead)}
            onAssign={isChairman ? (lead) => setActiveAssignLead(lead) : undefined}
            isChairman={isChairman}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id || lead.leadId || lead.phone}
              lead={lead}
              onCompleteFollowUp={(l) => setActiveFollowUpLead(l)}
              onRescheduleFollowUp={(l) => setActiveRescheduleLead(l)}
              onViewDetails={(l) => setActiveDetailLead(l)}
              onAssign={isChairman ? (l) => setActiveAssignLead(l) : undefined}
              isChairman={isChairman}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Lead Modal */}
      <LeadModal
        isOpen={isCreateModalOpen || !!activeEditLead}
        lead={activeEditLead}
        courses={courses}
        objections={objections}
        leadSources={leadSources}
        existingPhoneNumbers={existingPhoneNumbers}
        onClose={() => {
          setIsCreateModalOpen(false);
          setActiveEditLead(null);
          onModalClosed?.();
        }}
        onSuccess={() => fetchLeadsData(true)}
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
        onTransferCourse={
          isChairman
            ? (lead) => {
                setActiveDetailLead(null);
                setActiveTransferLead(lead);
              }
            : undefined
        }
        isChairman={isChairman}
      />

      {/* Complete Follow-up Modal */}
      <FollowUpModal
        isOpen={!!activeFollowUpLead}
        lead={activeFollowUpLead}
        objections={objections}
        onClose={() => setActiveFollowUpLead(null)}
        onSuccess={() => fetchLeadsData(true)}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!activeRescheduleLead}
        lead={activeRescheduleLead}
        onClose={() => setActiveRescheduleLead(null)}
        onSuccess={() => fetchLeadsData(true)}
      />

      {/* Admission Modal */}
      <AdmissionModal
        isOpen={!!activeAdmissionLead}
        lead={activeAdmissionLead}
        courses={courses}
        onClose={() => setActiveAdmissionLead(null)}
        onSuccess={() => fetchLeadsData(true)}
      />

      {/* Course Transfer Modal (Chairman) */}
      <CourseTransferModal
        isOpen={!!activeTransferLead}
        lead={activeTransferLead}
        onClose={() => setActiveTransferLead(null)}
        onSuccess={() => fetchLeadsData(true)}
      />

      {/* Assign Lead Modal (Chairman) */}
      <AssignLeadModal
        isOpen={!!activeAssignLead}
        lead={activeAssignLead}
        salespeople={salespeople}
        onClose={() => setActiveAssignLead(null)}
        onSuccess={() => fetchLeadsData(true)}
      />
    </div>
  );
};
