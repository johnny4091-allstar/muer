export type ID = string;

export type Role = 'office' | 'technician';

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export type EstimateStatus = 'draft' | 'sent' | 'approved' | 'declined' | 'converted';

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'void';

export type RequestStatus = 'new' | 'scheduled' | 'declined';

export type PaymentMethod = 'card' | 'cash' | 'check' | 'bank';

export interface Business {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxRate: number; // percent, e.g. 8.25
  invoiceTerms: number; // days until due
  bookingIntro: string;
  services: string[];
}

export interface TeamMember {
  id: ID;
  name: string;
  role: Role;
  color: string;
  phone: string;
}

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: ID;
  label: string;
  done: boolean;
}

export interface TimeEntry {
  id: ID;
  memberId: ID;
  start: string;
  end?: string;
}

export interface JobNote {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: string;
}

export interface Job {
  id: ID;
  number: number;
  customerId: ID;
  title: string;
  description: string;
  address: string;
  start: string; // ISO
  durationMins: number;
  assigneeId?: ID;
  status: JobStatus;
  recurrence: Recurrence;
  seriesId?: ID;
  checklist: ChecklistItem[];
  time: TimeEntry[];
  notes: JobNote[];
  estimateId?: ID;
  invoiceId?: ID;
  createdAt: string;
}

export interface LineItem {
  id: ID;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Pricing {
  items: LineItem[];
  discount: number; // flat amount
  taxRate: number; // percent
}

export interface Estimate extends Pricing {
  id: ID;
  number: number;
  customerId: ID;
  jobId?: ID;
  title: string;
  status: EstimateStatus;
  notes: string;
  invoiceId?: ID;
  createdAt: string;
  sentAt?: string;
  decidedAt?: string;
}

export interface Invoice extends Pricing {
  id: ID;
  number: number;
  customerId: ID;
  jobId?: ID;
  estimateId?: ID;
  title: string;
  status: InvoiceStatus;
  notes: string;
  issuedAt: string;
  dueAt: string;
  sentAt?: string;
}

export interface Payment {
  id: ID;
  invoiceId: ID;
  amount: number;
  method: PaymentMethod;
  reference: string;
  receivedAt: string;
}

export interface BookingRequest {
  id: ID;
  name: string;
  email: string;
  phone: string;
  address: string;
  service: string;
  details: string;
  preferredDate: string; // ISO date
  preferredWindow: 'morning' | 'afternoon' | 'anytime';
  status: RequestStatus;
  jobId?: ID;
  createdAt: string;
}

export interface Counters {
  job: number;
  estimate: number;
  invoice: number;
}
