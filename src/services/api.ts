import type {
  ApiResponse,
  User,
  Lead,
  FollowUpItem,
  Admission,
  CourseTransfer,
  Course,
  Objection,
  MessageTemplate,
  DashboardMetrics,
  WhatsAppActivitySummary,
} from '../types';

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyLUXWJR3y6H1rOnn4O5oetL_O_jExzNHnE2p_9Kf3TfMu87Tx9DnKP7Kh_axhXW3bFBg/exec';

// Single source of truth session key in localStorage
export const SESSION_STORAGE_KEY = 'msa_session';

export interface StoredSession {
  token: string;
  user: User;
  permissions?: any;
  savedAt: number;
}

type AuthExpiredListener = () => void;
const authExpiredListeners: AuthExpiredListener[] = [];

// Single-session-expiry lock to prevent duplicate toasts & duplicate redirects (STEP 6)
let isSessionExpiryInProgress = false;

export function onSessionExpired(listener: AuthExpiredListener) {
  authExpiredListeners.push(listener);
  return () => {
    const index = authExpiredListeners.indexOf(listener);
    if (index > -1) {
      authExpiredListeners.splice(index, 1);
    }
  };
}

export function notifySessionExpired() {
  if (isSessionExpiryInProgress) {
    return;
  }
  isSessionExpiryInProgress = true;
  clearStoredSession();

  authExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('[AUTH] Error executing session expired listener', e);
    }
  });

  setTimeout(() => {
    isSessionExpiryInProgress = false;
  }, 2500);
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.token && parsed.user) {
      return parsed as StoredSession;
    }
    return null;
  } catch (err) {
    console.error('[AUTH] Failed to parse msa_session from localStorage', err);
    return null;
  }
}

export function saveStoredSession(token: string, user: User, permissions: any = {}): void {
  try {
    const sessionData: StoredSession = {
      token,
      user,
      permissions,
      savedAt: Date.now(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));

    // STEP 2 — INSPECT TOKEN STORAGE
    console.log('TOKEN STORAGE CHECK:', {
      tokenExists: !!token,
      tokenLength: token ? token.length : 0,
      sessionExists: !!localStorage.getItem(SESSION_STORAGE_KEY),
    });
  } catch (e) {
    console.error('[AUTH] Failed to save session to localStorage', e);
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('[AUTH] localStorage msa_session cleared');
  } catch (e) {
    console.error('[AUTH] Failed to remove session from localStorage', e);
  }
}

export function getStoredToken(): string | null {
  const session = getStoredSession();
  return session ? session.token : null;
}

export function getStoredUser(): User | null {
  const session = getStoredSession();
  return session ? session.user : null;
}

/**
 * STEP 3, 6, 7 & 10: Central API Request Helper
 * Sends { action, payload: { token, ...payload }, token, ...payload } for seamless Apps Script compatibility.
 */
export async function apiRequest<T = any>(
  action: string,
  payload: Record<string, any> = {}
): Promise<ApiResponse<T>> {
  const session = getStoredSession();
  const token = session?.token;
  const isPublicAction = action === 'login' || action === 'health';
  const effectiveToken = payload.token !== undefined ? payload.token : token;

  // STEP 3 — INSPECT THE FIRST PROTECTED REQUEST
  console.log('AUTH API REQUEST:', {
    action,
    tokenExists: !!effectiveToken,
    tokenLength: effectiveToken ? effectiveToken.length : 0,
  });

  const payloadWithToken: Record<string, any> = {
    ...payload,
    ...(effectiveToken ? { token: effectiveToken } : {}),
  };

  const requestBody = {
    action,
    payload: payloadWithToken,
    ...payloadWithToken,
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // STEP 10: Only trigger session expiry when backend explicitly indicates invalid/expired session
    if (result && result.success === false) {
      const msg = (result.message || '').toLowerCase();
      const isSessionExpiredError =
        msg.includes('invalid or expired session') ||
        msg.includes('session expired') ||
        msg.includes('invalid token') ||
        msg.includes('authentication token is required');

      if (isSessionExpiredError && !isPublicAction) {
        console.warn('[AUTH] Backend explicitly indicated invalid/expired session:', result.message);
        notifySessionExpired();
      }
    }

    return result as ApiResponse<T>;
  } catch (error: any) {
    console.error(`[AUTH] Network/API Error [${action}]:`, error);
    // STEP 10: Do NOT treat network/fetch error as expired session
    return {
      success: false,
      message: error.message || 'Unable to connect to CRM server. Please check your internet connection.',
    };
  }
}

