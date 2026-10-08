import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { CustomerPicker, DateTimePicker, MemberPicker, notify } from '../../components/domain';
import { Button, Chips, Field, Screen, styles as ui } from '../../components/ui';
import { addDays, recurrenceLabel } from '../../lib/dates';
import { useStore } from '../../store/store';
import type { Recurrence } from '../../store/types';
import { space, type } from '../../theme';

const DURATIONS = [30, 60, 90, 120, 180, 240, 480];

function defaultStart() {
  const d = addDays(new Date(), 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/** Create a job, or edit one when `id` is passed. */
export default function JobForm() {
  const params = useLocalSearchParams<{ id?: string; customerId?: string }>();
  const existing = useStore((s) => s.jobs.find((j) => j.id === params.id));
  const customers = useStore((s) => s.customers);
  const services = useStore((s) => s.business.services);
  const a = useStore.getState();

  const [customerId, setCustomerId] = useState<string | undefined>(existing?.customerId ?? params.customerId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [address, setAddress] = useState(
    existing?.address ?? customers.find((c) => c.id === params.customerId)?.address ?? '',
  );
  const [start, setStart] = useState(existing?.start ?? defaultStart());
  const [duration, setDuration] = useState(existing?.durationMins ?? 60);
  const [assigneeId, setAssigneeId] = useState(existing?.assigneeId);
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? 'none');
  const [checklist, setChecklist] = useState('');

  // Pre-fill the service address from the customer record.
  const chooseCustomer = (id: string) => {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c && !address.trim()) setAddress(c.address);
  };

  const save = () => {
    if (!customerId) return notify('Choose a customer');
    if (!title.trim()) return notify('Add a job title');
    if (existing) {
      a.updateJob(existing.id, { customerId, title: title.trim(), description, address, start, durationMins: duration, assigneeId });
      router.back();
      return;
    }
    const id = a.createJob({
      customerId,
      title: title.trim(),
      description,
      address,
      start,
      durationMins: duration,
      assigneeId,
      recurrence,
      checklist: checklist
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    });
    router.replace(`/job/${id}`);
  };

  return (
    <Screen footer={<Button title={existing ? 'Save changes' : 'Schedule job'} onPress={save} style={{ flex: 1 }} />}>
      <Stack.Screen options={{ title: existing ? `Edit job #${existing.number}` : 'New job' }} />
      <CustomerPicker value={customerId} onChange={chooseCustomer} />
      <Field label="Job title" value={title} onChangeText={setTitle} placeholder="e.g. AC tune-up" />
      {!existing && services.length ? (
        <View style={{ marginTop: -space(2), marginBottom: space(4) }}>
          <Chips value={title} onChange={setTitle} options={services.map((sv) => ({ value: sv, label: sv }))} />
        </View>
      ) : null}
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="What needs to be done?" multiline />
      <Field label="Service address" value={address} onChangeText={setAddress} placeholder="Street, city" />
      <DateTimePicker value={start} onChange={setStart} />
      <View style={{ marginBottom: space(4) }}>
        <Text style={ui.fieldLabel}>Duration</Text>
        <Chips
          value={String(duration)}
          onChange={(v) => setDuration(Number(v))}
          options={DURATIONS.map((m) => ({ value: String(m), label: m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}` }))}
        />
      </View>
      <MemberPicker value={assigneeId} onChange={setAssigneeId} />
      {!existing ? (
        <>
          <View style={{ marginBottom: space(4) }}>
            <Text style={ui.fieldLabel}>Repeat</Text>
            <Chips<Recurrence>
              value={recurrence}
              onChange={setRecurrence}
              options={(Object.keys(recurrenceLabel) as Recurrence[]).map((r) => ({ value: r, label: recurrenceLabel[r] }))}
            />
            {recurrence !== 'none' ? (
              <Text style={[type.small, { marginTop: 6 }]}>Visits for the next 6 months will be added to the schedule.</Text>
            ) : null}
          </View>
          <Field
            label="Checklist"
            value={checklist}
            onChangeText={setChecklist}
            placeholder={'One item per line\nInspect filter\nTest thermostat'}
            multiline
            hint="Technicians check these off on site."
          />
        </>
      ) : null}
    </Screen>
  );
}
