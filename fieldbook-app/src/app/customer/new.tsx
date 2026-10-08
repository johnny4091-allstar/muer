import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { notify } from '../../components/domain';
import { Button, Field, Screen } from '../../components/ui';
import { useStore } from '../../store/store';

/** Create a customer, or edit one when `id` is passed. */
export default function CustomerForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.customers.find((c) => c.id === id));
  const upsert = useStore((s) => s.upsertCustomer);
  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const save = () => {
    if (!name.trim()) return notify('Name is required');
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return notify('Check the email address');
    const savedId = upsert({ id: existing?.id, name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), notes });
    if (existing) router.back();
    else router.replace(`/customer/${savedId}`);
  };

  return (
    <Screen footer={<Button title={existing ? 'Save changes' : 'Add customer'} onPress={save} style={{ flex: 1 }} />}>
      <Stack.Screen options={{ title: existing ? 'Edit customer' : 'New customer' }} />
      <Field label="Name" value={name} onChangeText={setName} placeholder="Person or business name" autoFocus={!existing} />
      <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
      <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="(555) 555-5555" keyboardType="phone-pad" />
      <Field label="Service address" value={address} onChangeText={setAddress} placeholder="Street, city" />
      <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Gate codes, pets, preferences…" multiline hint="Visible to technicians on every job." />
    </Screen>
  );
}
