/**
 * =========================================================
 * MASTERED SKILL ACADEMY CRM — ENTERPRISE ENHANCEMENT ENGINE
 * Lead Distribution | Concurrency-Safe Allocation |
 * Public Registration Forms | Call Outcome Tracking |
 * Permanent Assignment History | Customer Re-Enquiries
 * =========================================================
 */

/**
 * 1. DATABASE SCHEMA EXTENSION & MIGRATION HELPER
 * Safe, idempotent setup function. Run this once from the Apps Script editor.
 * Does NOT delete or alter existing LEADS, USERS, or FOLLOWUPS data.
 */
function setupCRMDatabaseExtensions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const tables = [
    {
      name: 'CUSTOMERS',
      headers: [
        'CustomerID',
        'NormalizedPhone',
        'Name',
        'WhatsApp',
        'Location',
        'CreatedAt',
        'UpdatedAt',
        'TotalEnquiries',
        'Status'
      ]
    },
    {
      name: 'ENQUIRIES',
      headers: [
        'EnquiryID',
        'CustomerID',
        'Course',
        'Status',
        'InterestLevel',
        'Temperature',
        'PriorityScore',
        'PriorityTier',
        'AssignedSalespersonId',
        'AssignedSalespersonName',
        'LeadSource',
        'CampaignName',
        'CreatedAt',
        'UpdatedAt',
        'NextFollowUpAt',
        'FollowUpStatus',
        'LastContactAt',
        'Objection',
        'Remark'
      ]
    },
    {
      name: 'ASSIGNMENT_HISTORY',
      headers: [
        'AssignmentID',
        'EnquiryID',
        'CustomerID',
        'PreviousSalespersonID',
        'NewSalespersonID',
        'AssignmentType',
        'AssignmentReason',
        'AllocationRuleVersion',
        'TriggerEventID',
        'AssignedAt',
        'AssignedBy',
        'OverrideFlag',
        'OverrideReason',
        'Status'
      ]
    },
    {
      name: 'LEAD_FORMS',
      headers: [
        'FormID',
        'Slug',
        'FormTitle',
        'Description',
        'DefaultCourse',
        'CampaignName',
        'LeadSource',
        'Status',
        'CreatedBy',
        'CreatedAt',
        'ExpiresAt',
        'ConfirmationMessage',
        'PrivacyNotice',
        'FormConfigVersion'
      ]
    },
    {
      name: 'FORM_SUBMISSIONS',
      headers: [
        'SubmissionID',
        'FormID',
        'CustomerID',
        'EnquiryID',
        'SubmittedAt',
        'NormalizedPhone',
        'SubmissionStatus',
        'DuplicateOfSubmissionID',
        'CampaignName',
        'UTMSource',
        'UTMMedium',
        'UTMCampaign',
        'UTMContent',
        'UTMTerm',
        'HighestEducation',
        'PreferredTime',
        'AdditionalNotes',
        'ProcessingErrorCode'
      ]
    },
    {
      name: 'SALESPERSON_SETTINGS',
      headers: [
        'SalespersonID',
        'Name',
        'Email',
        'Status',
        'DailyLeadCap',
        'MaxOpenEnquiries',
        'LifetimeCap',
        'LifetimeCapEnabled',
        'AllocationWeight',
        'LeaveStartDate',
        'LeaveEndDate',
        'LeaveReason',
        'PausedAt',
        'CreatedAt',
        'UpdatedAt'
      ]
    },
    {
      name: 'CALL_LOGS',
      headers: [
        'CallLogID',
        'LeadID',
        'CustomerID',
        'SalespersonID',
        'Phone',
        'EventType',
        'CallResult',
        'Remark',
        'NextFollowUpAt',
        'Timestamp'
      ]
    }
  ];

  tables.forEach(table => {
    let sheet = ss.getSheetByName(table.name);
    if (!sheet) {
      sheet = ss.insertSheet(table.name);
      sheet.appendRow(table.headers);
      sheet.getRange(1, 1, 1, table.headers.length)
        .setBackground('#072A4A')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
      Logger.log('Created sheet: ' + table.name);
    }
  });

  // Seed default public form if none exists
  seedDefaultLeadForm_();

  // Seed salesperson settings for existing active USERS
  syncSalespersonSettings_();

  Logger.log('CRM Database Extensions successfully configured.');
}

