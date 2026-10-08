import type { EstimateStatus, InvoiceStatus, JobStatus, RequestStatus } from './store/types';

export const colors = {
  bg: '#F6F7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2EF',
  border: '#E3E6E1',
  text: '#16201B',
  textMuted: '#5E6B64',
  textFaint: '#8E9A93',
  brand: '#1F6B4F',
  brandDark: '#14503A',
  brandSoft: '#E5F0EA',
  accent: '#E8A33D',
  danger: '#C2410C',
  dangerSoft: '#FCEDE5',
  info: '#2563EB',
  infoSoft: '#E6EEFD',
  warn: '#B7791F',
  warnSoft: '#FBF1DF',
  success: '#15803D',
  successSoft: '#E3F4E8',
  neutralSoft: '#EEF0ED',
};

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const space = (n: number) => n * 4;

export const type = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textMuted },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
};

export const shadow = {
  shadowColor: '#0B1A12',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

type Tone = { fg: string; bg: string; label: string };

export const jobTone: Record<JobStatus, Tone> = {
  scheduled: { fg: colors.info, bg: colors.infoSoft, label: 'Scheduled' },
  in_progress: { fg: colors.warn, bg: colors.warnSoft, label: 'In progress' },
  completed: { fg: colors.success, bg: colors.successSoft, label: 'Completed' },
  cancelled: { fg: colors.textMuted, bg: colors.neutralSoft, label: 'Cancelled' },
};

export const estimateTone: Record<EstimateStatus, Tone> = {
  draft: { fg: colors.textMuted, bg: colors.neutralSoft, label: 'Draft' },
  sent: { fg: colors.info, bg: colors.infoSoft, label: 'Awaiting approval' },
  approved: { fg: colors.success, bg: colors.successSoft, label: 'Approved' },
  declined: { fg: colors.danger, bg: colors.dangerSoft, label: 'Declined' },
  converted: { fg: colors.brand, bg: colors.brandSoft, label: 'Invoiced' },
};

export const invoiceTone: Record<InvoiceStatus | 'overdue', Tone> = {
  draft: { fg: colors.textMuted, bg: colors.neutralSoft, label: 'Draft' },
  sent: { fg: colors.info, bg: colors.infoSoft, label: 'Sent' },
  partial: { fg: colors.warn, bg: colors.warnSoft, label: 'Partially paid' },
  paid: { fg: colors.success, bg: colors.successSoft, label: 'Paid' },
  void: { fg: colors.textMuted, bg: colors.neutralSoft, label: 'Void' },
  overdue: { fg: colors.danger, bg: colors.dangerSoft, label: 'Overdue' },
};

export const requestTone: Record<RequestStatus, Tone> = {
  new: { fg: colors.accent, bg: '#FCF3E4', label: 'New' },
  scheduled: { fg: colors.success, bg: colors.successSoft, label: 'Scheduled' },
  declined: { fg: colors.textMuted, bg: colors.neutralSoft, label: 'Declined' },
};
