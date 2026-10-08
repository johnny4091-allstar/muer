import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { notify } from '../components/domain';
import { Button, Card, Chips, Field, Screen, styles as ui } from '../components/ui';
import { addDays, startOfDay } from '../lib/dates';
import { useMe, useStore } from '../store/store';
import type { BookingRequest } from '../store/types';
import { colors, radius, space, type } from '../theme';

type Window = BookingRequest['preferredWindow'];

/**
 * The customer-facing booking form. In production this same form is served on the
 * business's public booking URL; here it doubles as a preview for the office.
 */
export default function BookingPage() {
  const business = useStore((s) => s.business);
  const submitRequest = useStore((s) => s.submitRequest);
  const me = useMe();
  const [service, setService] = useState(business.services[0] ?? '');
  const [details, setDetails] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => addDays(startOfDay(new Date()), i + 1)), []);
  const [date, setDate] = useState(days[0].toISOString());
  const [win, setWin] = useState<Window>('anytime');
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) return notify('Please fill in your name, phone, and address.');
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return notify('Please check your email address.');
    submitRequest({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      service,
      details: details.trim(),
      preferredDate: date,
      preferredWindow: win,
    });
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <View style={s.done}>
          <View style={s.doneIcon}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={[type.title, { textAlign: 'center' }]}>Request received</Text>
          <Text style={[type.body, { textAlign: 'center', color: colors.textMuted, marginTop: space(2) }]}>
            Thanks, {name.split(' ')[0]}! {business.name} will confirm your appointment shortly.
          </Text>
          {me.role === 'office' ? (
            <Button title="Review in booking requests" onPress={() => router.replace('/requests')} style={{ marginTop: space(6), alignSelf: 'stretch' }} />
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="Request appointment" onPress={submit} style={{ flex: 1 }} />}>
      <View style={s.hero}>
        <Text style={s.heroName}>{business.name}</Text>
        <Text style={s.heroSub}>{business.bookingIntro}</Text>
        <View style={{ flexDirection: 'row', gap: space(4), marginTop: space(3) }}>
          <Text style={s.heroMeta}>
            <Ionicons name="call-outline" size={13} /> {business.phone}
          </Text>
        </View>
      </View>

      <Text style={[type.label, { marginBottom: space(2) }]}>What do you need?</Text>
      <View style={s.services}>
        {business.services.map((sv) => {
          const active = sv === service;
          return (
            <Pressable key={sv} onPress={() => setService(sv)} style={[s.service, active && s.serviceActive]}>
              <Text style={[type.h3, active && { color: colors.brand }]}>{sv}</Text>
            </Pressable>
          );
        })}
      </View>
      <Field label="Describe the issue" value={details} onChangeText={setDetails} placeholder="What's happening? Any make/model info helps." multiline />

      <Text style={[type.label, { marginBottom: space(2) }]}>When works best?</Text>
      <View style={{ marginBottom: space(3) }}>
        <Chips
          value={date}
          onChange={setDate}
          options={days.map((d) => ({ value: d.toISOString(), label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }))}
        />
      </View>
      <View style={{ marginBottom: space(5) }}>
        <Chips<Window>
          value={win}
          onChange={setWin}
          options={[
            { value: 'morning', label: 'Morning (8–12)' },
            { value: 'afternoon', label: 'Afternoon (12–5)' },
            { value: 'anytime', label: 'Anytime' },
          ]}
        />
      </View>

      <Text style={[type.label, { marginBottom: space(2) }]}>Your details</Text>
      <Card>
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Service address" value={address} onChangeText={setAddress} autoComplete="street-address" style={{ marginBottom: 0 }} />
      </Card>
      <Text style={[ui.fieldLabel, { fontWeight: '400', color: colors.textMuted, textAlign: 'center' }]}>
        We'll only use your information to schedule this service.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.brand, borderRadius: radius.lg, padding: space(5), marginBottom: space(5) },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '700' },
  heroSub: { color: '#DDF0E6', fontSize: 15, marginTop: 6, lineHeight: 21 },
  heroMeta: { color: '#BFE3D2', fontSize: 13, fontWeight: '600' },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginBottom: space(4) },
  service: {
    width: '48.5%',
    padding: space(4),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  serviceActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  done: { alignItems: 'center', paddingTop: space(16) },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space(5),
  },
});