/**
 * Normalizes phone numbers consistently with +91 handling.
 */
function normalizePhone_(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Formats phone for human readability (+91 98765 43210)
 */
function formatDisplayPhone_(normPhone) {
  if (!normPhone) return '';
  if (normPhone.startsWith('91') && normPhone.length === 12) {
    return '+91 ' + normPhone.substring(2, 7) + ' ' + normPhone.substring(7);
  }
  return '+' + normPhone;
}

/**
 * Concurrency-Safe Lead Allocation Engine
 * Assigns an enquiry according to salesperson eligibility, capacity, and previous-owner exclusion.
 */
function allocateLead_(enquiryData, options) {
  options = options || {};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(12000)) {
    throw new Error('Allocation server busy. Please try again.');
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('SALESPERSON_SETTINGS');
    if (!settingsSheet) {
      syncSalespersonSettings_();
    }

    const allSettings = getSheetData_('SALESPERSON_SETTINGS');
    const allEnquiries = getSheetData_('ENQUIRIES');
    const allAssignments = getSheetData_('ASSIGNMENT_HISTORY');
    const todayStr = new Date().toISOString().slice(0, 10);

    const previousOwnerId = options.previousOwnerId || null;
    const forceOverride = options.forceOverride || false;
    const assignedBy = options.assignedBy || 'ALLOCATION_ENGINE';

    // 1. Filter eligible candidates
    const eligibleSalespeople = allSettings.filter(sp => {
      // Must be ACTIVE
      const status = (sp.Status || 'ACTIVE').toUpperCase();
      if (status !== 'ACTIVE') return false;

      // Check Leave Dates
      if (sp.LeaveStartDate && sp.LeaveEndDate) {
        const start = String(sp.LeaveStartDate).slice(0, 10);
        const end = String(sp.LeaveEndDate).slice(0, 10);
        if (todayStr >= start && todayStr <= end) {
          return false;
        }
      }

      // Check Allocation Weight
      const weight = Number(sp.AllocationWeight ?? 1);
      if (weight <= 0) return false;

      // Check Previous Owner Exclusion (Scenario C: Returning Customer Re-enquiry)
      if (!forceOverride && previousOwnerId && String(sp.SalespersonID) === String(previousOwnerId)) {
        return false;
      }

      // Check Daily Lead Cap
      const dailyCap = Number(sp.DailyLeadCap || 25);
      const todayCount = allAssignments.filter(a =>
        String(a.NewSalespersonID) === String(sp.SalespersonID) &&
        String(a.AssignedAt).slice(0, 10) === todayStr &&
        a.AssignmentType !== 'CANCELLED'
      ).length;
      if (todayCount >= dailyCap) return false;

      // Check Max Open Enquiries Cap
      const openCap = Number(sp.MaxOpenEnquiries || 60);
      const currentOpen = allEnquiries.filter(e =>
        String(e.AssignedSalespersonId) === String(sp.SalespersonID) &&
        !['Admitted', 'ADMITTED', 'Not Interested', 'NOT_INTERESTED', 'Invalid', 'INVALID'].includes(e.Status)
      ).length;
      if (currentOpen >= openCap) return false;

      // Check Optional Lifetime Cap
      const lifetimeCapEnabled = String(sp.LifetimeCapEnabled).toLowerCase() === 'true';
      if (lifetimeCapEnabled) {
        const lifetimeCap = Number(sp.LifetimeCap || 500);
        const lifetimeCount = allAssignments.filter(a =>
          String(a.NewSalespersonID) === String(sp.SalespersonID)
        ).length;
        if (lifetimeCount >= lifetimeCap) return false;
      }

      return true;
    });

    // 2. If no eligible salesperson available: return UNASSIGNED
    if (eligibleSalespeople.length === 0) {
      logAudit_(
        'UNASSIGNED_ENQUIRY',
        'No eligible salesperson available for enquiry ' + enquiryData.enquiryId,
        assignedBy
      );
      return {
        assigned: false,
        salespersonId: 'UNASSIGNED',
        salespersonName: 'Unassigned Queue',
        reason: previousOwnerId ? 'Previous salesperson excluded and all peers at capacity' : 'All salespeople at capacity or on leave'
      };
    }

    // 3. Deterministic Ranking & Fair Rotation
    // Score based on (Today Assignments / Weight) then Least-Recently-Assigned
    eligibleSalespeople.sort((a, b) => {
      const weightA = Number(a.AllocationWeight || 1);
      const weightB = Number(b.AllocationWeight || 1);

      const countA = allAssignments.filter(item =>
        String(item.NewSalespersonID) === String(a.SalespersonID) &&
        String(item.AssignedAt).slice(0, 10) === todayStr
      ).length / weightA;

      const countB = allAssignments.filter(item =>
        String(item.NewSalespersonID) === String(b.SalespersonID) &&
        String(item.AssignedAt).slice(0, 10) === todayStr
      ).length / weightB;

      if (countA !== countB) return countA - countB;

      // Tie-breaker: find latest assigned timestamp
      const lastAssignedA = allAssignments
        .filter(item => String(item.NewSalespersonID) === String(a.SalespersonID))
        .map(item => new Date(item.AssignedAt).getTime())
        .sort((x, y) => y - x)[0] || 0;

      const lastAssignedB = allAssignments
        .filter(item => String(item.NewSalespersonID) === String(b.SalespersonID))
        .map(item => new Date(item.AssignedAt).getTime())
        .sort((x, y) => y - x)[0] || 0;

      return lastAssignedA - lastAssignedB;
    });

    const chosen = eligibleSalespeople[0];
    const assignmentId = 'ASG-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const assignmentRecord = {
      AssignmentID: assignmentId,
      EnquiryID: enquiryData.enquiryId,
      CustomerID: enquiryData.customerId,
      PreviousSalespersonID: previousOwnerId || '',
      NewSalespersonID: chosen.SalespersonID,
      AssignmentType: previousOwnerId ? 'NEW_ENQUIRY_REASSIGNMENT' : 'INITIAL_ASSIGNMENT',
      AssignmentReason: previousOwnerId
        ? 'Customer re-enquiry for course ' + (enquiryData.course || 'New') + ' (previous owner excluded)'
        : 'Automated capacity distribution',
      AllocationRuleVersion: '2.0-CONCURRENCY-SAFE',
      TriggerEventID: options.triggerEventId || '',
      AssignedAt: new Date().toISOString(),
      AssignedBy: assignedBy,
      OverrideFlag: forceOverride ? 'TRUE' : 'FALSE',
      OverrideReason: options.overrideReason || '',
      Status: 'ACTIVE'
    };

    appendRow_('ASSIGNMENT_HISTORY', assignmentRecord);

    return {
      assigned: true,
      salespersonId: chosen.SalespersonID,
      salespersonName: chosen.Name,
      assignmentId: assignmentId,
      reason: assignmentRecord.AssignmentReason
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Public Registration Form Retrieval (UNAUTHENTICATED SAFE ENDPOINT)
 */
function getPublicForm_(payload) {
  try {
    const slug = String(payload.slug || '').trim().toLowerCase();
    if (!slug) {
      return errorResponse_('Form identifier is required.');
    }

    const forms = getSheetData_('LEAD_FORMS');
    const form = forms.find(f => String(f.Slug || '').toLowerCase() === slug);

    if (!form) {
      return errorResponse_('Registration form not found.');
    }

    if (String(form.Status || '').toUpperCase() !== 'ACTIVE') {
      return errorResponse_('This registration form is currently paused or inactive.');
    }

    if (form.ExpiresAt) {
      const expiry = new Date(form.ExpiresAt);
      if (!isNaN(expiry.getTime()) && expiry < new Date()) {
        return errorResponse_('This registration form has expired.');
      }
    }

    // Public sanitized response — zero credentials, tokens, or internal metrics exposed
    return successResponse_({
      formId: form.FormID,
      slug: form.Slug,
      title: form.FormTitle,
      description: form.Description || '',
      defaultCourse: form.DefaultCourse || '',
      campaignName: form.CampaignName || '',
      confirmationMessage: form.ConfirmationMessage || 'Thank you! Your registration has been received. Our academic counsellor will connect with you shortly on WhatsApp.',
      privacyNotice: form.PrivacyNotice || 'Mastered Skill Academy uses your contact information solely to communicate course admission details, batch timings, and fee structures. We respect your privacy.'
    });

  } catch (error) {
    return errorResponse_(error.message);
  }
}

/**
 * Public Form Submission & Automatic Distribution (UNAUTHENTICATED SAFE ENDPOINT)
 */
function publicSubmitForm_(payload) {
  try {
    const formId = String(payload.formId || '').trim();
    const slug = String(payload.slug || '').trim().toLowerCase();

    // Verify form status
    const forms = getSheetData_('LEAD_FORMS');
    const form = forms.find(f =>
      (formId && String(f.FormID) === formId) ||
      (slug && String(f.Slug).toLowerCase() === slug)
    );

    if (!form || String(form.Status || '').toUpperCase() !== 'ACTIVE') {
      return errorResponse_('This form is not accepting registrations at this time.');
    }

    // Server-side validation of untrusted public input
    const rawName = String(payload.name || '').trim();
    if (!rawName || rawName.length < 2) {
      return errorResponse_('Please enter your full name.');
    }

    const rawPhone = String(payload.phone || '').trim();
    const normalizedPhone = normalizePhone_(rawPhone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return errorResponse_('Please provide a valid 10-digit mobile / WhatsApp number.');
    }

    const education = String(payload.education || 'Plus Two / Higher Secondary').trim();
    const course = String(payload.course || form.DefaultCourse || 'HRCA').trim();
    const location = String(payload.location || '').trim();
    const preferredTime = String(payload.preferredTime || '').trim();
    const additionalNotes = String(payload.additionalNotes || '').trim();

    // Anti-Spam / Idempotency check: block duplicate submission within 45 seconds
    const submissionToken = String(payload.submissionToken || '').trim();
    const submissions = getSheetData_('FORM_SUBMISSIONS');
    const cutoffTime = new Date(Date.now() - 45000).toISOString();

    const isDuplicate = submissions.some(s =>
      s.NormalizedPhone === normalizedPhone &&
      s.FormID === form.FormID &&
      s.SubmittedAt >= cutoffTime
    );

    if (isDuplicate) {
      return successResponse_({
        duplicate: true,
        message: 'Your registration was already received. An counsellor is already reviewing your details.'
      });
    }

    // 1. Customer Resolution
    const customers = getSheetData_('CUSTOMERS');
    let customer = customers.find(c => c.NormalizedPhone === normalizedPhone);
    let customerId = '';
    let isNewCustomer = false;

    if (!customer) {
      isNewCustomer = true;
      customerId = 'CUST-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      customer = {
        CustomerID: customerId,
        NormalizedPhone: normalizedPhone,
        Name: rawName,
        WhatsApp: normalizedPhone,
        Location: location,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        TotalEnquiries: 1,
        Status: 'ACTIVE'
      };
      appendRow_('CUSTOMERS', customer);
    } else {
      customerId = customer.CustomerID;
      updateRowByValue_('CUSTOMERS', 'CustomerID', customerId, {
        UpdatedAt: new Date().toISOString(),
        TotalEnquiries: Number(customer.TotalEnquiries || 1) + 1
      });
    }

    // 2. Enquiry Classification & Previous Owner Check
    const enquiries = getSheetData_('ENQUIRIES');
    const existingEnquiriesForCust = enquiries.filter(e => e.CustomerID === customerId);

    let previousOwnerId = null;
    let isReturningCourseEnquiry = false;

    if (existingEnquiriesForCust.length > 0) {
      const lastEnquiry = existingEnquiriesForCust[existingEnquiriesForCust.length - 1];
      previousOwnerId = lastEnquiry.AssignedSalespersonId;

      // Scenario C: Customer returning for another course
      if (lastEnquiry.Course !== course) {
        isReturningCourseEnquiry = true;
      }
    }

    const enquiryId = 'ENQ-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const leadId = 'LEAD-' + Utilities.getUuid().slice(0, 8).toUpperCase();

    // 3. Run Allocation Engine
    const allocationResult = allocateLead_({
      enquiryId: enquiryId,
      customerId: customerId,
      course: course
    }, {
      previousOwnerId: isReturningCourseEnquiry ? previousOwnerId : null,
      triggerEventID: form.FormID
    });

    const assignedSalespersonId = allocationResult.salespersonId;
    const assignedSalespersonName = allocationResult.salespersonName;

    // 4. Save Enquiry
    const nowIso = new Date().toISOString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const enquiryRecord = {
      EnquiryID: enquiryId,
      CustomerID: customerId,
      Course: course,
      Status: 'New',
      InterestLevel: 'Interested',
      Temperature: 'WARM',
      PriorityScore: 75,
      PriorityTier: 'P2 High',
      AssignedSalespersonId: assignedSalespersonId,
      AssignedSalespersonName: assignedSalespersonName,
      LeadSource: form.LeadSource || 'Website Registration',
      CampaignName: form.CampaignName || payload.utmSource || '',
      CreatedAt: nowIso,
      UpdatedAt: nowIso,
      NextFollowUpAt: tomorrow.toISOString(),
      FollowUpStatus: 'PENDING',
      LastContactAt: '',
      Objection: 'None',
      Remark: 'Web Form [' + form.FormTitle + '] Education: ' + education + (preferredTime ? ' | Pref Time: ' + preferredTime : '') + (additionalNotes ? ' | Note: ' + additionalNotes : '')
    };
    appendRow_('ENQUIRIES', enquiryRecord);

    // 5. Sync with primary LEADS table for full backwards compatibility
    const leadRecord = {
      LeadID: leadId,
      CreatedAt: nowIso,
      UpdatedAt: nowIso,
      Name: rawName,
      Phone: formatDisplayPhone_(normalizedPhone),
      WhatsApp: normalizedPhone,
      Location: location,
      LeadSource: form.LeadSource || 'Website Registration',
      Course: course,
      Temperature: 'WARM',
      Status: 'New',
      InterestLevel: 'Interested',
      PriorityScore: 75,
      PriorityTier: 'P2 High',
      Objection: 'None',
      Remark: enquiryRecord.Remark,
      NextFollowUpAt: tomorrow.toISOString(),
      FollowUpStatus: 'PENDING',
      AssignedSalespersonId: assignedSalespersonId,
      AssignedSalespersonName: assignedSalespersonName,
      LastContactAt: ''
    };
    appendRow_('LEADS', leadRecord);

    // 6. Save Form Submission Record with Campaign Attribution
    const submissionId = 'SUB-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const submissionRecord = {
      SubmissionID: submissionId,
      FormID: form.FormID,
      CustomerID: customerId,
      EnquiryID: enquiryId,
      SubmittedAt: nowIso,
      NormalizedPhone: normalizedPhone,
      SubmissionStatus: 'PROCESSED',
      DuplicateOfSubmissionID: '',
      CampaignName: form.CampaignName || payload.utmCampaign || '',
      UTMSource: payload.utmSource || '',
      UTMMedium: payload.utmMedium || '',
      UTMCampaign: payload.utmCampaign || '',
      UTMContent: payload.utmContent || '',
      UTMTerm: payload.utmTerm || '',
      HighestEducation: education,
      PreferredTime: preferredTime,
      AdditionalNotes: additionalNotes,
      ProcessingErrorCode: ''
    };
    appendRow_('FORM_SUBMISSIONS', submissionRecord);

    return successResponse_({
      submissionId: submissionId,
      message: form.ConfirmationMessage || 'Thank you! Your registration has been received successfully.'
    });

  } catch (error) {
    return errorResponse_('Submission error: ' + error.message);
  }
}

