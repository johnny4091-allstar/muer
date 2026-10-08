import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { HeaderButton } from '../../components/domain';
import { PageHeader } from '../../components/PageHeader';
import { Badge, Button, Card, Chips, Empty, Screen, Segmented, Stat } from '../../components/ui';
import { fmtDate } from '../../lib/dates';
import { balanceOf, currency, totals } from '../../lib/money';
import { invoiceDisplayStatus, isOverdue, useStore } from '../../store/store';
import type { EstimateStatus } from '../../store/types';
import { colors, estimateTone, invoiceTone, space, type } from '../../theme';

type Tab = 'invoices' | 'estimates' | 'payments';
type InvFilter = 'open' | 'overdue' | 'draft' | 'paid' | 'all';

export default function Money() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab ?? 'invoices');
  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);

  const invoices = useStore((s) => s.invoices);
  const estimates = useStore((s) => s.estimates);
  const payments = useStore((s) => s.payments);

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Money"
        right={
          <HeaderButton
            icon="add"
            label={tab === 'estimates' ? 'New estimate' : 'New invoice'}
            onPress={() => router.push(tab === 'estimates' ? '/estimate/edit' : '/invoice/edit')}
          />
        }
      />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'invoices', label: 'Invoices', count: invoices.length },
          { value: 'estimates', label: 'Estimates', count: estimates.length },
          { value: 'payments', label: 'Payments' },
        ]}
      />
      {tab === 'invoices' ? <Invoices /> : null}
      {tab === 'estimates' ? <Estimates /> : null}
      {tab === 'payments' ? <Payments /> : null}
      <Button
        title="View business reports"
        icon="bar-chart-outline"
        variant="secondary"
        onPress={() => router.push('/reports')}
        style={{ marginTop: space(4) }}
      />
    </Screen>
  );
}

function Invoices() {
  const invoices = useStore((s) => s.invoices);
  const payments = useStore((s) => s.payments);
  const customers = useStore((s) => s.customers);
  const [filter, setFilter] = useState<InvFilter>('open');

  const open = invoices.filter((i) => i.status === 'sent' || i.status === 'partial');
  const outstanding = open.reduce((s, i) => s + balanceOf(i, payments), 0);
  const overdueAmt = open.filter((i) => isOverdue(i)).reduce((s, i) => s + balanceOf(i, payments), 0);

  const list = invoices
    .filter((i) => {
      switch (filter) {
        case 'open':
          return i.status === 'sent' || i.status === 'partial';
        case 'overdue':
          return isOverdue(i);
        case 'draft':
          return i.status === 'draft';
        case 'paid':
          return i.status === 'paid';
        default:
          return true;
      }
    })
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: space(3), marginBottom: space(3) }}>
        <Stat label="Outstanding" value={currency(outstanding)} />
        <Stat label="Overdue" value={currency(overdueAmt)} tone={overdueAmt ? colors.danger : colors.text} />
      </View>
      <View style={{ marginBottom: space(3) }}>
        <Chips<InvFilter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'draft', label: 'Drafts' },
            { value: 'paid', label: 'Paid' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      {list.length ? (
        list.map((i) => {
          const c = customers.find((x) => x.id === i.customerId);
          const status = invoiceDisplayStatus(i);
          const bal = balanceOf(i, payments);
          return (
            <Card key={i.id} onPress={() => router.push(`/invoice/${i.id}`)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={type.small}>#{i.number} · Due {fmtDate(i.dueAt)}</Text>
                <Badge {...invoiceTone[status]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, gap: space(3) }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.h3} numberOfLines={1}>
                    {c?.name}
                  </Text>
                  <Text style={type.small} numberOfLines={1}>
                    {i.title}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={type.h3}>{currency(totals(i).total)}</Text>
                  {bal > 0 && i.status !== 'draft' && i.status !== 'void' ? (
                    <Text style={[type.small, { color: status === 'overdue' ? colors.danger : colors.textMuted }]}>
                      {currency(bal)} due
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          );
        })
      ) : (
        <Empty icon="receipt-outline" title="No invoices" body="Nothing matches this filter." />
      )}
    </View>
  );
}

function Estimates() {
  const estimates = useStore((s) => s.estimates);
  const customers = useStore((s) => s.customers);
  const [filter, setFilter] = useState<EstimateStatus | 'all'>('all');
  const list = estimates
    .filter((e) => filter === 'all' || e.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pipeline = estimates.filter((e) => e.status === 'sent').reduce((s, e) => s + totals(e).total, 0);
  const decided = estimates.filter((e) => ['approved', 'declined', 'converted'].includes(e.status));
  const winRate = decided.length ? Math.round((decided.filter((e) => e.status !== 'declined').length / decided.length) * 100) : 0;

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: space(3), marginBottom: space(3) }}>
        <Stat label="Awaiting approval" value={currency(pipeline)} />
        <Stat label="Approval rate" value={decided.length ? `${winRate}%` : '—'} />
      </View>
      <View style={{ marginBottom: space(3) }}>
        <Chips<EstimateStatus | 'all'>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'draft', label: 'Drafts' },
            { value: 'sent', label: 'Awaiting' },
            { value: 'approved', label: 'Approved' },
            { value: 'converted', label: 'Invoiced' },
            { value: 'declined', label: 'Declined' },
          ]}
        />
      </View>
      {list.length ? (
        list.map((e) => {
          const c = customers.find((x) => x.id === e.customerId);
          return (
            <Card key={e.id} onPress={() => router.push(`/estimate/${e.id}`)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={type.small}>#{e.number} · {fmtDate(e.createdAt)}</Text>
                <Badge {...estimateTone[e.status]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, gap: space(3) }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.h3} numberOfLines={1}>
                    {c?.name}
                  </Text>
                  <Text style={type.small} numberOfLines={1}>
                    {e.title}
                  </Text>
                </View>
                <Text style={type.h3}>{currency(totals(e).total)}</Text>
              </View>
            </Card>
          );
        })
      ) : (
        <Empty icon="document-text-outline" title="No estimates" />
      )}
    </View>
  );
}

const methodLabel = { card: 'Card', cash: 'Cash', check: 'Check', bank: 'Bank transfer' } as const;

function Payments() {
  const payments = useStore((s) => s.payments);
  const invoices = useStore((s) => s.invoices);
  const customers = useStore((s) => s.customers);
  const list = [...payments].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const total = payments.reduce((s, p) => s + p.amount, 0);
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: space(3), marginBottom: space(3) }}>
        <Stat label="Total received" value={currency(total)} tone={colors.success} />
        <Stat label="Payments" value={String(payments.length)} />
      </View>
      {list.length ? (
        list.map((p) => {
          const inv = invoices.find((i) => i.id === p.invoiceId);
          const c = customers.find((x) => x.id === inv?.customerId);
          return (
            <Card key={p.id} onPress={inv ? () => router.push(`/invoice/${inv.id}`) : undefined}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.h3}>{c?.name ?? 'Customer'}</Text>
                  <Text style={type.small}>
                    {methodLabel[p.method]}
                    {p.reference ? ` · ${p.reference}` : ''} · Invoice #{inv?.number}
                  </Text>
                  <Text style={type.small}>{fmtDate(p.receivedAt)}</Text>
                </View>
                <Text style={[type.h3, { color: colors.success }]}>+{currency(p.amount)}</Text>
              </View>
            </Card>
          );
        })
      ) : (
        <Empty icon="wallet-outline" title="No payments yet" />
      )}
    </View>
  );
}
