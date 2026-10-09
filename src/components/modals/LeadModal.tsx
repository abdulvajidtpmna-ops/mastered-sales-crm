import React, { useState, useEffect } from 'react';
import type { Lead, Course, Objection } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, UserPlus, Save, Loader2 } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  lead?: Lead | null;
  courses?: Course[];
  objections?: Objection[];
  leadSources?: string[];
  existingPhoneNumbers?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  lead,
  courses = [],
  objections = [],
  leadSources = [],
  existingPhoneNumbers = [],
  onClose,
  onSuccess,
}) => {
  const isEditing = !!lead;
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [location, setLocation] = useState('');
  const [leadSource, setLeadSource] = useState('Meta Ads');
  const [course, setCourse] = useState('HRCA');
  const [temperature, setTemperature] = useState('WARM');
  const [status, setStatus] = useState('New');
  const [interestLevel, setInterestLevel] = useState('Interested');
  const [objection, setObjection] = useState('None');
  const [remark, setRemark] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (lead) {
      setName(String(lead.name || ''));
      setPhone(String(lead.phone || ''));
      setWhatsapp(String(lead.whatsapp || lead.phone || ''));
      setSameAsPhone(String(lead.whatsapp || '') === String(lead.phone || '') || !lead.whatsapp);
      setLocation(String(lead.location || ''));
      setLeadSource(String(lead.leadSource || 'Meta Ads'));
      setCourse(String(lead.course || 'HRCA'));
      setTemperature(lead.temperature || 'WARM');
      setStatus(String(lead.status || 'New'));
      setInterestLevel(String(lead.interestLevel || 'Interested'));
      setObjection(String(lead.objection || 'None'));
      setRemark(String(lead.remark || ''));
      setNextFollowUpAt(
        lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : ''
      );
    } else {
      // Default new lead
      setName('');
      setPhone('');
      setWhatsapp('');
      setSameAsPhone(true);
      setLocation('');
      setLeadSource('Meta Ads');
      setCourse(courses?.[0]?.code || 'HRCA');
      setTemperature('WARM');
      setStatus('New');
      setInterestLevel('Interested');
      setObjection('None');
      setRemark('');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setNextFollowUpAt(tomorrow.toISOString().slice(0, 16));
    }
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      error('Please provide a valid phone number (at least 8 digits).');
      return;
    }

    // Duplicate check for new leads
    if (!isEditing && existingPhoneNumbers.includes(cleanPhone)) {
      error('A lead with this phone number already exists in CRM.');
      return;
    }

    const cleanWhatsapp = sameAsPhone ? cleanPhone : whatsapp.trim().replace(/[^0-9+]/g, '');

    setLoading(true);
    try {
      if (isEditing && lead) {
        const leadId = lead.id || lead.leadId || '';
        const res = await api.updateLead(leadId, {
          name: name.trim(),
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          location: location.trim(),
          leadSource,
          course,
          temperature: temperature as any,
          status: status as any,
          interestLevel: interestLevel as any,
          objection: objection !== 'None' ? objection : '',
          remark: remark.trim(),
          nextFollowUpAt: nextFollowUpAt || undefined,
        });

        if (res.success) {
          success('Lead updated successfully.');
          onSuccess();
          onClose();
        } else {
          error(res.message || 'Failed to update lead.');
        }
      } else {
        const res = await api.createLead({
          name: name.trim(),
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          location: location.trim(),
          leadSource,
          course,
          temperature,
          status,
          interestLevel,
          objection: objection !== 'None' ? objection : '',
          remark: remark.trim(),
          nextFollowUpAt: nextFollowUpAt || undefined,
        });

        if (res.success) {
          success('New lead created successfully.');
          onSuccess();
          onClose();
        } else {
          error(res.message || 'Failed to create lead.');
        }
      }
    } catch (err: any) {
      error(err.message || 'Error processing lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="bg-[#0B3A66] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditing ? <Save className="w-4 h-4 text-[#E7D58A]" /> : <UserPlus className="w-4 h-4 text-[#E7D58A]" />}
            <h3 className="font-bold text-sm">{isEditing ? 'Edit Lead' : 'Create New Lead'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Student / Lead Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (sameAsPhone) setWhatsapp(e.target.value);
                }}
                placeholder="e.g. +91 9876543210"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">WhatsApp Number</label>
                <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => {
                      setSameAsPhone(e.target.checked);
                      if (e.target.checked) setWhatsapp(phone);
                    }}
                    className="rounded text-[#0B3A66]"
                  />
                  <span>Same as phone</span>
                </label>
              </div>
              <input
                type="tel"
                value={sameAsPhone ? phone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={sameAsPhone}
                placeholder="WhatsApp Number"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / City</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, Delhi, Online"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Lead Source */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                {leadSources.length > 0 ? (
                  leadSources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Organic">Organic</option>
                    <option value="Referral">Referral</option>
                    <option value="Direct Call">Direct Call</option>
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <option key={c.code || c.name} value={c.code || c.name}>
                      {c.code || c.name} {c.duration ? `(${c.duration})` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="HRCA">HRCA (6 Months Training & Internship)</option>
                    <option value="BHA">BHA (Hospital Admin + HR)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Temperature */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temperature</label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                <option value="HOT">Hot</option>
                <option value="WARM">Warm</option>
                <option value="COLD">Cold</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                <option value="New">New</option>
                <option value="In Follow-up">In Follow-up</option>
                <option value="Interested">Interested</option>
                <option value="Callback Requested">Callback Requested</option>
                <option value="Admission In Progress">Admission In Progress</option>
                <option value="Admitted">Admitted</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            {/* Interest */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interest</label>
              <select
                value={interestLevel}
                onChange={(e) => setInterestLevel(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                <option value="Highly Interested">Highly Interested</option>
                <option value="Interested">Interested</option>
                <option value="Moderately Interested">Moderately Interested</option>
                <option value="Less Interested">Less Interested</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Objection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Objection / Constraint</label>
              <select
                value={objection}
                onChange={(e) => setObjection(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                <option value="None">None</option>
                {objections.length > 0 ? (
                  objections.map((obj) => (
                    <option key={obj.name || obj.id} value={obj.name}>
                      {obj.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Price is High">Price is High</option>
                    <option value="Financial Issue">Financial Issue</option>
                    <option value="Waiting for Salary">Waiting for Salary</option>
                    <option value="Need Installment">Need Installment</option>
                    <option value="Need to Think">Need to Think</option>
                    <option value="Need to Discuss with Family">Need to Discuss with Family</option>
                    <option value="Will Join Later">Will Join Later</option>
                    <option value="Next Month">Next Month</option>
                    <option value="Need More Course Details">Need More Course Details</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Next Follow-up Date & Time</label>
              <input
                type="datetime-local"
                value={nextFollowUpAt}
                onChange={(e) => setNextFollowUpAt(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              />
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remark / Initial Notes</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Background notes, previous education, specific query..."
              rows={2}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0B3A66] hover:bg-[#072A4A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