/**
 * Call Outcome Tracking Endpoint
 */
function logCall_(payload) {
  try {
    const leadId = String(payload.leadId || '').trim();
    const phone = String(payload.phone || '').trim();
    const eventType = String(payload.eventType || 'CALL_ATTEMPT_RECORDED').trim();
    const callResult = String(payload.callResult || 'CALL_ANSWERED').trim();
    const remark = String(payload.remark || '').trim();
    const nextFollowUpAt = String(payload.nextFollowUpAt || '').trim();

    const callLogId = 'CALL-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const nowIso = new Date().toISOString();

    const callRecord = {
      CallLogID: callLogId,
      LeadID: leadId,
      CustomerID: '',
      SalespersonID: payload.userId || '',
      Phone: phone,
      EventType: eventType,
      CallResult: callResult,
      Remark: remark,
      NextFollowUpAt: nextFollowUpAt,
      Timestamp: nowIso
    };
    appendRow_('CALL_LOGS', callRecord);

    // Also update LEADS table last contact
    if (leadId) {
      updateRowByValue_('LEADS', 'LeadID', leadId, {
        LastContactAt: nowIso,
        UpdatedAt: nowIso,
        ...(nextFollowUpAt ? { NextFollowUpAt: nextFollowUpAt, FollowUpStatus: 'PENDING' } : {})
      });
    }

    return successResponse_({
      callLogId: callLogId,
      timestamp: nowIso
    });

  } catch (error) {
    return errorResponse_(error.message);
  }
}

