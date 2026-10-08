import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { confirm, HeaderButton } from '../../components/domain';
import { Avatar, Badge, Button, Card, Empty, Row, Screen, SectionHeader, styles as ui } from '../../components/ui';
import { fmtDay, fmtDuration, fmtTime, recurrenceLabel } from '../../lib/dates';
import { currency, totals } from '../../lib/money';
import { useMe, useStore } from '../../store/store';
import { colors, estimateTone, invoiceTone, jobTone, radius, space, type } from '../../theme';

function useTicker(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const job = useStore((s) => s.jobs.find((j) => j.id === id));
  const customer = useStore((s) => s.customers.find((c) => c.id === job?.customerId));
  const team = useStore((s) => s.team);
  const estimate = useStore((s) => s.estimates.find((e) => e.id === job?.estimateId));
  const invoice = useStore((s) => s.invoices.find((i) => i.id === job?.invoiceId));
  const a = useStore.getState();
  const [note, setNote] = useState('');
  const [newItem, setNewItem] = useState('');

  const myOpen = job?.time.find((t) => t.memberId === me.id && !t.end);
  const now = useTicker(!!myOpen);

  if (!job) {
    return (
      <Screen>
        <Empty icon="alert-circle-outline" title="Job not found" body="It may have been deleted." />
      </Screen>
    );
  }

  const isOffice = me.role === 'office';
  const tone = jobTone[job.status];
  const tech = team.find((m) => m.id === job.assigneeId);
  const done = job.checklist.filter((c) => c.done).length;
  const pct = job.checklist.length ? done / job.checklist.length : 0;
  const end = new Date(new Date(job.start).getTime() + job.durationMins * 60_000).toISOString();
  const totalMs = job.time.reduce(
    (s, t) => s + ((t.end ? new Date(t.end).getTime() : now) - new Date(t.start).getTime()),
    0,
  );
  const closed = job.status === 'completed' || job.status === 'cancelled';

  const openMaps = () => {
    const q = encodeURIComponent(job.address);
    const url = Platform.OS === 'ios' ? `maps://?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`));
  };

  const complete = () => {
    const remaining = job.checklist.length - done;
    const finish = () => a.setJobStatus(job.id, 'completed');
    if (remaining > 0) {
      confirm('Complete job?', `${remaining} checklist item(s) are still open.`, finish, 'Complete anyway');
    } else finish();
  };

  return (
    <Screen
      footer={
        closed ? (
          isOffice && job.status === 'completed' ? (
            invoice ? (
              <Button title={`View invoice #${invoice.number}`} icon="receipt-outline" onPress={() => router.push(`/invoice/${invoice.id}`)} style={{ flex: 1 }} />
            ) : (
              <Button
                title="Create invoice"
                icon="receipt-outline"
                onPress={() => router.push(`/invoice/${a.invoiceFromJob(job.id)}`)}
                style={{ flex: 1 }}
              />
            )
          ) : (
            <Button title="Reopen job" variant="secondary" onPress={() => a.setJobStatus(job.id, 'scheduled')} style={{ flex: 1 }} />
          )
        ) : (
          <>
            {myOpen ? (
              <Button title="Stop timer" icon="pause" variant="secondary" onPress={() => a.clockOut(job.id, me.id)} style={{ flex: 1 }} />
            ) : (
              <Button
                title={job.status === 'scheduled' ? 'Start job' : 'Resume timer'}
                icon="play"
                variant="secondary"
                onPress={() => a.clockIn(job.id, me.id)}
                style={{ flex: 1 }}
              />
            )}
            <Button title="Complete" icon="checkmark" onPress={complete} style={{ flex: 1 }} />
          </>
        )
      }
    >
      <Stack.Screen
        options={{
          title: `Job #${job.number}`,
          headerRight: isOffice
            ? () => <HeaderButton icon="create-outline" label="Edit job" onPress={() => router.push({ pathname: '/job/new', params: { id: job.id } })} />
            : undefined,
        }}
      />

      <Badge {...tone} />
      <Text style={[type.title, { marginTop: space(2) }]}>{job.title}</Text>
      {job.description ? <Text style={[type.body, { color: colors.textMuted, marginTop: 6 }]}>{job.description}</Text> : null}

      <Card style={{ marginTop: space(4), paddingVertical: space(1) }}>
        <Row icon="calendar-outline" title={fmtDay(new Date(job.start))} subtitle={`${fmtTime(job.start)} – ${fmtTime(end)}${job.recurrence !== 'none' ? ` · ${recurrenceLabel[job.recurrence]}` : ''}`} />
        <Row icon="location-outline" title={job.address} subtitle="Get directions" onPress={openMaps} />
        {customer ? (
          <Row
            icon="person-outline"
            title={customer.name}
            subtitle={customer.notes || customer.phone}
            onPress={isOffice ? () => router.push(`/customer/${customer.id}`) : undefined}
            right={
              customer.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${customer.phone.replace(/[^\d+]/g, '')}`)} hitSlop={8} style={s.call}>
                  <Ionicons name="call" size={16} color={colors.brand} />
                </Pressable>
              ) : null
            }
          />
        ) : null}
        <Row
          icon="person-circle-outline"
          title={tech ? tech.name : 'Unassigned'}
          subtitle="Technician"
          right={tech ? <Avatar name={tech.name} color={tech.color} size={28} /> : null}
          last
        />
      </Card>

      <SectionHeader title="Time tracked" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={s.timer}>{fmtDuration(totalMs)}</Text>
            <Text style={type.small}>
              {myOpen ? 'Your timer is running' : `${job.time.length} time entr${job.time.length === 1 ? 'y' : 'ies'}`}
            </Text>
          </View>
          {myOpen ? <View style={s.live}><View style={s.liveDot} /><Text style={s.liveText}>LIVE</Text></View> : null}
        </View>
        {job.time.length ? (
          <View style={{ marginTop: space(3) }}>
            {job.time.map((t) => {
              const who = team.find((m) => m.id === t.memberId);
              return (
                <View key={t.id} style={s.entry}>
                  <Text style={type.small}>{who?.name ?? 'Team member'}</Text>
                  <Text style={type.small}>
                    {fmtTime(t.start)} – {t.end ? fmtTime(t.end) : 'now'} ·{' '}
                    {fmtDuration((t.end ? new Date(t.end).getTime() : now) - new Date(t.start).getTime())}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </Card>

      <SectionHeader title={`Checklist${job.checklist.length ? ` · ${done}/${job.checklist.length}` : ''}`} />
      <Card style={{ paddingVertical: space(2) }}>
        {job.checklist.length ? (
          <View style={s.progress}>
            <View style={[s.progressFill, { width: `${pct * 100}%` }]} />
          </View>
        ) : null}
        {job.checklist.map((c) => (
          <Pressable key={c.id} onPress={() => a.toggleChecklist(job.id, c.id)} style={s.check} accessibilityRole="checkbox" accessibilityState={{ checked: c.done }}>
            <Ionicons name={c.done ? 'checkbox' : 'square-outline'} size={22} color={c.done ? colors.brand : colors.textFaint} />
            <Text style={[type.body, { flex: 1 }, c.done && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>{c.label}</Text>
          </Pressable>
        ))}
        <View style={{ flexDirection: 'row', gap: space(2), marginTop: space(2) }}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add checklist item"
            placeholderTextColor={colors.textFaint}
            style={[ui.input, { flex: 1 }]}
            onSubmitEditing={() => {
              if (newItem.trim()) a.addChecklistItem(job.id, newItem.trim());
              setNewItem('');
            }}
            returnKeyType="done"
          />
          <Button
            small
            title="Add"
            variant="secondary"
            disabled={!newItem.trim()}
            onPress={() => {
              a.addChecklistItem(job.id, newItem.trim());
              setNewItem('');
            }}
            style={{ minHeight: 48 }}
          />
        </View>
      </Card>

      <SectionHeader title="Notes" />
      <Card>
        {job.notes.map((n) => {
          const who = team.find((m) => m.id === n.authorId);
          return (
            <View key={n.id} style={s.note}>
              <Text style={type.small}>
                {who?.name ?? 'Team'} · {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Text>
              <Text style={[type.body, { marginTop: 2 }]}>{n.body}</Text>
            </View>
          );
        })}
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Record progress, parts used, findings…"
          placeholderTextColor={colors.textFaint}
          multiline
          style={[ui.input, { minHeight: 72, paddingTop: 12, textAlignVertical: 'top' }]}
        />
        <Button
          title="Add note"
          small
          variant="secondary"
          disabled={!note.trim()}
          onPress={() => {
            a.addNote(job.id, me.id, note.trim());
            setNote('');
          }}
          style={{ marginTop: space(2), alignSelf: 'flex-start' }}
        />
      </Card>

      {isOffice ? (
        <>
          <SectionHeader title="Billing" />
          <Card style={{ paddingVertical: space(1) }}>
            {estimate ? (
              <Row
                icon="document-text-outline"
                title={`Estimate #${estimate.number} · ${currency(totals(estimate).total)}`}
                right={<Badge {...estimateTone[estimate.status]} />}
                onPress={() => router.push(`/estimate/${estimate.id}`)}
              />
            ) : (
              <Row
                icon="document-text-outline"
                title="Create estimate"
                subtitle="Quote this work for customer approval"
                onPress={() => router.push({ pathname: '/estimate/edit', params: { jobId: job.id } })}
              />
            )}
            {invoice ? (
              <Row
                icon="receipt-outline"
                title={`Invoice #${invoice.number} · ${currency(totals(invoice).total)}`}
                right={<Badge {...invoiceTone[invoice.status]} />}
                onPress={() => router.push(`/invoice/${invoice.id}`)}
                last
              />
            ) : (
              <Row
                icon="receipt-outline"
                title="Create invoice"
                subtitle={estimate && estimate.status !== 'declined' ? 'From the estimate' : 'From tracked time'}
                onPress={() => router.push(`/invoice/${a.invoiceFromJob(job.id)}`)}
                last
              />
            )}
          </Card>
          {!closed ? (
            <Button
              title="Cancel job"
              variant="danger"
              onPress={() => confirm('Cancel this job?', 'The customer visit will be removed from the schedule.', () => a.setJobStatus(job.id, 'cancelled'), 'Cancel job')}
              style={{ marginTop: space(5) }}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  call: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  timer: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dangerSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  liveText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  entry: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  progress: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginVertical: space(2) },
  progressFill: { height: 6, backgroundColor: colors.brand },
  check: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: 10 },
  note: { paddingBottom: space(3), marginBottom: space(3), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
