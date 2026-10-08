import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { addDays, nextOccurrence } from '../lib/dates';
import { uid } from '../lib/id';
import { balanceOf, totals } from '../lib/money';
import { buildSeed, type DataState } from './seed';
import type {
  BookingRequest,
  Business,
  ChecklistItem,
  Customer,
  Estimate,
  ID,
  Invoice,
  Job,
  JobStatus,
  Payment,
  Pricing,
  Recurrence,
  TeamMember,
} from './types';

/** How far ahead recurring visits are materialized on the schedule. */
const RECURRENCE_HORIZON_DAYS = 180;
const MAX_OCCURRENCES = 26;

export interface JobInput {
  customerId: ID;
  title: string;
  description: string;
  address: string;
  start: string;
  durationMins: number;
  assigneeId?: ID;
  recurrence: Recurrence;
  checklist: string[];
}

export type DocInput = Pricing & { customerId: ID; jobId?: ID; title: string; notes: string };

interface Session {
  memberId: ID;
}

interface Actions {
  setSession: (memberId: ID) => void;
  updateBusiness: (patch: Partial<Business>) => void;
  upsertMember: (m: Omit<TeamMember, 'id'> & { id?: ID }) => ID;

  upsertCustomer: (c: Omit<Customer, 'id' | 'createdAt'> & { id?: ID }) => ID;
  deleteCustomer: (id: ID) => void;

  createJob: (input: JobInput) => ID;
  updateJob: (id: ID, patch: Partial<Omit<Job, 'id' | 'number'>>) => void;
  setJobStatus: (id: ID, status: JobStatus) => void;
  deleteJob: (id: ID) => void;
  toggleChecklist: (jobId: ID, itemId: ID) => void;
  addChecklistItem: (jobId: ID, label: string) => void;
  clockIn: (jobId: ID, memberId: ID) => void;
  clockOut: (jobId: ID, memberId: ID) => void;
  addNote: (jobId: ID, authorId: ID, body: string) => void;

  saveEstimate: (input: DocInput, id?: ID) => ID;
  sendEstimate: (id: ID) => void;
  decideEstimate: (id: ID, decision: 'approved' | 'declined') => void;
  convertEstimate: (id: ID) => ID;
  deleteEstimate: (id: ID) => void;

  saveInvoice: (input: DocInput, id?: ID) => ID;
  invoiceFromJob: (jobId: ID) => ID;
  sendInvoice: (id: ID) => void;
  voidInvoice: (id: ID) => void;
  recordPayment: (p: Omit<Payment, 'id'>) => void;

  submitRequest: (r: Omit<BookingRequest, 'id' | 'status' | 'createdAt' | 'jobId'>) => ID;
  scheduleRequest: (id: ID, opts: { start: string; durationMins: number; assigneeId?: ID }) => ID;
  declineRequest: (id: ID) => void;

  resetDemo: () => void;
}

export type AppState = DataState & { session: Session; hydrated: boolean } & Actions;

const nowIso = () => new Date().toISOString();