/**
 * Seed default form in LEAD_FORMS
 */
function seedDefaultLeadForm_() {
  const forms = getSheetData_('LEAD_FORMS');
  if (forms.length === 0) {
    appendRow_('LEAD_FORMS', {
      FormID: 'FORM-HRCA-DEFAULT',
      Slug: 'hrca-admissions',
      FormTitle: 'HRCA Professional Course Registration',
      Description: 'Enroll in Kerala\'s Premier Hospital Administration & HR Certification Program with Guaranteed Internship.',
      DefaultCourse: 'HRCA',
      CampaignName: 'Academy Admissions 2026',
      LeadSource: 'Meta Ads',
      Status: 'ACTIVE',
      CreatedBy: 'CHAIRMAN',
      CreatedAt: new Date().toISOString(),
      ExpiresAt: '',
      ConfirmationMessage: 'Registration successful! Our counsellor will WhatsApp you course fees and syllabus shortly.',
      PrivacyNotice: 'We value your privacy. Your details are used strictly by Mastered Skill Academy counsellors.',
      FormConfigVersion: '1.0'
    });
  }
}

/**
 * Seed & Sync Salesperson Settings
 */
function syncSalespersonSettings_() {
  const users = getSheetData_('USERS');
  const settings = getSheetData_('SALESPERSON_SETTINGS');
  const existingIds = settings.map(s => String(s.SalespersonID));

  const salesUsers = users.filter(u =>
    String(u.Role || '').toUpperCase() === 'SALESPERSON' ||
    String(u.Role || '').toUpperCase() === 'CHAIRMAN'
  );

  salesUsers.forEach(u => {
    if (!existingIds.includes(String(u.UserID))) {
      appendRow_('SALESPERSON_SETTINGS', {
        SalespersonID: u.UserID,
        Name: u.Name,
        Email: u.Email,
        Status: u.Status || 'ACTIVE',
        DailyLeadCap: 25,
        MaxOpenEnquiries: 60,
        LifetimeCap: 500,
        LifetimeCapEnabled: 'FALSE',
        AllocationWeight: 1,
        LeaveStartDate: '',
        LeaveEndDate: '',
        LeaveReason: '',
        PausedAt: '',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      });
    }
  });
}


