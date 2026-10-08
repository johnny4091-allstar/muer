import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { HeaderButton } from '../../components/domain';
import { PageHeader } from '../../components/PageHeader';
import { Avatar, Button, Card, Empty, Screen, styles as ui } from '../../components/ui';
import { balanceOf, currency } from '../../lib/money';
import { useStore } from '../../store/store';
import { colors, space, type } from '../../theme';

export default function Customers() {
  const customers = useStore((s) => s.customers);
  const invoices = useStore((s) => s.invoices);
  const payments = useStore((s) => s.payments);
  const jobs = useStore((s) => s.jobs);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return customers
      .filter((c) => !term || `${c.name} ${c.email} ${c.phone} ${c.address}`.toLowerCase().includes(term))
      .map((c) => {
        const owed = invoices
          .filter((i) => i.customerId === c.id && (i.status === 'sent' || i.status === 'partial'))
          .reduce((s, i) => s + balanceOf(i, payments), 0);
        const jobCount = jobs.filter((j) => j.customerId === c.id).length;
        return { c, owed, jobCount };
      })
      .sort((a, b) => a.c.name.localeCompare(b.c.name));
  }, [customers, invoices, payments, jobs, q]);

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} total`}
        right={<HeaderButton icon="add" label="New customer" onPress={() => router.push('/customer/new')} />}
      />
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search name, email, phone, address"
        placeholderTextColor={colors.textFaint}
        style={[ui.input, { marginBottom: space(4) }]}
      />
      {rows.length ? (
        rows.map(({ c, owed, jobCount }) => (
          <Card key={c.id} onPress={() => router.push(`/customer/${c.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space(3) }}>
            <Avatar name={c.name} size={40} color={colors.brandDark} />
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{c.name}</Text>
              <Text style={type.small} numberOfLines={1}>
                {c.address}
              </Text>
              <Text style={[type.small, { marginTop: 2 }]}>
                {jobCount} job{jobCount === 1 ? '' : 's'}
              </Text>
            </View>
            {owed > 0 ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={type.small}>Owes</Text>
                <Text style={[type.h3, { color: colors.danger }]}>{currency(owed)}</Text>
              </View>
            ) : null}
          </Card>
        ))
      ) : (
        <Empty
          icon="people-outline"
          title={q ? 'No matches' : 'No customers yet'}
          action={!q ? <Button title="Add customer" onPress={() => router.push('/customer/new')} /> : undefined}
        />
      )}
    </Screen>
  );
}