const invoiceStatusAfterPayment = (inv: Invoice, payments: Payment[]): Invoice['status'] => {
  if (inv.status === 'void' || inv.status === 'draft') return inv.status;
  const balance = balanceOf(inv, payments);
  if (balance <= 0) return 'paid';
  return payments.some((p) => p.invoiceId === inv.id) ? 'partial' : 'sent';
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const patchJob = (id: ID, fn: (j: Job) => Job) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? fn(j) : j)) }));

      const nextNumber = (key: keyof DataState['counters']) => {
        const n = get().counters[key] + 1;
        set((s) => ({ counters: { ...s.counters, [key]: n } }));
        return n;
      };

      const makeJob = (input: JobInput, start: string, seriesId?: ID): Job => ({
        id: uid(),
        number: nextNumber('job'),
        customerId: input.customerId,
        title: input.title,
        description: input.description,
        address: input.address,
        start,
        durationMins: input.durationMins,
        assigneeId: input.assigneeId,
        status: 'scheduled',
        recurrence: input.recurrence,
        seriesId,
        checklist: input.checklist.map((label) => ({ id: uid(), label, done: false })),
        time: [],
        notes: [],
        createdAt: nowIso(),
      });

      return {
        ...buildSeed(),
        session: { memberId: 'm-office' },
        hydrated: false,

        setSession: (memberId) => set({ session: { memberId } }),
        updateBusiness: (patch) => set((s) => ({ business: { ...s.business, ...patch } })),
        upsertMember: (m) => {
          const id = m.id ?? uid();
          set((s) => ({
            team: s.team.some((t) => t.id === id)
              ? s.team.map((t) => (t.id === id ? { ...t, ...m, id } : t))
              : [...s.team, { ...m, id }],
          }));
          return id;
        },

        upsertCustomer: (c) => {
          const id = c.id ?? uid();
          set((s) => ({
            customers: s.customers.some((x) => x.id === id)
              ? s.customers.map((x) => (x.id === id ? { ...x, ...c, id } : x))
              : [{ ...c, id, createdAt: nowIso() }, ...s.customers],
          }));
          return id;
        },
        deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

        createJob: (input) => {
          if (input.recurrence === 'none') {
            const job = makeJob(input, input.start);
            set((s) => ({ jobs: [...s.jobs, job] }));
            return job.id;
          }
          // Materialize upcoming visits so the office can plan repeat work ahead of time.
          const seriesId = uid();
          const horizon = addDays(new Date(input.start), RECURRENCE_HORIZON_DAYS);
          const created: Job[] = [];
          let when: Date | null = new Date(input.start);
          while (when && when <= horizon && created.length < MAX_OCCURRENCES) {
            created.push(makeJob(input, when.toISOString(), seriesId));
            when = nextOccurrence(when, input.recurrence);
          }
          set((s) => ({ jobs: [...s.jobs, ...created] }));
          return created[0].id;
        },
        updateJob: (id, patch) => patchJob(id, (j) => ({ ...j, ...patch })),
        setJobStatus: (id, status) =>
          patchJob(id, (j) => {
            // Completing a job closes any open timers so labor totals stay accurate.
            const time =
              status === 'completed' || status === 'cancelled'
                ? j.time.map((t) => (t.end ? t : { ...t, end: nowIso() }))
                : j.time;
            return { ...j, status, time };
          }),
        deleteJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
        toggleChecklist: (jobId, itemId) =>
          patchJob(jobId, (j) => ({
            ...j,
            checklist: j.checklist.map((c: ChecklistItem) => (c.id === itemId ? { ...c, done: !c.done } : c)),
          })),
        addChecklistItem: (jobId, label) =>
          patchJob(jobId, (j) => ({ ...j, checklist: [...j.checklist, { id: uid(), label, done: false }] })),
        clockIn: (jobId, memberId) =>
          patchJob(jobId, (j) => ({
            ...j,
            status: j.status === 'scheduled' ? 'in_progress' : j.status,
            time: [...j.time, { id: uid(), memberId, start: nowIso() }],
          })),
        clockOut: (jobId, memberId) =>
          patchJob(jobId, (j) => ({
            ...j,
            time: j.time.map((t) => (t.memberId === memberId && !t.end ? { ...t, end: nowIso() } : t)),
          })),
        addNote: (jobId, authorId, body) =>
          patchJob(jobId, (j) => ({
            ...j,
            notes: [...j.notes, { id: uid(), authorId, body, createdAt: nowIso() }],
          })),

        saveEstimate: (input, id) => {
          if (id) {
            set((s) => ({ estimates: s.estimates.map((e) => (e.id === id ? { ...e, ...input } : e)) }));
            return id;
          }
          const est: Estimate = { ...input, id: uid(), number: nextNumber('estimate'), status: 'draft', createdAt: nowIso() };
          set((s) => ({ estimates: [est, ...s.estimates] }));
          if (input.jobId) patchJob(input.jobId, (j) => ({ ...j, estimateId: est.id }));
          return est.id;
        },
        sendEstimate: (id) =>
          set((s) => ({
            estimates: s.estimates.map((e) =>
              e.id === id
                ? {
                    ...e,
                    status: e.status === 'draft' || e.status === 'declined' ? 'sent' : e.status,
                    sentAt: nowIso(),
                  }
                : e,
            ),
          })),
        decideEstimate: (id, decision) =>
          set((s) => ({
            estimates: s.estimates.map((e) => (e.id === id ? { ...e, status: decision, decidedAt: nowIso() } : e)),
          })),
        convertEstimate: (id) => {
          const est = get().estimates.find((e) => e.id === id);
          if (!est) throw new Error('Estimate not found');
          if (est.invoiceId) return est.invoiceId;
          const invoiceId = get().saveInvoice({
            customerId: est.customerId,
            jobId: est.jobId,
            title: est.title,
            notes: est.notes,
            items: est.items.map((i) => ({ ...i, id: uid() })),
            discount: est.discount,
            taxRate: est.taxRate,
          });
          set((s) => ({
            estimates: s.estimates.map((e) => (e.id === id ? { ...e, status: 'converted', invoiceId } : e)),
            invoices: s.invoices.map((i) => (i.id === invoiceId ? { ...i, estimateId: id } : i)),
          }));
          return invoiceId;
        },
        deleteEstimate: (id) =>
          set((s) => ({
            estimates: s.estimates.filter((e) => e.id !== id),
            jobs: s.jobs.map((j) => (j.estimateId === id ? { ...j, estimateId: undefined } : j)),
          })),

        saveInvoice: (input, id) => {
          if (id) {
            set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...input } : i)) }));
            return id;
          }
          const issued = new Date();
          const inv: Invoice = {
            ...input,
            id: uid(),
            number: nextNumber('invoice'),
            status: 'draft',
            issuedAt: issued.toISOString(),
            dueAt: addDays(issued, get().business.invoiceTerms).toISOString(),
          };
          set((s) => ({ invoices: [inv, ...s.invoices] }));
          if (input.jobId) patchJob(input.jobId, (j) => ({ ...j, invoiceId: inv.id }));
          return inv.id;
        },
        invoiceFromJob: (jobId) => {
          const s = get();
          const job = s.jobs.find((j) => j.id === jobId);
          if (!job) throw new Error('Job not found');
          if (job.invoiceId) return job.invoiceId;
          const est = s.estimates.find((e) => e.id === job.estimateId && e.status !== 'declined');
          if (est) return s.convertEstimate(est.id);
          const hours = job.time.reduce(
            (h, t) => h + ((t.end ? new Date(t.end).getTime() : Date.now()) - new Date(t.start).getTime()) / 3_600_000,
            0,
          );
          return s.saveInvoice({
            customerId: job.customerId,
            jobId,
            title: job.title,
            notes: '',
            items: [
              {
                id: uid(),
                description: `Labor — ${job.title}`,
                quantity: Math.max(1, Math.round(hours * 4) / 4),
                unitPrice: 115,
              },
            ],
            discount: 0,
            taxRate: s.business.taxRate,
          });
        },
        sendInvoice: (id) =>
          set((s) => ({
            invoices: s.invoices.map((i) => {
              if (i.id !== id) return i;
              const sent = { ...i, status: 'sent' as const, sentAt: nowIso() };
              return { ...sent, status: invoiceStatusAfterPayment(sent, s.payments) };
            }),
          })),
        voidInvoice: (id) =>
          set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: 'void' } : i)) })),
        recordPayment: (p) =>
          set((s) => {
            const payments = [...s.payments, { ...p, id: uid() }];
            return {
              payments,
              invoices: s.invoices.map((i) => {
                if (i.id !== p.invoiceId) return i;
                const base = i.status === 'draft' ? { ...i, status: 'sent' as const, sentAt: nowIso() } : i;
                return { ...base, status: invoiceStatusAfterPayment(base, payments) };
              }),
            };
          }),

        submitRequest: (r) => {
          const id = uid();
          set((s) => ({ requests: [{ ...r, id, status: 'new', createdAt: nowIso() }, ...s.requests] }));
          return id;
        },
        scheduleRequest: (id, opts) => {
          const s = get();
          const req = s.requests.find((r) => r.id === id);
          if (!req) throw new Error('Request not found');
          const norm = (v: string) => v.trim().toLowerCase();
          const digits = (v: string) => v.replace(/\D/g, '');
          const existing = s.customers.find(
            (c) =>
              (req.email && norm(c.email) === norm(req.email)) ||
              (digits(req.phone).length >= 7 && digits(c.phone) === digits(req.phone)),
          );
          const customerId =
            existing?.id ??
            s.upsertCustomer({ name: req.name, email: req.email, phone: req.phone, address: req.address, notes: '' });
          const jobId = s.createJob({
            customerId,
            title: req.service,
            description: req.details,
            address: req.address,
            start: opts.start,
            durationMins: opts.durationMins,
            assigneeId: opts.assigneeId,
            recurrence: 'none',
            checklist: [],
          });
          set((st) => ({
            requests: st.requests.map((r) => (r.id === id ? { ...r, status: 'scheduled', jobId } : r)),
          }));
          return jobId;
        },
        declineRequest: (id) =>
          set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status: 'declined' } : r)) })),

        resetDemo: () => set({ ...buildSeed(), session: { memberId: 'm-office' } }),
      };
    },
    {
      name: 'fieldbook-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<AppState>,
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

// Without usable storage (e.g. blocked site data) persist never hydrates; run in-memory instead.
if (!useStore.persist) useStore.setState({ hydrated: true });

// ---------- Selectors & derived helpers ----------

export const useMe = () => {
  const id = useStore((s) => s.session.memberId);
  const team = useStore((s) => s.team);
  return team.find((m) => m.id === id) ?? team[0];
};

export const isOverdue = (inv: Invoice, now = Date.now()) =>
  (inv.status === 'sent' || inv.status === 'partial') && new Date(inv.dueAt).getTime() < now;

export const invoiceDisplayStatus = (inv: Invoice) => (isOverdue(inv) ? 'overdue' : inv.status);

export const docTotal = (p: Pricing) => totals(p).total;