export const api = {
  request: apiRequest,
  apiRequest,

  async health(): Promise<ApiResponse<{ status: string; app: string; version: string }>> {
    return apiRequest('health');
  },

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ token: string; user: User; permissions?: any }>> {
    console.log('[AUTH] Calling login API for:', email.trim());

    const res = await apiRequest('login', { email: email.trim(), password });

    // STEP 1 & 4 — INSPECT ACTUAL LOGIN RESPONSE
    console.log('LOGIN RESPONSE:', {
      success: res?.success,
      keys: Object.keys(res || {}),
      hasTokenAtRoot: !!(res as any)?.token,
      hasData: !!res?.data,
      dataKeys: res?.data ? Object.keys(res.data) : [],
      hasTokenInData: !!res?.data?.token,
      hasUserAtRoot: !!(res as any)?.user,
      hasUserInData: !!res?.data?.user,
    });

    // Extract token, user, permissions from wherever the backend delivers it
    const token =
      res?.data?.token ||
      (res as any)?.token ||
      (res as any)?.result?.token ||
      null;

    const user =
      res?.data?.user ||
      (res as any)?.user ||
      (res as any)?.result?.user ||
      null;

    const permissions =
      res?.data?.permissions ||
      (res as any)?.permissions ||
      (res as any)?.result?.permissions ||
      {};

    if (res.success && token && user) {
      saveStoredSession(token, user, permissions);
    }

    return res;
  },

  async logout(): Promise<ApiResponse<any>> {
    const token = getStoredToken();
    let res: ApiResponse<any> = { success: true };
    if (token) {
      try {
        res = await apiRequest('logout', { token });
      } catch (e) {
        console.warn('[AUTH] Error during logout API call', e);
      }
    }
    clearStoredSession();
    return res;
  },

  async getUser(): Promise<ApiResponse<{ user: User; permissions?: any }>> {
    const res = await apiRequest('getuser');
    console.log('[AUTH] getuser response:', {
      success: res.success,
      hasUser: !!(res.data?.user || (res as any).user),
    });
    return res;
  },

  async getLeads(
    filters: {
      page?: number;
      limit?: number;
      salespersonId?: string;
      course?: string;
      temperature?: string;
      status?: string;
      interestLevel?: string;
      leadSource?: string;
      priorityTier?: string;
      search?: string;
    } = {}
  ): Promise<ApiResponse<Lead[] | { leads: Lead[]; total?: number }>> {
    return apiRequest('getleads', filters);
  },

  async getLead(leadId: string): Promise<ApiResponse<{ lead: Lead; history?: any[]; transfers?: any[] }>> {
    return apiRequest('getlead', { leadId });
  },

  async createLead(leadData: {
    name: string;
    phone: string;
    whatsapp?: string;
    location?: string;
    leadSource: string;
    course: string;
    temperature: string;
    status?: string;
    interestLevel: string;
    objection?: string;
    remark?: string;
    nextFollowUpAt?: string;
  }): Promise<ApiResponse<{ leadId: string; lead?: Lead }>> {
    return apiRequest('createlead', leadData);
  },

  async updateLead(leadId: string, leadData: Partial<Lead>): Promise<ApiResponse<{ lead: Lead }>> {
    return apiRequest('updatelead', { leadId, ...leadData });
  },

  async assignLead(
    leadId: string,
    salespersonId: string,
    salespersonName?: string
  ): Promise<ApiResponse<{ lead: Lead }>> {
    return apiRequest('assignlead', { leadId, salespersonId, salespersonName });
  },

  async searchLeads(query: string): Promise<ApiResponse<Lead[]>> {
    return apiRequest('searchleads', { query });
  },

  async getDailyFollowUpQueue(): Promise<ApiResponse<FollowUpItem[] | { queue: FollowUpItem[]; total: number }>> {
    return apiRequest('getdailyfollowupqueue');
  },

  async getOverdueFollowUps(): Promise<ApiResponse<FollowUpItem[] | { overdue: FollowUpItem[]; total: number }>> {
    return apiRequest('getoverduefollowups');
  },

  async completeFollowUp(data: {
    leadId: string;
    result: string;
    temperature: string;
    interestLevel: string;
    objection?: string;
    remark: string;
    nextFollowUpAt?: string;
  }): Promise<ApiResponse<{ success: boolean; lead?: Lead }>> {
    return apiRequest('completefollowup', data);
  },

  async rescheduleFollowUp(data: {
    leadId: string;
    nextFollowUpAt: string;
    reason: string;
  }): Promise<ApiResponse<{ success: boolean; lead?: Lead }>> {
    return apiRequest('reschedulefollowup', data);
  },

  async getDashboard(): Promise<ApiResponse<DashboardMetrics>> {
    return apiRequest('getdashboard');
  },

  async createAdmission(data: {
    leadId: string;
    studentName: string;
    course: string;
    admissionDate: string;
    admissionAmount: number;
    paymentStatus: string;
    notes?: string;
  }): Promise<ApiResponse<{ admissionId: string; admission?: Admission }>> {
    return apiRequest('createadmission', data);
  },

  async getAdmission(admissionId: string): Promise<ApiResponse<Admission>> {
    return apiRequest('getadmission', { admissionId });
  },

  async getAdmissions(): Promise<ApiResponse<Admission[]>> {
    return apiRequest('getadmissions');
  },

  async updateAdmissionPayment(data: {
    admissionId: string;
    paymentStatus: string;
    amountPaid?: number;
    notes?: string;
  }): Promise<ApiResponse<Admission>> {
    return apiRequest('updateadmissionpayment', data);
  },

  async transferCourse(data: {
    leadId?: string;
    admissionId?: string;
    previousCourse: string;
    newCourse: string;
    reason: string;
  }): Promise<ApiResponse<{ success: boolean; transfer?: CourseTransfer }>> {
    return apiRequest('transfercourse', data);
  },

  async getCourseTransferHistory(leadIdOrAdmissionId?: string): Promise<ApiResponse<CourseTransfer[]>> {
    return apiRequest(
      'getcoursetransferhistory',
      leadIdOrAdmissionId ? { leadId: leadIdOrAdmissionId, admissionId: leadIdOrAdmissionId } : {}
    );
  },

  async openWhatsApp(data: {
    leadId?: string;
    phone: string;
    messageTemplateId?: string;
    customMessage?: string;
  }): Promise<ApiResponse<{ url: string; phone: string }>> {
    return apiRequest('openwhatsapp', data);
  },

  async getWhatsAppActivity(leadId?: string): Promise<ApiResponse<any[]>> {
    return apiRequest('getwhatsappactivity', leadId ? { leadId } : {});
  },

  async getTodayWhatsAppActivity(): Promise<ApiResponse<{ count: number; list?: any[] }>> {
    return apiRequest('gettodaywhatsappactivity');
  },

  async getWhatsAppActivitySummary(): Promise<ApiResponse<WhatsAppActivitySummary>> {
    return apiRequest('getwhatsappactivitysummary');
  },

  async getCourses(): Promise<ApiResponse<Course[]>> {
    return apiRequest('getcourses');
  },

  async getObjections(): Promise<ApiResponse<Objection[]>> {
    return apiRequest('getobjections');
  },

  async getMessageTemplates(): Promise<ApiResponse<MessageTemplate[]>> {
    return apiRequest('getmessagetemplates');
  },

  async getLeadSources(): Promise<ApiResponse<string[] | { source: string; name?: string }[]>> {
    return apiRequest('getleadsources');
  },
};