/**
 * Chairman Lead Forms & Campaigns Management
 */
function getLeadForms_() {
  try {
    const forms = getSheetData_('LEAD_FORMS');
    const submissions = getSheetData_('FORM_SUBMISSIONS');

    const formattedForms = forms.map(f => {
      const formSubs = submissions.filter(s => s.FormID === f.FormID);
      return {
        formId: f.FormID,
        slug: f.Slug,
        title: f.FormTitle,
        description: f.Description,
        defaultCourse: f.DefaultCourse,
        campaignName: f.CampaignName,
        leadSource: f.LeadSource,
        status: f.Status,
        createdAt: f.CreatedAt,
        expiresAt: f.ExpiresAt,
        confirmationMessage: f.ConfirmationMessage,
        submissionCount: formSubs.length
      };
    });

    return successResponse_({ forms: formattedForms });
  } catch (err) {
    return errorResponse_(err.message);
  }
}

function saveLeadForm_(payload) {
  try {
    const formId = payload.formId || ('FORM-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    const slug = String(payload.slug || payload.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const record = {
      FormID: formId,
      Slug: slug,
      FormTitle: payload.title || 'Course Registration',
      Description: payload.description || '',
      DefaultCourse: payload.defaultCourse || 'HRCA',
      CampaignName: payload.campaignName || 'Meta Ads',
      LeadSource: payload.leadSource || 'Website Registration',
      Status: payload.status || 'ACTIVE',
      CreatedBy: payload.userId || 'CHAIRMAN',
      CreatedAt: payload.createdAt || new Date().toISOString(),
      ExpiresAt: payload.expiresAt || '',
      ConfirmationMessage: payload.confirmationMessage || 'Thank you! We will connect with you on WhatsApp.',
      PrivacyNotice: payload.privacyNotice || 'Your details are safe with Mastered Skill Academy.',
      FormConfigVersion: '1.0'
    };

    const forms = getSheetData_('LEAD_FORMS');
    const existing = forms.find(f => f.FormID === formId);

    if (existing) {
      updateRowByValue_('LEAD_FORMS', 'FormID', formId, record);
    } else {
      appendRow_('LEAD_FORMS', record);
    }

    return successResponse_({ formId: formId, slug: slug });
  } catch (err) {
    return errorResponse_(err.message);
  }
}

