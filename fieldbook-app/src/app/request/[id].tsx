import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { confirm, DateTimePicker, MemberPicker, notify } from '../../components/domain';
import { Badge, Button, Card, Chips, Empty, Row, Screen, SectionHeader, styles as ui } from '../../components/ui';
import { fmtDate, fmtDay } from '../../lib/dates';
import { useStore } from '../../store/store';
import { requestTone, space, type } from '../../theme';

const windowHour = { morning: 9, afternoon: 13, anytime: 10 } as const;

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const req = useStore((s) => s.requests.find((r) => r.id === id));
  const customers = useStore((s) => s.customers);
  const a = useStore.getState();

  const initialStart = () => {
    const d = req ? new Date(req.preferredDate) : new Date();
    d.setHours(req ? windowHour[req.preferredWindow] : 9, 0, 0, 0);
    return d.toISOString();
  };
  const [start, setStart] = useState(initialStart);
  const [duration, setDuration] = useState(60);
  const [assigneeId, setAssigneeId] = useState<string | undefined>();

  if (!req) {
    return (
      <Screen>
        <Empty icon="mail-outline" title="Request not found" />
      </Screen>
    );
  }

  const match = customers.find(
    (c) =>
      (req.email && c.email.toLowerCase() === req.email.toLowerCase()) ||
      (req.phone.replace(/\D/g, '').length >= 7 && c.phone.replace(/\D/g, '') === req.phone.replace(/\D/g, '')),
  );

  const schedule = () => {
    if (!assigneeId) {
      confirm('No technician assigned', 'Schedule this job without a technician?', go, 'Schedule');
      return;
    }
    go();
  };
  const go = () => {
    const jobId = a.scheduleRequest(req.id, { start, durationMins: duration, assigneeId });
    notify('Job scheduled', `${req.name} is booked for ${fmtDay(new Date(start))}.`);
    router.replace(`/job/${jobId}`);
  };

  return (
    <Screen
      footer={
        req.status === 'new' ? (
          <>
            <Button title="Decline" variant="secondary" onPress={() => confirm('Decline request?', 'It will move to Declined.', () => { a.declineRequest(req.id); router.back(); }, 'Decline')} style={{ flex: 1 }} />
            <Button title="Schedule job" icon="calendar" onPress={schedule} style={{ flex: 1.4 }} />
          </>
        ) : req.jobId ? (
          <Button title="View job" onPress={() => router.push(`/job/${req.jobId}`)} style={{ flex: 1 }} />
        ) : null
      }
    >
      <Badge {...requestTone[req.status]} />
      <Text style={[type.title, { marginTop: space(2) }]}>{req.service}</Text>
      <Text style={[type.small, { marginTop: 4 }]}>Received {fmtDate(req.createdAt)}</Text>

      <Card style={{ marginTop: space(4) }}>
        <Text style={type.label}>Customer's description</Text>
        <Text style={[type.body, { marginTop: 6 }]}>{req.details || 'No details provided.'}</Text>
        <Text style={[type.small, { marginTop: space(3) }]}>
          Preferred: {fmtDay(new Date(req.preferredDate))}, {req.preferredWindow}
        </Text>
      </Card>

      <Card style={{ paddingVertical: space(1) }}>
        <Row icon="person-outline" title={req.name} subtitle={match ? 'Existing customer — job will be added to their record' : 'New customer — a record will be created'} onPress={match ? () => router.push(`/customer/${match.id}`) : undefined} />
        <Row icon="call-outline" title={req.phone} onPress={() => Linking.openURL(`tel:${req.phone.replace(/[^\d+]/g, '')}`)} />
        <Row icon="mail-outline" title={req.email} onPress={() => Linking.openURL(`mailto:${req.email}`)} />
        <Row icon="location-outline" title={req.address} last />
      </Card>

      {req.status === 'new' ? (
        <>
          <SectionHeader title="Schedule" />
          <DateTimePicker value={start} onChange={setStart} />
          <View style={{ marginBottom: space(4) }}>
            <Text style={ui.fieldLabel}>Duration</Text>
            <Chips
              value={String(duration)}
              onChange={(v) => setDuration(Number(v))}
              options={[30, 60, 90, 120, 180, 240].map((m) => ({ value: String(m), label: m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}` }))}
            />
          </View>
          <MemberPicker value={assigneeId} onChange={setAssigneeId} />
        </>
      ) : null}
    </Screen>
  );
}
