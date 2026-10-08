import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { confirm, HeaderButton, LineItemsTable, notify, TotalsCard } from '../../components/domain';
import { Badge, Button, Card, Empty, Row, Screen, SectionHeader } from '../../components/ui';
import { fmtDate } from '../../lib/dates';
import { documentHtml, shareDocument } from '../../lib/pdf';
import { useStore } from '../../store/store';
import { colors, estimateTone, space, type } from '../../theme';

export default function EstimateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const est = useStore((s) => s.estimates.find((e) => e.id === id));
  const customer = useStore((s) => s.customers.find((c) => c.id === est?.customerId));
  const job = useStore((s) => s.jobs.find((j) => j.id === est?.jobId));
  const business = useStore((s) => s.business);
  const a = useStore.getState();
  const [busy, setBusy] = useState(false);

  if (!est) {
    return (
      <Screen>
        <Empty icon="document-text-outline" title="Estimate not found" />
      </Screen>
    );
  }

  const share = async (markSent: boolean) => {
    setBusy(true);
    try {
      await shareDocument(documentHtml({ kind: 'Estimate', doc: est, business, customer }), `Estimate-${est.number}.pdf`);
      if (markSent) a.sendEstimate(est.id);
    } catch (e) {
      notify('Could not create PDF', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const convert = () => router.replace(`/invoice/${a.convertEstimate(est.id)}`);
  const editable = est.status !== 'converted';

  let footer: React.ReactNode = null;
  if (est.status === 'draft' || est.status === 'declined') {
    footer = <Button title={est.status === 'draft' ? 'Send for approval' : 'Revise & resend'} icon="send" loading={busy} onPress={() => share(true)} style={{ flex: 1 }} />;
  } else if (est.status === 'sent') {
    footer = (
      <>
        <Button title="Declined" variant="secondary" onPress={() => a.decideEstimate(est.id, 'declined')} style={{ flex: 1 }} />
        <Button title="Approved" icon="checkmark" onPress={() => a.decideEstimate(est.id, 'approved')} style={{ flex: 1 }} />
      </>
    );
  } else if (est.status === 'approved') {
    footer = <Button title="Convert to invoice" icon="receipt-outline" onPress={convert} style={{ flex: 1 }} />;
  } else if (est.invoiceId) {
    footer = <Button title="View invoice" variant="secondary" onPress={() => router.push(`/invoice/${est.invoiceId}`)} style={{ flex: 1 }} />;
  }

  return (
    <Screen footer={footer}>
      <Stack.Screen
        options={{
          title: `Estimate #${est.number}`,
          headerRight: editable
            ? () => <HeaderButton icon="create-outline" label="Edit estimate" onPress={() => router.push({ pathname: '/estimate/edit', params: { id: est.id } })} />
            : undefined,
        }}
      />
      <Badge {...estimateTone[est.status]} />
      <Text style={[type.title, { marginTop: space(2) }]}>{est.title}</Text>
      <Text style={[type.small, { marginTop: 4 }]}>
        Created {fmtDate(est.createdAt)}
        {est.sentAt ? ` · Sent ${fmtDate(est.sentAt)}` : ''}
        {est.decidedAt ? ` · ${est.status === 'declined' ? 'Declined' : 'Approved'} ${fmtDate(est.decidedAt)}` : ''}
      </Text>

      <Card style={{ marginTop: space(4), paddingVertical: space(1) }}>
        {customer ? <Row icon="person-outline" title={customer.name} subtitle={customer.email} onPress={() => router.push(`/customer/${customer.id}`)} last={!job} /> : null}
        {job ? <Row icon="construct-outline" title={`Job #${job.number}`} subtitle={job.title} onPress={() => router.push(`/job/${job.id}`)} last /> : null}
      </Card>

      {est.status === 'sent' ? (
        <Card style={{ backgroundColor: colors.infoSoft, borderColor: colors.infoSoft }}>
          <Text style={[type.body, { color: colors.info }]}>Waiting on the customer. Record their decision below once they respond.</Text>
        </Card>
      ) : null}

      <SectionHeader title="Line items" />
      <LineItemsTable items={est.items} />
      <TotalsCard pricing={est} />

      {est.notes ? (
        <>
          <SectionHeader title="Notes" />
          <Card>
            <Text style={type.body}>{est.notes}</Text>
          </Card>
        </>
      ) : null}

      <View style={{ gap: space(3), marginTop: space(4) }}>
        <Button title="Share PDF" icon="share-outline" variant="secondary" loading={busy} onPress={() => share(false)} />
        {est.status === 'approved' && !job ? (
          <Button
            title="Schedule the work"
            icon="calendar-outline"
            variant="secondary"
            onPress={() => router.push({ pathname: '/job/new', params: { customerId: est.customerId } })}
          />
        ) : null}
        {est.status === 'draft' ? (
          <Button
            title="Delete estimate"
            variant="danger"
            onPress={() => confirm('Delete estimate?', 'This cannot be undone.', () => { a.deleteEstimate(est.id); router.back(); }, 'Delete')}
          />
        ) : null}
      </View>
    </Screen>
  );
}
