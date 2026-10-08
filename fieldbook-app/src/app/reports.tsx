import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Card, Screen, SectionHeader, Stat } from '../components/ui';
import { daysBetween } from '../lib/dates';
import { balanceOf, currency, totals } from '../lib/money';
import { useStore } from '../store/store';
import { colors, space, type } from '../theme';

const compact = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `$${Math.round(n)}`;

export default function Reports() {
  const jobs = useStore((s) => s.jobs);
  const invoices = useStore((s) => s.invoices);
  const payments = useStore((s) => s.payments);
  const estimates = useStore((s) => s.estimates);
  const customers = useStore((s) => s.customers);
  const team = useStore((s) => s.team);

  const now = new Date();

  // Revenue collected per month, last 6 months (single series → one hue, no legend).
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const revenue = months.map((m) => {
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return payments
      .filter((p) => new Date(p.receivedAt) >= m && new Date(p.receivedAt) < next)
      .reduce((s, p) => s + p.amount, 0);
  });
  const [sel, setSel] = useState(5);

  // Receivables aging by days past due.
  const open = invoices.filter((i) => i.status === 'sent' || i.status === 'partial');
  const buckets = [
    { label: 'Current', test: (d: number) => d <= 0 },
    { label: '1–30 days', test: (d: number) => d > 0 && d <= 30 },
    { label: '31–60 days', test: (d: number) => d > 30 && d <= 60 },
    { label: '60+ days', test: (d: number) => d > 60 },
  ].map((b) => ({
    label: b.label,
    amount: open.filter((i) => b.test(daysBetween(new Date(i.dueAt), now))).reduce((s, i) => s + balanceOf(i, payments), 0),
  }));
  const agingMax = Math.max(1, ...buckets.map((b) => b.amount));
  const outstanding = buckets.reduce((s, b) => s + b.amount, 0);

  const billed = invoices.filter((i) => i.status !== 'void' && i.status !== 'draft');
  const avgInvoice = billed.length ? billed.reduce((s, i) => s + totals(i).total, 0) / billed.length : 0;
  const decided = estimates.filter((e) => ['approved', 'declined', 'converted'].includes(e.status));
  const approval = decided.length ? Math.round((decided.filter((e) => e.status !== 'declined').length / decided.length) * 100) : 0;
  const completed30 = jobs.filter((j) => j.status === 'completed' && daysBetween(new Date(j.start), now) <= 30).length;

  const topCustomers = customers
    .map((c) => ({
      c,
      paid: payments
        .filter((p) => invoices.some((i) => i.id === p.invoiceId && i.customerId === c.id))
        .reduce((s, p) => s + p.amount, 0),
    }))
    .filter((x) => x.paid > 0)
    .sort((a, b) => b.paid - a.paid)
    .slice(0, 5);

  const techs = team
    .filter((m) => m.role === 'technician')
    .map((m) => {
      const mine = jobs.filter((j) => j.assigneeId === m.id && j.status === 'completed' && daysBetween(new Date(j.start), now) <= 30);
      const hours = mine.flatMap((j) => j.time).filter((t) => t.memberId === m.id && t.end)
        .reduce((s, t) => s + (new Date(t.end!).getTime() - new Date(t.start).getTime()) / 3_600_000, 0);
      return { m, jobs: mine.length, hours };
    });

  const maxRev = Math.max(1, ...revenue);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: space(3) }}>
        <Stat label="Jobs completed (30d)" value={String(completed30)} />
        <Stat label="Avg. invoice" value={currency(avgInvoice)} />
      </View>
      <View style={{ flexDirection: 'row', gap: space(3), marginTop: space(3) }}>
        <Stat label="Estimate approval" value={decided.length ? `${approval}%` : '—'} />
        <Stat label="Outstanding" value={currency(outstanding)} />
      </View>

      <SectionHeader title="Revenue collected" />
      <Card>
        <Text style={type.small}>{months[sel].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
        <Text style={s.headline}>{currency(revenue[sel])}</Text>
        <View style={s.chart} accessibilityRole="image" accessibilityLabel={`Revenue by month: ${months.map((m, i) => `${m.toLocaleDateString('en-US', { month: 'short' })} ${currency(revenue[i])}`).join(', ')}`}>
          {revenue.map((v, i) => (
            <Pressable key={i} onPress={() => setSel(i)} style={s.col} hitSlop={4}>
              <Text style={[s.barValue, i !== sel && { opacity: 0 }]}>{compact(v)}</Text>
              <View style={s.track}>
                <View
                  style={[
                    s.bar,
                    { height: `${Math.max((v / maxRev) * 100, v ? 3 : 0)}%`, backgroundColor: i === sel ? colors.brand : '#9CC4B2' },
                  ]}
                />
              </View>
              <Text style={[s.axis, i === sel && { color: colors.text, fontWeight: '700' }]}>
                {months[i].toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[type.small, { marginTop: space(2) }]}>Tap a month to see its total.</Text>
      </Card>

      <SectionHeader title="Receivables aging" />
      <Card>
        {buckets.map((b, i) => (
          <View key={b.label} style={{ marginBottom: i < buckets.length - 1 ? space(3) : 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={type.body}>{b.label}</Text>
              <Text style={type.h3}>{currency(b.amount)}</Text>
            </View>
            <View style={s.hTrack}>
              <View style={[s.hBar, { width: `${(b.amount / agingMax) * 100}%`, backgroundColor: i === 0 ? colors.brand : i === 1 ? colors.warn : colors.danger }]} />
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader title="Technicians · last 30 days" />
      <Card>
        {techs.map(({ m, jobs: n, hours }) => (
          <View key={m.id} style={s.listRow}>
            <Avatar name={m.name} color={m.color} size={28} />
            <Text style={[type.body, { flex: 1 }]}>{m.name}</Text>
            <Text style={type.small}>
              {n} job{n === 1 ? '' : 's'} · {hours.toFixed(1)} h
            </Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="Top customers by payments" />
      <Card>
        {topCustomers.length ? (
          topCustomers.map(({ c, paid }) => (
            <View key={c.id} style={s.listRow}>
              <Text style={[type.body, { flex: 1 }]}>{c.name}</Text>
              <Text style={type.h3}>{currency(paid)}</Text>
            </View>
          ))
        ) : (
          <Text style={type.small}>No payments recorded yet.</Text>
        )}
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  headline: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  chart: { flexDirection: 'row', height: 170, marginTop: space(4), gap: 2 },
  col: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 4 },
  track: { flex: 1, width: '62%', justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: colors.border },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  hTrack: { height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  hBar: { height: 8, borderRadius: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: 8 },
});
