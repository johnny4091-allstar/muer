import type { Invoice, LineItem, Payment, Pricing } from '../store/types';

const round = (n: number) => Math.round(n * 100) / 100;

export const lineTotal = (item: LineItem) => round(item.quantity * item.unitPrice);

export interface Totals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export function totals(p: Pricing): Totals {
  const subtotal = round(p.items.reduce((sum, i) => sum + lineTotal(i), 0));
  const discount = round(Math.min(Math.max(p.discount, 0), subtotal));
  const taxable = round(subtotal - discount);
  const tax = round((taxable * Math.max(p.taxRate, 0)) / 100);
  return { subtotal, discount, taxable, tax, total: round(taxable + tax) };
}

export const paidOn = (invoice: Invoice, payments: Payment[]) =>
  round(payments.filter((p) => p.invoiceId === invoice.id).reduce((s, p) => s + p.amount, 0));

export const balanceOf = (invoice: Invoice, payments: Payment[]) =>
  round(Math.max(totals(invoice).total - paidOn(invoice, payments), 0));

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const currency = (n: number) => fmt.format(n);

/** Parses user-typed money/number input; returns 0 for empty or invalid input. */
export function parseAmount(text: string): number {
  const n = parseFloat(text.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