/**
 * Chairman Salesperson Settings & Capacity Controls
 */
function getSalespersonSettings_() {
  try {
    syncSalespersonSettings_();
    const settings = getSheetData_('SALESPERSON_SETTINGS');
    const assignments = getSheetData_('ASSIGNMENT_HISTORY');
    const enquiries = getSheetData_('ENQUIRIES');
    const todayStr = new Date().toISOString().slice(0, 10);

    const result = settings.map(sp => {
      const todayCount = assignments.filter(a =>
        String(a.NewSalespersonID) === String(sp.SalespersonID) &&
        String(a.AssignedAt).slice(0, 10) === todayStr
      ).length;

      const lifetimeCount = assignments.filter(a =>
        String(a.NewSalespersonID) === String(sp.SalespersonID)
      ).length;

      const openCount = enquiries.filter(e =>
        String(e.AssignedSalespersonId) === String(sp.SalespersonID) &&
        !['Admitted', 'ADMITTED', 'Not Interested', 'NOT_INTERESTED'].includes(e.Status)
      ).length;

      return {
        salespersonId: sp.SalespersonID,
        name: sp.Name,
        email: sp.Email,
        status: sp.Status || 'ACTIVE',
        dailyLeadCap: Number(sp.DailyLeadCap || 25),
        maxOpenEnquiries: Number(sp.MaxOpenEnquiries || 60),
        lifetimeCap: Number(sp.LifetimeCap || 500),
        lifetimeCapEnabled: String(sp.LifetimeCapEnabled).toLowerCase() === 'true',
        allocationWeight: Number(sp.AllocationWeight || 1),
        leaveStartDate: sp.LeaveStartDate || '',
        leaveEndDate: sp.LeaveEndDate || '',
        leaveReason: sp.LeaveReason || '',
        pausedAt: sp.PausedAt || '',
        todayAssignments: todayCount,
        openEnquiries: openCount,
        lifetimeAssignments: lifetimeCount
      };
    });

    return successResponse_({ settings: result });
  } catch (err) {
    return errorResponse_(err.message);
  }
}

