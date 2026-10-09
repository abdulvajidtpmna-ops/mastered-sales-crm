// CRM Core Data Types

export type UserRole = 'SALESPERSON' | 'CHAIRMAN';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
}

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD' | 'Hot' | 'Warm' | 'Cold';

export type LeadStatus =
  | 'New'
  | 'In Follow-up'
  | 'Interested'
  | 'Callback Requested'
  | 'Admission In Progress'
  | 'Admitted'
  | 'Not Interested'
  | 'Invalid'
  | 'NEW'
  | 'IN_FOLLOWUP'
  | 'INTERESTED'
  | 'CALLBACK_REQUESTED'
  | 'ADMISSION_IN_PROGRESS'
  | 'ADMITTED'
  | 'NOT_INTERESTED'
  | 'INVALID';

export type InterestLevel =
  | 'Very High'
  | 'High'
  | 'Moderate'
  | 'Low'
  | 'VERY_HIGH'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW';

export type PriorityTier = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P1 Critical' | 'P2 High' | 'P3 Medium' | 'P4 Low' | 'P5 Minimal';

export interface Lead {
  id?: string;
  leadId?: string;
  name: string;
  phone: string;
  whatsapp?: string;
  location?: string;
  leadSource: string;
  course: string;
  temperature: LeadTemperature;
  status: LeadStatus;
  interestLevel: InterestLevel;
  priorityScore?: number;
  priorityTier?: PriorityTier;
  objection?: string;
  remark?: string;
  suggestedObjective?: string;
  suggestedQuestion?: string;
  nextFollowUpAt?: string;
  lastContactAt?: string;
  assignedSalespersonId?: string;
  assignedSalespersonName?: string;
  createdAt?: string;
  updatedAt?: string;
  admissionStatus?: 'Pending' | 'Admitted' | 'Cancelled';
  admissionId?: string;
}

export interface FollowUpItem extends Lead {
  followUpId?: string;
  dueDate?: string;
  dueTime?: string;
  recommendedAction?: string;
  isOverdue?: boolean;
}

export interface FollowUpHistoryItem {
  id?: string;
  historyId?: string;
  leadId: string;
  salespersonId?: string;
  salespersonName?: string;
  result: string;
  temperature?: LeadTemperature;
  interestLevel?: InterestLevel;
  objection?: string;
  remark: string;
  contactedAt: string;
  nextFollowUpAt?: string;
}

export interface Admission {
  id?: string;
  admissionId?: string;
  leadId: string;
  studentName: string;
  phone?: string;
  course: string;
  admissionDate: string;
  admissionAmount: number;
  amountPaid?: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'Paid' | 'Partial' | 'Pending';
  salespersonId?: string;
  salespersonName?: string;
  notes?: string;
  createdAt?: string;
}

export interface CourseTransfer {
  id?: string;
  transferId?: string;
  admissionId?: string;
  leadId?: string;
  studentName?: string;
  previousCourse: string;
  newCourse: string;
  reason: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
}

export interface Course {
  id?: string;
  code: string;
  name: string;
  duration?: string;
  description?: string;
  fee?: number;
}

export interface Objection {
  id?: string;
  name: string;
  category?: string;
  suggestedObjective?: string;
  suggestedQuestion?: string;
}

export interface MessageTemplate {
  id?: string;
  templateId?: string;
  title: string;
  category?: string;
  messageText: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  qualified: number;
  interested: number;
  pendingFollowups: number;
  todaysFollowups: number;
  overdueFollowups: number;
  admissions: number;
  conversionRate: number;
  salespersonPerformance?: {
    salespersonId: string;
    salespersonName: string;
    totalLeads: number;
    activeLeads: number;
    followups: number;
    admissions: number;
    conversionRate: number;
  }[];
  coursePerformance?: {
    course: string;
    leads: number;
    admissions: number;
    conversionRate: number;
  }[];
  sourcePerformance?: {
    source: string;
    leads: number;
    admissions: number;
    conversionRate: number;
  }[];
  priorityDistribution?: {
    tier: string;
    count: number;
    percentage: number;
  }[];
}

export interface WhatsAppActivity {
  leadId?: string;
  phone: string;
  salespersonId: string;
  salespersonName?: string;
  openedAt: string;
  messageTemplate?: string;
}

export interface WhatsAppActivitySummary {
  todayCount: number;
  thresholdLevel: 'NORMAL' | 'SAFE_TARGET' | 'WARNING' | 'HIGH_ACTIVITY';
  thresholdLabel: string;
  maxSafeTarget?: number;
  recentActivity?: WhatsAppActivity[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
