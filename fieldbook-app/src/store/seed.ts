import { addDays, startOfDay } from '../lib/dates';
import type {
  BookingRequest,
  Business,
  Counters,
  Customer,
  Estimate,
  Invoice,
  Job,
  Payment,
  TeamMember,
} from './types';

export interface DataState {
  business: Business;
  team: TeamMember[];
  customers: Customer[];
  jobs: Job[];
  estimates: Estimate[];
  invoices: Invoice[];
  payments: Payment[];
  requests: BookingRequest[];
  counters: Counters;
}

/** Demo workspace dated relative to "now" so the dashboard and schedule always look current. */
export function buildSeed(now = new Date()): DataState {
  const today = startOfDay(now);
  const at = (dayOffset: number, hour: number, minute = 0) => {
    const d = addDays(today, dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const ago = (days: number) => addDays(today, -days).toISOString();
  // The demo's in-progress job started a little before "now", on a quarter hour.
  const ip = new Date(now.getTime() - 45 * 60_000);
  ip.setMinutes(Math.floor(ip.getMinutes() / 15) * 15, 0, 0);
  const inProgressStart = (ip < today ? today : ip).toISOString();

  const business: Business = {
    name: 'Evergreen Home Services',
    email: 'office@evergreenhome.co',
    phone: '(555) 201-4410',
    address: '1180 Mill Creek Rd, Springfield',
    taxRate: 8.25,
    invoiceTerms: 14,
    bookingIntro:
      'Tell us what you need and when works best. We will confirm your appointment within one business day.',
    services: ['HVAC tune-up', 'AC repair', 'Furnace repair', 'Plumbing', 'Water heater', 'Electrical'],
  };

  const team: TeamMember[] = [
    { id: 'm-office', name: 'Dana Whitfield', role: 'office', color: '#1F6B4F', phone: '(555) 201-4410' },
    { id: 'm-luis', name: 'Luis Romero', role: 'technician', color: '#2563EB', phone: '(555) 310-2291' },
    { id: 'm-priya', name: 'Priya Nair', role: 'technician', color: '#B45309', phone: '(555) 310-7734' },
    { id: 'm-sam', name: 'Sam Okafor', role: 'technician', color: '#7C3AED', phone: '(555) 310-5502' },
  ];

  const customers: Customer[] = [
    { id: 'c1', name: 'Margaret Chen', email: 'mchen@example.com', phone: '(555) 402-1188', address: '42 Alder Ln, Springfield', notes: 'Gate code 4471. Friendly dog.', createdAt: ago(120) },
    { id: 'c2', name: 'Harbor View Apartments', email: 'maintenance@harborview.example', phone: '(555) 400-9000', address: '900 Harbor Way, Springfield', notes: 'Check in with front desk. Units 1–48.', createdAt: ago(300) },
    { id: 'c3', name: 'Tom & Erin Becker', email: 'beckers@example.com', phone: '(555) 418-3321', address: '7 Orchard Ct, Riverton', notes: '', createdAt: ago(45) },
    { id: 'c4', name: 'Bluebird Café', email: 'owner@bluebird.example', phone: '(555) 455-0210', address: '215 Main St, Springfield', notes: 'Service before 10am opening.', createdAt: ago(200) },
    { id: 'c5', name: 'Robert Alvarez', email: 'ralvarez@example.com', phone: '(555) 499-7720', address: '1603 Pine Ridge Dr, Springfield', notes: '', createdAt: ago(12) },
  ];

  const tuneUpChecklist = (done = false) => [
    { id: 'k1', label: 'Inspect and replace air filter', done },
    { id: 'k2', label: 'Clean condenser coils', done },
    { id: 'k3', label: 'Check refrigerant pressure', done },
    { id: 'k4', label: 'Test thermostat and safety controls', done },
    { id: 'k5', label: 'Photograph equipment label', done },
  ];

  const jobs: Job[] = [
    {
      id: 'j1', number: 1041, customerId: 'c1', title: 'Spring AC tune-up', description: 'Annual maintenance on 3-ton Carrier unit.',
      address: '42 Alder Ln, Springfield', start: inProgressStart, durationMins: 90, assigneeId: 'm-luis', status: 'in_progress',
      recurrence: 'none', checklist: [
        { id: 'k1', label: 'Inspect and replace air filter', done: true },
        { id: 'k2', label: 'Clean condenser coils', done: true },
        { id: 'k3', label: 'Check refrigerant pressure', done: false },
        { id: 'k4', label: 'Test thermostat and safety controls', done: false },
        { id: 'k5', label: 'Photograph equipment label', done: false },
      ],
      time: [{ id: 't1', memberId: 'm-luis', start: new Date(now.getTime() - 38 * 60_000).toISOString() }], notes: [
        { id: 'n1', authorId: 'm-luis', body: 'Filter was very dirty — recommend 3-month replacement.', createdAt: at(0, 9, 20) },
      ], createdAt: ago(6),
    },
    {
      id: 'j2', number: 1042, customerId: 'c4', title: 'Walk-in cooler not holding temp', description: 'Cooler reading 46°F. Possible fan motor.',
      address: '215 Main St, Springfield', start: at(0, 13), durationMins: 120, assigneeId: 'm-priya', status: 'scheduled',
      recurrence: 'none', checklist: [], time: [], notes: [], createdAt: ago(1),
    },
    {
      id: 'j3', number: 1043, customerId: 'c2', title: 'Quarterly HVAC maintenance — Bldg A', description: 'Filters and inspection for units 1–24.',
      address: '900 Harbor Way, Springfield', start: at(1, 8), durationMins: 240, assigneeId: 'm-sam', status: 'scheduled',
      recurrence: 'quarterly', seriesId: 's1', checklist: tuneUpChecklist(), time: [], notes: [], createdAt: ago(90),
    },
    {
      id: 'j4', number: 1044, customerId: 'c3', title: 'Water heater replacement', description: 'Replace 50 gal gas unit; haul away old.',
      address: '7 Orchard Ct, Riverton', start: at(2, 10), durationMins: 180, assigneeId: 'm-luis', status: 'scheduled',
      recurrence: 'none', checklist: [
        { id: 'k1', label: 'Shut off gas and water', done: false },
        { id: 'k2', label: 'Install expansion tank', done: false },
        { id: 'k3', label: 'Leak test all fittings', done: false },
      ], time: [], notes: [], estimateId: 'e1', createdAt: ago(4),
    },
    {
      id: 'j5', number: 1045, customerId: 'c5', title: 'Breaker keeps tripping', description: 'Kitchen circuit trips with microwave.',
      address: '1603 Pine Ridge Dr, Springfield', start: at(4, 15), durationMins: 60, assigneeId: 'm-priya', status: 'scheduled',
      recurrence: 'none', checklist: [], time: [], notes: [], createdAt: ago(0),
    },
    {
      id: 'j6', number: 1038, customerId: 'c2', title: 'Quarterly HVAC maintenance — Bldg B', description: 'Filters and inspection for units 25–48.',
      address: '900 Harbor Way, Springfield', start: at(-3, 8), durationMins: 240, assigneeId: 'm-sam', status: 'completed',
      recurrence: 'none', checklist: tuneUpChecklist(true), time: [
        { id: 't2', memberId: 'm-sam', start: at(-3, 8, 2), end: at(-3, 11, 48) },
      ], notes: [], invoiceId: 'i2', createdAt: ago(40),
    },
    {
      id: 'j7', number: 1036, customerId: 'c1', title: 'Furnace ignitor replacement', description: '',
      address: '42 Alder Ln, Springfield', start: at(-9, 14), durationMins: 60, assigneeId: 'm-luis', status: 'completed',
      recurrence: 'none', checklist: [], time: [{ id: 't3', memberId: 'm-luis', start: at(-9, 14), end: at(-9, 14, 55) }],
      notes: [], invoiceId: 'i1', createdAt: ago(12),
    },
    {
      id: 'j8', number: 1039, customerId: 'c4', title: 'Grease trap service', description: '',
      address: '215 Main St, Springfield', start: at(-1, 7), durationMins: 60, assigneeId: 'm-sam', status: 'completed',
      recurrence: 'monthly', seriesId: 's2', checklist: [], time: [{ id: 't4', memberId: 'm-sam', start: at(-1, 7), end: at(-1, 7, 50) }],
      notes: [], invoiceId: 'i3', createdAt: ago(60),
    },
    {
      id: 'j9', number: 1046, customerId: 'c4', title: 'Grease trap service', description: '',
      address: '215 Main St, Springfield', start: at(29, 7), durationMins: 60, assigneeId: 'm-sam', status: 'scheduled',
      recurrence: 'monthly', seriesId: 's2', checklist: [], time: [], notes: [], createdAt: ago(60),
    },
  ];

  const estimates: Estimate[] = [
    {
      id: 'e1', number: 2017, customerId: 'c3', jobId: 'j4', title: 'Water heater replacement', status: 'approved',
      items: [
        { id: 'l1', description: '50 gal gas water heater (Bradford White)', quantity: 1, unitPrice: 1450 },
        { id: 'l2', description: 'Installation labor', quantity: 3, unitPrice: 115 },
        { id: 'l3', description: 'Expansion tank + fittings', quantity: 1, unitPrice: 165 },
        { id: 'l4', description: 'Haul away & disposal', quantity: 1, unitPrice: 75 },
      ],
      discount: 100, taxRate: business.taxRate, notes: 'Includes 6-year manufacturer warranty.',
      createdAt: ago(5), sentAt: ago(5), decidedAt: ago(4),
    },
    {
      id: 'e2', number: 2018, customerId: 'c5', title: 'Kitchen circuit upgrade', status: 'sent',
      items: [
        { id: 'l1', description: 'Dedicated 20A circuit for microwave', quantity: 1, unitPrice: 385 },
        { id: 'l2', description: 'GFCI outlets', quantity: 2, unitPrice: 48 },
      ],
      discount: 0, taxRate: business.taxRate, notes: '', createdAt: ago(1), sentAt: ago(1),
    },
    {
      id: 'e3', number: 2019, customerId: 'c2', title: 'Rooftop unit replacement (RTU-3)', status: 'draft',
      items: [{ id: 'l1', description: '5-ton packaged rooftop unit', quantity: 1, unitPrice: 8900 }],
      discount: 0, taxRate: business.taxRate, notes: '', createdAt: ago(0),
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'i1', number: 3102, customerId: 'c1', jobId: 'j7', title: 'Furnace ignitor replacement', status: 'paid',
      items: [
        { id: 'l1', description: 'Hot surface ignitor', quantity: 1, unitPrice: 68 },
        { id: 'l2', description: 'Labor', quantity: 1, unitPrice: 125 },
      ],
      discount: 0, taxRate: business.taxRate, notes: '', issuedAt: ago(9), dueAt: ago(-5), sentAt: ago(9),
    },
    {
      id: 'i2', number: 3103, customerId: 'c2', jobId: 'j6', title: 'Quarterly HVAC maintenance — Bldg B', status: 'sent',
      items: [
        { id: 'l1', description: 'Preventive maintenance visit (24 units)', quantity: 24, unitPrice: 45 },
        { id: 'l2', description: 'MERV-11 filters', quantity: 24, unitPrice: 14 },
      ],
      discount: 0, taxRate: business.taxRate, notes: 'Net 14.', issuedAt: ago(3), dueAt: ago(-11), sentAt: ago(3),
    },
    {
      id: 'i3', number: 3104, customerId: 'c4', jobId: 'j8', title: 'Grease trap service', status: 'draft',
      items: [{ id: 'l1', description: 'Monthly grease trap pump-out', quantity: 1, unitPrice: 225 }],
      discount: 0, taxRate: business.taxRate, notes: '', issuedAt: ago(1), dueAt: ago(-13),
    },
    {
      id: 'i4', number: 3099, customerId: 'c3', title: 'Emergency drain clearing', status: 'partial',
      items: [{ id: 'l1', description: 'After-hours main line clearing', quantity: 1, unitPrice: 420 }],
      discount: 0, taxRate: business.taxRate, notes: '', issuedAt: ago(30), dueAt: ago(16), sentAt: ago(30),
    },
  ];

  // Paid history over the past ~5 months so reports have a trend to show.
  const history: [string, string, number, number][] = [
    ['c2', 'Quarterly HVAC maintenance', 1620, 150],
    ['c4', 'Grease trap service', 225, 120],
    ['c1', 'AC capacitor replacement', 285, 128],
    ['c4', 'Grease trap service', 225, 92],
    ['c3', 'Sump pump install', 940, 85],
    ['c2', 'Boiler inspection', 480, 70],
    ['c4', 'Grease trap service', 225, 62],
    ['c1', 'Duct cleaning', 610, 48],
    ['c2', 'Rooftop unit repair', 1380, 40],
    ['c4', 'Grease trap service', 225, 31],
    ['c5', 'Panel inspection', 180, 24],
  ];
  history.forEach(([customerId, title, price, daysAgo], i) => {
    invoices.push({
      id: `ih${i}`, number: 3085 + i, customerId, title, status: 'paid',
      items: [{ id: 'l1', description: title, quantity: 1, unitPrice: price }],
      discount: 0, taxRate: business.taxRate, notes: '',
      issuedAt: ago(daysAgo), dueAt: ago(daysAgo - 14), sentAt: ago(daysAgo),
    });
  });

  const payments: Payment[] = [
    ...history.map(([, , price, daysAgo], i): Payment => ({
      id: `ph${i}`, invoiceId: `ih${i}`, amount: Math.round(price * (1 + business.taxRate / 100) * 100) / 100,
      method: i % 3 === 0 ? 'check' : 'card', reference: i % 3 === 0 ? `Check #${1100 + i}` : 'Online portal',
      receivedAt: ago(Math.max(daysAgo - 6, 1)),
    })),
    { id: 'p1', invoiceId: 'i1', amount: 208.92, method: 'card', reference: 'Online portal', receivedAt: ago(7) },
    { id: 'p2', invoiceId: 'i4', amount: 200, method: 'check', reference: 'Check #1182', receivedAt: ago(20) },
  ];

  const requests: BookingRequest[] = [
    {
      id: 'r1', name: 'Alicia Moore', email: 'alicia.moore@example.com', phone: '(555) 466-9013', address: '88 Birch St, Springfield',
      service: 'AC repair', details: 'Upstairs is warm, unit runs constantly. 12 years old.',
      preferredDate: addDays(today, 2).toISOString(), preferredWindow: 'morning', status: 'new', createdAt: at(0, 7, 42),
    },
    {
      id: 'r2', name: 'Greg Patel', email: 'gpatel@example.com', phone: '(555) 470-1287', address: '310 Lakeview Ave, Riverton',
      service: 'Water heater', details: 'No hot water since this morning. Pilot will not stay lit.',
      preferredDate: addDays(today, 1).toISOString(), preferredWindow: 'anytime', status: 'new', createdAt: at(-1, 18, 5),
    },
  ];

  return {
    business,
    team,
    customers,
    jobs,
    estimates,
    invoices,
    payments,
    requests,
    counters: { job: 1046, estimate: 2019, invoice: 3104 },
  };
}
