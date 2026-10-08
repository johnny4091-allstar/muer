import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { confirm, HeaderButton, JobCard } from '../../components/domain';
import { Avatar, Badge, Button, Card, Empty, Row, Screen, SectionHeader, Stat } from '../../components/ui';
import { fmtDate } from '../../lib/dates';
import { balanceOf, currency, totals } from '../../lib/money';
import { invoiceDisplayStatus, useStore } from '../../store/store';
import { colors, estimateTone, invoiceTone, space, type } from '../../theme';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customer = useStore((s) => s.customers.find((c) => c.id === id));
  const allJobs = useStore((s) => s.jobs);
  const allInvoices = useStore((s) => s.invoices);
  const allEstimates = useStore((s) => s.estimates);
  const payments = useStore((s) => s.payments);
  const deleteCustomer = useStore((s) => s.deleteCustomer);

  if (!customer) {
    return (
      <Screen>
        <Empty icon="person-outline" title="Customer not found" />
      </Screen>
    );
  }

  const jobs = allJobs.filter((j) => j.customerId === id).sort((a, b) => b.start.localeCompare(a.start));
  const invoices = allInvoices.filter((i) => i.customerId === id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const estimates = allEstimates.filter((e) => e.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lifetime = payments.filter((p) => invoices.some((i) => i.id === p.invoiceId)).reduce((s, p) => s + p.amount, 0);
  const owed = invoices.filter((i) => i.status === 'sent' || i.status === 'partial').reduce((s, i) => s + balanceOf(i, payments), 0);
  const upcoming = jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress').reverse();
  const past = jobs.filter((j) => j.status === 'completed').slice(0, 5);
  const hasHistory = jobs.length + invoices.length + estimates.length > 0;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <HeaderButton icon="create-outline" label="Edit customer" onPress={() => router.push({ pathname: '/customer/new', params: { id: customer.id } })} />
          ),
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(3), marginBottom: space(4) }}>
        <Avatar name={customer.name} size={56} color={colors.brandDark} />
        <View style={{ flex: 1 }}>
          <Text style={type.title}>{customer.name}</Text>
          <Text style={type.small}>Customer since {fmtDate(customer.createdAt)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space(3) }}>
        <Stat label="Lifetime paid" value={currency(lifetime)} tone={colors.success} />
        <Stat label="Balance owed" value={currency(owed)} tone={owed ? colors.danger : colors.text} />
      </View>

      <Card style={{ marginTop: space(4), paddingVertical: space(1) }}>
        {customer.phone ? (
          <Row icon="call-outline" title={customer.phone} subtitle="Call" onPress={() => Linking.openURL(`tel:${customer.phone.replace(/[^\d+]/g, '')}`)} />
        ) : null}
        {customer.email ? (
          <Row icon="mail-outline" title={customer.email} subtitle="Email" onPress={() => Linking.openURL(`mailto:${customer.email}`)} />
        ) : null}
        {customer.address ? (
          <Row
            icon="location-outline"
            title={customer.address}
            subtitle="Directions"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`)}
          />
        ) : null}
        {customer.notes ? <Row icon="information-circle-outline" title="Notes" subtitle={customer.notes} last /> : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: space(3), marginTop: space(2) }}>
        <Button title="New job" icon="add" onPress={() => router.push({ pathname: '/job/new', params: { customerId: customer.id } })} style={{ flex: 1 }} />
        <Button
          title="Estimate"
          icon="document-text-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/estimate/edit', params: { customerId: customer.id } })}
          style={{ flex: 1 }}
        />
      </View>

      <SectionHeader title="Upcoming jobs" />
      {upcoming.length ? upcoming.map((j) => <JobCard key={j.id} job={j} showDate />) : <Card><Text style={type.small}>No upcoming visits.</Text></Card>}

      {past.length ? (
        <>
          <SectionHeader title="Recent work" />
          {past.map((j) => (
            <JobCard key={j.id} job={j} showDate />
          ))}
        </>
      ) : null}

      {estimates.length ? (
        <>
          <SectionHeader title="Estimates" />
          <Card style={{ paddingVertical: space(1) }}>
            {estimates.map((e, i) => (
              <Row
                key={e.id}
                title={`#${e.number} · ${e.title}`}
                subtitle={currency(totals(e).total)}
                right={<Badge {...estimateTone[e.status]} />}
                onPress={() => router.push(`/estimate/${e.id}`)}
                last={i === estimates.length - 1}
              />
            ))}
          </Card>
        </>
      ) : null}

      {invoices.length ? (
        <>
          <SectionHeader title="Invoices" />
          <Card style={{ paddingVertical: space(1) }}>
            {invoices.map((inv, i) => (
              <Row
                key={inv.id}
                title={`#${inv.number} · ${inv.title}`}
                subtitle={`${currency(totals(inv).total)} · due ${fmtDate(inv.dueAt)}`}
                right={<Badge {...invoiceTone[invoiceDisplayStatus(inv)]} />}
                onPress={() => router.push(`/invoice/${inv.id}`)}
                last={i === invoices.length - 1}
              />
            ))}
          </Card>
        </>
      ) : null}

      {!hasHistory ? (
        <Button
          title="Delete customer"
          variant="danger"
          style={{ marginTop: space(6) }}
          onPress={() =>
            confirm('Delete customer?', `${customer.name} will be removed.`, () => {
              deleteCustomer(customer.id);
              router.back();
            }, 'Delete')
          }
        />
      ) : null}
    </Screen>
  );
}