function updateSalespersonSettings_(payload) {
  try {
    const spId = payload.salespersonId;
    if (!spId) return errorResponse_('Salesperson ID is required.');

    const updateData = {
      UpdatedAt: new Date().toISOString()
    };

    if (payload.status !== undefined) updateData.Status = payload.status;
    if (payload.dailyLeadCap !== undefined) updateData.DailyLeadCap = Number(payload.dailyLeadCap);
    if (payload.maxOpenEnquiries !== undefined) updateData.MaxOpenEnquiries = Number(payload.maxOpenEnquiries);
    if (payload.lifetimeCap !== undefined) updateData.LifetimeCap = Number(payload.lifetimeCap);
    if (payload.lifetimeCapEnabled !== undefined) updateData.LifetimeCapEnabled = String(payload.lifetimeCapEnabled).toUpperCase();
    if (payload.allocationWeight !== undefined) updateData.AllocationWeight = Number(payload.allocationWeight);
    if (payload.leaveStartDate !== undefined) updateData.LeaveStartDate = payload.leaveStartDate;
    if (payload.leaveEndDate !== undefined) updateData.LeaveEndDate = payload.leaveEndDate;
    if (payload.leaveReason !== undefined) updateData.LeaveReason = payload.leaveReason;

    updateRowByValue_('SALESPERSON_SETTINGS', 'SalespersonID', spId, updateData);
    return successResponse_({ updated: true });
  } catch (err) {
    return errorResponse_(err.message);
  }
}

