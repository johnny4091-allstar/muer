import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { confirm, HeaderButton, LineItemsTable, notify, TotalsCard } from '../../components/domain';
import { Badge, Button, Card, Empty, Row, Screen, SectionHeader } from '../../components/ui';
import { fmtDate } from '../../lib/dates';
import { balanceOf, currency, paidOn } from '../../lib/money';
import { documentHtml, shareDocument } from '../../lib/pdf';
import { invoiceDisplayStatus, useStore } from '../../store/store';
import { colors, invoiceTone, space, type } from '../../theme';

const methodLabel = { card: 'Card', cash: 'Cash', check: 'Check', bank: 'Bank transfer' } as const;

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inv = useStore((s) => s.invoices.find((i) => i.id === id));
  const allPayments = useStore((s) => s.payments);
  const customer = useStore((s) => s.customers.find((c) => c.id === inv?.customerId));
  const job = useStore((s) => s.jobs.find((j) => j.id === inv?.jobId));
  const estimate = useStore((s) => s.estimates.find((e) => e.id === inv?.estimateId));
  const business = useStore((s) => s.business);
  const a = useStore.getState();
  const [busy, setBusy] = useState(false);

  if (!inv) {
    return (
      <Screen>
        <Empty icon="receipt-outline" title="Invoice not found" />
      </Screen>
    );
  }

  const payments = allPayments.filter((p) => p.invoiceId === inv.id).sort((x, y) => y.receivedAt.localeCompare(x.receivedAt));
  const paid = paidOn(inv, allPayments);
  const balance = balanceOf(inv, allPayments);
  const status = invoiceDisplayStatus(inv);

  const share = async (markSent: boolean) => {
    setBusy(true);
    try {
      await shareDocument(documentHtml({ kind: 'Invoice', doc: inv, business, customer, paid }), `Invoice-${inv.number}.pdf`);
      if (markSent) a.sendInvoice(inv.id);
    } catch (e) {
      notify('Could not create PDF', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  let footer: React.ReactNode = null;
  if (inv.status === 'draft') {
    footer = <Button title="Send invoice" icon="send" loading={busy} onPress={() => share(true)} style={{ flex: 1 }} />;
  } else if (inv.status === 'sent' || inv.status === 'partial') {
    footer = (
      <>
        <Button title="Remind" icon="notifications-outline" variant="secondary" loading={busy} onPress={() => share(true)} style={{ flex: 1 }} />
        <Button title="Record payment" icon="cash-outline" onPress={() => router.push({ pathname: '/invoice/pay', params: { id: inv.id } })} style={{ flex: 1.3 }} />
      </>
    );
  }

  return (
    <Screen footer={footer}>
      <Stack.Screen
        options={{
          title: `Invoice #${inv.number}`,
          headerRight:
            inv.status === 'draft'
              ? () => <HeaderButton icon="create-outline" label="Edit invoice" onPress={() => router.push({ pathname: '/invoice/edit', params: { id: inv.id } })} />
              : undefined,
        }}
      />
      <Badge {...invoiceTone[status]} />
      <Text style={[type.title, { marginTop: space(2) }]}>{inv.title}</Text>
      <Text style={[type.small, { marginTop: 4 }]}>
        Issued {fmtDate(inv.issuedAt)} · Due {fmtDate(inv.dueAt)}
        {inv.sentAt ? ` · Sent ${fmtDate(inv.sentAt)}` : ''}
      </Text>

      {inv.status !== 'draft' && inv.status !== 'void' ? (
        <Card style={{ marginTop: space(4), alignItems: 'center', paddingVertical: space(5) }}>
          <Text style={type.small}>{balance > 0 ? 'Balance due' : 'Paid in full'}</Text>
          <Text style={{ fontSize: 34, fontWeight: '700', color: balance > 0 ? (status === 'overdue' ? colors.danger : colors.text) : colors.success, letterSpacing: -0.5 }}>
            {currency(balance > 0 ? balance : paid)}
          </Text>
        </Card>
      ) : null}

      <Card style={{ marginTop: space(3), paddingVertical: space(1) }}>
        {customer ? <Row icon="person-outline" title={customer.name} subtitle={customer.email} onPress={() => router.push(`/customer/${customer.id}`)} last={!job && !estimate} /> : null}
        {job ? <Row icon="construct-outline" title={`Job #${job.number}`} subtitle={job.title} onPress={() => router.push(`/job/${job.id}`)} last={!estimate} /> : null}
        {estimate ? <Row icon="document-text-outline" title={`From estimate #${estimate.number}`} onPress={() => router.push(`/estimate/${estimate.id}`)} last /> : null}
      </Card>

      <SectionHeader title="Line items" />
      <LineItemsTable items={inv.items} />
      <TotalsCard pricing={inv} paid={inv.status === 'draft' ? undefined : paid} />

      {payments.length ? (
        <>
          <SectionHeader title="Payment history" />
          <Card style={{ paddingVertical: space(1) }}>
            {payments.map((p, i) => (
              <Row
                key={p.id}
                icon="checkmark-circle-outline"
                title={currency(p.amount)}
                subtitle={`${methodLabel[p.method]}${p.reference ? ` · ${p.reference}` : ''} · ${fmtDate(p.receivedAt)}`}
                last={i === payments.length - 1}
              />
            ))}
          </Card>
        </>
      ) : null}

      {inv.notes ? (
        <>
          <SectionHeader title="Notes" />
          <Card>
            <Text style={type.body}>{inv.notes}</Text>
          </Card>
        </>
      ) : null}

      <View style={{ gap: space(3), marginTop: space(4) }}>
        <Button title="Share PDF" icon="share-outline" variant="secondary" loading={busy} onPress={() => share(false)} />
        {inv.status !== 'void' && inv.status !== 'paid' && !payments.length ? (
          <Button
            title="Void invoice"
            variant="danger"
            onPress={() => confirm('Void invoice?', 'It will no longer count toward outstanding balances.', () => a.voidInvoice(inv.id), 'Void')}
          />
        ) : null}
      </View>
    </Screen>
  );
}
