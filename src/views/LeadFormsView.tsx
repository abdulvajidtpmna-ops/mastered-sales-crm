import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { LeadForm } from '../types';
import { useToast } from '../context/ToastContext';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates';
import {
  Globe,
  Plus,
  Copy,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Share2,
  X,
  Save,
} from 'lucide-react';

export const LeadFormsView: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forms, setForms] = useState<LeadForm[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<LeadForm | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [defaultCourse, setDefaultCourse] = useState('HRCA');
  const [campaignName, setCampaignName] = useState('Meta Ads Campaign');
  const [leadSource, setLeadSource] = useState('Meta Ads');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [privacyNotice, setPrivacyNotice] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchForms = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.getLeadForms();
      if (res.success && res.data?.forms) {
        setForms(res.data.forms);
      } else {
        // Provide standard active default form if none created yet
        setForms([
          {
            formId: 'FORM-HRCA-DEFAULT',
            slug: 'hrca-admissions',
            title: 'HRCA Professional Course Registration',
            description:
              'Enroll in Kerala\'s Premier Hospital Administration & HR Certification Program with Guaranteed Internship.',
            defaultCourse: 'HRCA',
            campaignName: 'Academy Admissions 2026',
            leadSource: 'Meta Ads',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            submissionCount: 12,
            confirmationMessage: 'Thank you! Our academic counsellor will WhatsApp you course fees and syllabus shortly.',
          },
          {
            formId: 'FORM-BHA-DEFAULT',
            slug: 'bha-admissions',
            title: 'BHA Hospital Administration Degree Registration',
            description: 'Bachelor of Hospital Administration with practical hospital clinical training.',
            defaultCourse: 'BHA',
            campaignName: 'Healthcare Careers 2026',
            leadSource: 'Google Ads',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            submissionCount: 8,
            confirmationMessage: 'Thank you! Our admissions coordinator will contact you shortly.',
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading lead forms.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleOpenCreateModal = (formToEdit?: LeadForm) => {
    if (formToEdit) {
      setEditingForm(formToEdit);
      setTitle(formToEdit.title);
      setSlug(formToEdit.slug);
      setDescription(formToEdit.description || '');
      setDefaultCourse(formToEdit.defaultCourse || 'HRCA');
      setCampaignName(formToEdit.campaignName || 'Meta Ads');
      setLeadSource(formToEdit.leadSource || 'Meta Ads');
      setConfirmationMessage(formToEdit.confirmationMessage || '');
      setPrivacyNotice(formToEdit.privacyNotice || '');
      setExpiresAt(formToEdit.expiresAt ? formToEdit.expiresAt.slice(0, 10) : '');
    } else {
      setEditingForm(null);
      setTitle('');
      setSlug('');
      setDescription('');
      setDefaultCourse('HRCA');
      setCampaignName('Meta Ads Q4');
      setLeadSource('Meta Ads');
      setConfirmationMessage('Thank you! Our counsellor will WhatsApp you syllabus & fee details shortly.');
      setPrivacyNotice('Your contact details are protected and used strictly for academic guidance.');
      setExpiresAt('');
    }
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Please enter a form title.');
      return;
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    try {
      const payload = {
        formId: editingForm?.formId,
        title: title.trim(),
        slug: cleanSlug,
        description: description.trim(),
        defaultCourse,
        campaignName: campaignName.trim(),
        leadSource,
        confirmationMessage: confirmationMessage.trim(),
        privacyNotice: privacyNotice.trim(),
        expiresAt: expiresAt || undefined,
        status: editingForm ? editingForm.status : 'ACTIVE',
      };

      const res = await api.saveLeadForm(payload);
      if (res.success) {
        success('Registration form saved successfully.');
        setIsModalOpen(false);
        fetchForms(true);
      } else {
        error(res.message || 'Failed to save form.');
      }
    } catch (err: any) {
      error(err.message || 'Error processing form.');
    }
  };

  const handleToggleStatus = async (form: LeadForm) => {
    const nextStatus = form.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await api.saveLeadForm({
        ...form,
        status: nextStatus,
      });
      if (res.success) {
        success(`Form ${nextStatus === 'ACTIVE' ? 'activated' : 'paused'}.`);
        fetchForms(true);
      } else {
        error(res.message || 'Failed to update status.');
      }
    } catch (err: any) {
      error(err.message || 'Error updating status.');
    }
  };

  const copyPublicLink = (slug: string) => {
    const origin = window.location.origin;
    const url = `${origin}/#/forms/${slug}`;
    navigator.clipboard.writeText(url);
    success('Public link copied to clipboard!');
  };

  const copyCampaignLink = (form: LeadForm) => {
    const origin = window.location.origin;
    const sourceParam = encodeURIComponent(form.leadSource?.toLowerCase().replace(/\s+/g, '_') || 'meta_ads');
    const campaignParam = encodeURIComponent(form.campaignName?.toLowerCase().replace(/\s+/g, '-') || 'course-campaign');
    const url = `${origin}/#/forms/${form.slug}?utm_source=${sourceParam}&utm_medium=paid_social&utm_campaign=${campaignParam}`;
    navigator.clipboard.writeText(url);
    success('Pre-tagged Campaign URL copied (Ready for Meta Ads / Google Ads)!');
  };

  const openFormPreview = (slug: string) => {
    const origin = window.location.origin;
    window.open(`${origin}/#/forms/${slug}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <LoadingState message="Loading registration forms & campaigns..." />;
  }

  if (errorMsg) {
    return <ErrorState message={errorMsg} onRetry={() => fetchForms()} />;
  }

  return (
    <div className="space-y-4 pb-16 md:pb-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0B3A66]" />
            <h1 className="text-lg font-bold text-slate-900">Lead Forms & Ad Campaigns</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create public registration landing pages, copy Meta Ads tracking links, and auto-distribute applicants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E7D58A]" />
            <span>Create Public Form</span>
          </button>

          <button
            type="button"
            onClick={() => fetchForms(true)}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Forms"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0B3A66]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <EmptyState
          title="No Registration Forms Yet"
          description="Create your first public registration page to start capturing leads automatically from social media and advertising."
          actionText="Create Form"
          onAction={() => handleOpenCreateModal()}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {forms.map((form) => {
            const isActive = form.status === 'ACTIVE';

            return (
              <div
                key={form.formId}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{form.title}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {form.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1">/forms/{form.slug}</p>
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-[#0B3A66] font-bold text-xs border border-blue-100">
                    {form.defaultCourse || 'All Courses'}
                  </span>
                </div>

                {form.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    {form.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Campaign:</span>
                    <strong className="text-slate-700 truncate block">{form.campaignName || 'General'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Source Tag:</span>
                    <strong className="text-slate-700 truncate block">{form.leadSource || 'Meta Ads'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Submissions:</span>
                    <strong className="text-emerald-700 font-bold block">{form.submissionCount || 0} leads</strong>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyPublicLink(form.slug)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                      title="Copy standard link"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyCampaignLink(form)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0B3A66]/10 hover:bg-[#0B3A66]/20 text-[#0B3A66] font-semibold text-xs transition-colors cursor-pointer"
                      title="Copy pre-tagged link with UTM parameters"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy Ad Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openFormPreview(form.slug)}
                      className="p-1.5 text-slate-500 hover:text-[#0B3A66] rounded-md hover:bg-slate-100 cursor-pointer"
                      title="Open form preview in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(form)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                        isActive
                          ? 'text-amber-700 hover:bg-amber-50'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(form)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-[#0B3A66] px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#E7D58A]" />
                <h3 className="font-bold text-sm">
                  {editingForm ? 'Edit Registration Form' : 'Create Public Registration Form'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Form Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingForm) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }
                  }}
                  placeholder="e.g. HRCA Hospital Administration Batch 2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Public Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-[#0B3A66] focus-within:bg-white">
                  <span className="text-slate-400 font-mono text-[11px] select-none">/forms/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    placeholder="hrca-admissions"
                    className="w-full bg-transparent border-none text-slate-900 font-mono text-[11px] focus:outline-none ml-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Course</label>
                  <select
                    value={defaultCourse}
                    onChange={(e) => setDefaultCourse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                  >
                    <option value="HRCA">HRCA (6 Months)</option>
                    <option value="BHA">BHA (Degree)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-2.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                  >
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Organic">Organic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Tag Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Kerala Meta Ads Admissions"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description / Subtitle</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Appears directly under the form title for prospective students..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirmation Message</label>
                <textarea
                  value={confirmationMessage}
                  onChange={(e) => setConfirmationMessage(e.target.value)}
                  rows={2}
                  placeholder="Message displayed immediately after submission..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-md font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B3A66] hover:bg-[#072A4A] text-white font-bold rounded-md shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#E7D58A]" />
                  <span>{editingForm ? 'Update Form' : 'Save & Publish Form'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