function getAssignmentHistory_(payload) {
  try {
    const history = getSheetData_('ASSIGNMENT_HISTORY');
    const sorted = history.reverse().slice(0, 100);
    return successResponse_({ history: sorted });
  } catch (err) {
    return errorResponse_(err.message);
  }
}

/**
 * =========================================================
 * CORE GOOGLE SHEETS & RESPONSE HELPER UTILITIES
 * =========================================================
 */

function getSheetData_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    obj._rowIndex = i + 1;
    rows.push(obj);
  }
  return rows;
}

function appendRow_(sheetName, record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found.');
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rowValues = headers.map(h => record[h] !== undefined ? record[h] : '');
  sheet.appendRow(rowValues);
}

function updateRowByValue_(sheetName, keyField, keyValue, updateObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found.');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  const headers = data[0];
  const keyIdx = headers.indexOf(keyField);
  if (keyIdx === -1) return false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIdx]) === String(keyValue)) {
      for (const prop in updateObj) {
        const colIdx = headers.indexOf(prop);
        if (colIdx !== -1) {
          sheet.getRange(i + 1, colIdx + 1).setValue(updateObj[prop]);
        }
      }
      return true;
    }
  }
  return false;
}

function successResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse_(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: String(message)
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Enhanced Router Integration Helper
 * Can be called from routeRequest_ in Code.gs
 */
function handleEnhancedCRMRouting_(action, payload) {
  const normAction = String(action || '').toLowerCase().trim();

  // 1. Public Endpoints (No token required)
  if (normAction === 'getpublicform') {
    return getPublicForm_(payload);
  }
  if (normAction === 'publicsubmitform') {
    return publicSubmitForm_(payload);
  }

  // 2. Authenticated Endpoints (Token checked by caller)
  if (normAction === 'logcall') {
    return logCall_(payload);
  }
  if (normAction === 'getleadforms') {
    return getLeadForms_(payload);
  }
  if (normAction === 'saveleadform') {
    return saveLeadForm_(payload);
  }
  if (normAction === 'getsalespersonsettings') {
    return getSalespersonSettings_(payload);
  }
  if (normAction === 'updatesalespersonsettings') {
    return updateSalespersonSettings_(payload);
  }
  if (normAction === 'getassignmenthistory') {
    return getAssignmentHistory_(payload);
  }

  return null;
}
