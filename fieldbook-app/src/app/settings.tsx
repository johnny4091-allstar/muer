import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { confirm, notify } from '../components/domain';
import { Avatar, Button, Card, Field, Screen, SectionHeader, styles as ui } from '../components/ui';
import { parseAmount } from '../lib/money';
import { useMe, useStore } from '../store/store';
import { colors, space, type } from '../theme';

export default function Settings() {
  const me = useMe();
  const team = useStore((s) => s.team);
  const business = useStore((s) => s.business);
  const a = useStore.getState();

  const [name, setName] = useState(business.name);
  const [email, setEmail] = useState(business.email);
  const [phone, setPhone] = useState(business.phone);
  const [address, setAddress] = useState(business.address);
  const [tax, setTax] = useState(String(business.taxRate));
  const [terms, setTerms] = useState(String(business.invoiceTerms));
  const [services, setServices] = useState(business.services.join('\n'));
  const [intro, setIntro] = useState(business.bookingIntro);

  const save = () => {
    if (!name.trim()) return notify('Business name is required');
    a.updateBusiness({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      taxRate: parseAmount(tax),
      invoiceTerms: Math.max(0, Math.round(parseAmount(terms))),
      services: services.split('\n').map((x) => x.trim()).filter(Boolean),
      bookingIntro: intro.trim(),
    });
    notify('Settings saved');
  };

  return (
    <Screen>
      <SectionHeader title="Signed in as" />
      <Text style={[type.small, { marginBottom: space(2) }]}>
        Switch to see the app as the office or as a technician in the field.
      </Text>
      <Card style={{ paddingVertical: space(1) }}>
        {team.map((m, i) => {
          const active = m.id === me.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                a.setSession(m.id);
                router.replace('/');
              }}
              style={[
                { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(3) },
                i < team.length - 1 && ui.rowDivider,
              ]}
            >
              <Avatar name={m.name} color={m.color} />
              <View style={{ flex: 1 }}>
                <Text style={type.h3}>{m.name}</Text>
                <Text style={type.small}>{m.role === 'office' ? 'Office / admin' : 'Technician'}</Text>
              </View>
              {active ? <Text style={[ui.link]}>Current</Text> : null}
            </Pressable>
          );
        })}
      </Card>

      {me.role === 'office' ? (
        <>
          <SectionHeader title="Business profile" />
          <Field label="Business name" value={name} onChangeText={setName} />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Address" value={address} onChangeText={setAddress} />

          <SectionHeader title="Billing" />
          <View style={{ flexDirection: 'row', gap: space(3) }}>
            <Field label="Default tax rate (%)" value={tax} onChangeText={setTax} keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Field label="Payment terms (days)" value={terms} onChangeText={setTerms} keyboardType="number-pad" style={{ flex: 1 }} />
          </View>

          <SectionHeader title="Online booking" />
          <Field label="Welcome message" value={intro} onChangeText={setIntro} multiline />
          <Field label="Services offered" value={services} onChangeText={setServices} multiline hint="One per line. Shown on your booking page and as quick picks for new jobs." />

          <Button title="Save settings" onPress={save} />

          <SectionHeader title="Data" />
          <Button
            title="Reset demo data"
            variant="danger"
            onPress={() =>
              confirm('Reset all data?', 'This replaces everything on this device with the sample workspace.', () => {
                a.resetDemo();
                router.replace('/');
              }, 'Reset')
            }
          />
        </>
      ) : null}
      <Text style={[type.small, { textAlign: 'center', marginTop: space(8), color: colors.textFaint }]}>Fieldbook · v1.0.0</Text>
    </Screen>
  );
}
