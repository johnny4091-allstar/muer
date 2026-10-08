import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Business, Customer, Estimate, Invoice } from '../store/types';
import { fmtDate } from './dates';
import { currency, lineTotal, totals } from './money';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function documentHtml(opts: {
  kind: 'Estimate' | 'Invoice';
  doc: Estimate | Invoice;
  business: Business;
  customer?: Customer;
  paid?: number;
}) {
  const { kind, doc, business, customer, paid = 0 } = opts;
  const t = totals(doc);
  const isInvoice = kind === 'Invoice';
  const inv = doc as Invoice;
  const dateLine = isInvoice
    ? `<div>Issued ${fmtDate(inv.issuedAt)}</div><div>Due ${fmtDate(inv.dueAt)}</div>`
    : `<div>Prepared ${fmtDate((doc as Estimate).createdAt)}</div>`;

  const rows = doc.items
    .map(
      (i) => `<tr>
        <td>${esc(i.description || 'Item')}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${currency(i.unitPrice)}</td>
        <td class="num">${currency(lineTotal(i))}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #16201B; padding: 40px; font-size: 13px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 22px; font-weight: 700; color: #1F6B4F; }
  .muted { color: #5E6B64; line-height: 1.5; }
  h1 { font-size: 28px; margin: 0; text-align: right; letter-spacing: -0.5px; }
  .meta { text-align: right; color: #5E6B64; line-height: 1.6; margin-top: 4px; }
  .billto { margin: 32px 0 24px; }
  .label { text-transform: uppercase; font-size: 10px; letter-spacing: 1px; color: #8E9A93; font-weight: 700; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8E9A93; border-bottom: 2px solid #16201B; padding: 8px 0; }
  td { padding: 10px 0; border-bottom: 1px solid #E3E6E1; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; padding-left: 12px; }
  .totals { margin-left: auto; width: 280px; margin-top: 16px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .grand { font-size: 17px; font-weight: 700; border-top: 2px solid #16201B; margin-top: 6px; padding-top: 8px !important; }
  .notes { margin-top: 32px; }
  .footer { margin-top: 48px; color: #8E9A93; font-size: 11px; text-align: center; }
</style></head><body>
  <div class="top">
    <div>
      <div class="brand">${esc(business.name)}</div>
      <div class="muted">${esc(business.address)}<br/>${esc(business.phone)} · ${esc(business.email)}</div>
    </div>
    <div>
      <h1>${kind}</h1>
      <div class="meta"><div><strong>#${doc.number}</strong></div>${dateLine}</div>
    </div>
  </div>
  <div class="billto">
    <div class="label">${isInvoice ? 'Bill to' : 'Prepared for'}</div>
    <div><strong>${esc(customer?.name ?? '')}</strong></div>
    <div class="muted">${esc(customer?.address ?? '')}<br/>${esc(customer?.email ?? '')}</div>
  </div>
  <div class="label">${esc(doc.title)}</div>
  <table>
    <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${currency(t.subtotal)}</span></div>
    ${t.discount ? `<div><span>Discount</span><span>– ${currency(t.discount)}</span></div>` : ''}
    <div><span>Tax (${doc.taxRate}%)</span><span>${currency(t.tax)}</span></div>
    <div class="grand"><span>Total</span><span>${currency(t.total)}</span></div>
    ${
      isInvoice && paid
        ? `<div><span>Paid</span><span>– ${currency(paid)}</span></div>
           <div class="grand"><span>Balance due</span><span>${currency(Math.max(t.total - paid, 0))}</span></div>`
        : ''
    }
  </div>
  ${doc.notes ? `<div class="notes"><div class="label">Notes</div><div class="muted">${esc(doc.notes)}</div></div>` : ''}
  <div class="footer">Thank you for your business.</div>
</body></html>`;
}

/** Renders the document to PDF and opens the system share sheet (print dialog on web). */
export async function shareDocument(html: string, filename: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}
