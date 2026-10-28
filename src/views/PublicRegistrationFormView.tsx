import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { HighestEducation } from '../types';
import {
  CheckCircle2,
  Clock,
  Phone,
  User,
  MapPin,
  Send,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface PublicRegistrationFormViewProps {
  slug: string;
}

export const PublicRegistrationFormView: React.FC<PublicRegistrationFormViewProps> = ({ slug }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [education, setEducation] = useState<HighestEducation>('Plus Two / Higher Secondary');
  const [course, setCourse] = useState('HRCA');
  const [location, setLocation] = useState('');
  const [preferredTime, setPreferredTime] = useState('Anytime');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Campaign Attribution
  const [utmParams, setUtmParams] = useState({
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: '',
  });

  useEffect(() => {
    // 1. Extract UTM parameters from URL (search query or hash query)
    try {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const hashQuery = hash.includes('?') ? hash.substring(hash.indexOf('?')) : '';
      const combinedParams = new URLSearchParams(search || hashQuery);

      setUtmParams({
        utmSource: combinedParams.get('utm_source') || 'Direct Web',
        utmMedium: combinedParams.get('utm_medium') || '',
        utmCampaign: combinedParams.get('utm_campaign') || '',
        utmContent: combinedParams.get('utm_content') || '',
        utmTerm: combinedParams.get('utm_term') || '',
      });
    } catch (e) {
      console.warn('Could not parse query params', e);
    }

    // 2. Fetch Form Configuration from Backend
    const fetchForm = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await api.getPublicForm(slug);
        if (res.success && res.data) {
          setFormConfig(res.data);
          if (res.data.defaultCourse) {
            setCourse(res.data.defaultCourse);
          }
        } else {
          // If no custom form found on backend, fallback to standard academy registration form
          setFormConfig({
            title: 'Mastered Skill Academy — Course Registration',
            description:
              'Official admissions registration for Healthcare Administration & Human Resources diploma courses with assured training & placement support.',
            defaultCourse: 'HRCA',
            confirmationMessage:
              'Thank you! Your registration has been received. Our academic counsellor will WhatsApp you admission details and syllabus shortly.',
            privacyNotice:
              'Your details are used strictly by Mastered Skill Academy for course counselling. We respect your privacy.',
          });
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading registration form.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      alert('Please enter a valid phone number (at least 8-10 digits).');
      return;
    }

    const fullPhone = `${countryCode.replace('+', '')}${cleanPhone}`;

    setSubmitting(true);
    try {
      // Submission token for idempotency
      const submissionToken = `TOKEN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const res = await api.publicSubmitForm({
        slug,
        formId: formConfig?.formId,
        name: name.trim(),
        phone: fullPhone,
        education,
        course,
        location: location.trim(),
        preferredTime,
        additionalNotes: additionalNotes.trim(),
        ...utmParams,
        submissionToken,
      });

      if (res.success) {
        setIsSuccess(true);
        setConfirmationMsg(
          res.data?.message ||
            formConfig?.confirmationMessage ||
            'Registration successful! Our academic counsellor will contact you shortly.'
        );
      } else {
        alert(res.message || 'Registration could not be completed. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error submitting form. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0B3A66] animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading Mastered Skill Academy Form...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Registration Form Unavailable</h2>
          <p className="text-xs text-slate-600">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A227]">
              Mastered Skill Academy
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Application Received!</h2>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {confirmationMsg}
          </p>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
            Candidate: <strong className="text-slate-800">{name}</strong> • Course:{' '}
            <strong className="text-[#0B3A66]">{course}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC] py-8 px-4 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#072A4A] px-6 py-6 text-white text-center border-b border-[#0B3A66]">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-md">
              <img src="/logo.png" alt="Mastered Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-[#E7D58A] uppercase tracking-wider">
                Mastered Skill Academy
              </div>
              <div className="text-lg font-black text-white leading-tight">Admissions Portal</div>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-3">
            {formConfig?.title || 'Student Course Registration'}
          </h1>
          {formConfig?.description && (
            <p className="text-xs text-blue-100/90 mt-2 max-w-md mx-auto leading-relaxed">
              {formConfig.description}
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your student / applicant name"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] text-xs"
              />
            </div>
          </div>

          {/* WhatsApp / Phone Number */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              WhatsApp / Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66]"
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+968">🇴🇲 +968</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] text-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Course syllabus & admission details will be shared on WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Highest Education */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Highest Qualification <span className="text-rose-500">*</span>
              </label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value as HighestEducation)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] text-xs"
              >
                <option value="Plus Two / Higher Secondary">Plus Two / Higher Secondary (12th)</option>
                <option value="SSLC / 10th">SSLC / 10th</option>
                <option value="Diploma">Diploma / Polytechnic</option>
                <option value="Undergraduate degree">Bachelor's Degree (Any Stream)</option>
                <option value="Postgraduate degree">Master's / PG Degree</option>
                <option value="ITI">ITI / Vocational</option>
                <option value="Professional qualification">Professional Qualification</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Course Interested In */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Course Interested In <span className="text-rose-500">*</span>
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] text-xs"
              >
                <option value="HRCA">HRCA (6 Months Hospital Admin + HR with Internship)</option>
                <option value="BHA">BHA (Bachelor of Hospital Administration)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* City / Location */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">Location / City</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kochi, Calicut, Trivandrum"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] text-xs"
                />
              </div>
            </div>

            {/* Preferred Contact Time */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">Preferred Contact Time</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] text-xs"
                >
                  <option value="Anytime">Anytime during day</option>
                  <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                  <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Query / Note */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Specific Query or Notes (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Asking about hostel availability, installment fees, next batch starting date..."
              rows={2}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] text-xs"
            />
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#0B3A66] shrink-0 mt-0.5" />
            <span>
              {formConfig?.privacyNotice ||
                'Your information is strictly protected and used only to communicate course admissions details.'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#0B3A66] hover:bg-[#072A4A] text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#E7D58A]" />
                <span>Submitting Registration...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-[#E7D58A]" />
                <span>Submit Course Registration</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
          © {new Date().getFullYear()} Mastered Skill Academy. All rights reserved.
        </div>
      </div>
    </div>
  );
};
