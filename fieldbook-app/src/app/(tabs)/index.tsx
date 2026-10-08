import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeaderButton, JobCard } from '../../components/domain';
import { PageHeader } from '../../components/PageHeader';
import { Badge, Button, Card, Empty, Screen, SectionHeader, Stat, type IconName } from '../../components/ui';
import { fmtDay, fmtDuration, relativeDay, sameDay } from '../../lib/dates';
import { balanceOf, currency, totals } from '../../lib/money';
import { isOverdue, useMe, useStore } from '../../store/store';
import type { Job } from '../../store/types';
import { colors, radius, requestTone, space, type } from '../../theme';

export default function Home() {
  const me = useMe();
  return me.role === 'office' ? <OfficeHome /> : <TechHome />;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const byStart = (a: Job, b: Job) => a.start.localeCompare(b.start);

function OfficeHome() {
  const me = useMe();
  const business = useStore((s) => s.business);
  const jobs = useStore((s) => s.jobs);
  const invoices = useStore((s) => s.invoices);
  const payments = useStore((s) => s.payments);
  const estimates = useStore((s) => s.estimates);
  const requests = useStore((s) => s.requests);

  const now = new Date();
  const today = jobs.filter((j) => sameDay(new Date(j.start), now) && j.status !== 'cancelled').sort(byStart);
  const open = invoices.filter((i) => i.status === 'sent' || i.status === 'partial');
  const outstanding = open.reduce((s, i) => s + balanceOf(i, payments), 0);
  const overdue = open.filter((i) => isOverdue(i));
  const overdueAmt = overdue.reduce((s, i) => s + balanceOf(i, payments), 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const collected = payments.filter((p) => new Date(p.receivedAt) >= monthStart).reduce((s, p) => s + p.amount, 0);
  const newReqs = requests.filter((r) => r.status === 'new');
  const awaiting = estimates.filter((e) => e.status === 'sent');
  const approved = estimates.filter((e) => e.status === 'approved');
  const drafts = invoices.filter((i) => i.status === 'draft');
  const completedUnbilled = jobs.filter((j) => j.status === 'completed' && !j.invoiceId);

  return (
    <Screen edges={['top']}>
      <PageHeader
        subtitle={`${fmtDay(now)} · ${business.name}`}
        title={`${greeting()}, ${me.name.split(' ')[0]}`}
        right={<HeaderButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />}
      />

      <View style={s.statRow}>
        <Stat label="Jobs today" value={String(today.length)} sub={`${today.filter((j) => j.status === 'completed').length} completed`} />
        <Stat label="Collected this month" value={currency(collected)} tone={colors.success} />
      </View>
      <View style={[s.statRow, { marginTop: space(3) }]}>
        <Stat label="Outstanding" value={currency(outstanding)} sub={`${open.length} open invoices`} />
        <Stat
          label="Overdue"
          value={currency(overdueAmt)}
          tone={overdue.length ? colors.danger : colors.text}
          sub={`${overdue.length} invoice${overdue.length === 1 ? '' : 's'}`}
        />
      </View>

      <View style={s.quick}>
        <Quick icon="add-circle-outline" label="New job" onPress={() => router.push('/job/new')} />
        <Quick icon="document-text-outline" label="Estimate" onPress={() => router.push('/estimate/edit')} />
        <Quick icon="receipt-outline" label="Invoice" onPress={() => router.push('/invoice/edit')} />
        <Quick icon="globe-outline" label="Booking page" onPress={() => router.push('/book')} />
      </View>

      <SectionHeader
        title={`Booking requests${newReqs.length ? ` · ${newReqs.length} new` : ''}`}
        action="View all"
        onAction={() => router.push('/requests')}
      />
      {newReqs.length ? (
        newReqs.slice(0, 3).map((r) => (
          <Card key={r.id} onPress={() => router.push(`/request/${r.id}`)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={type.h3}>{r.service}</Text>
              <Badge {...requestTone[r.status]} />
            </View>
            <Text style={[type.small, { marginTop: 4 }]}>
              {r.name} · prefers {relativeDay(r.preferredDate)} ({r.preferredWindow})
            </Text>
            <Text style={[type.body, { marginTop: 6, color: colors.textMuted }]} numberOfLines={2}>
              {r.details}
            </Text>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={type.small}>You're all caught up. New requests from your booking page appear here.</Text>
        </Card>
      )}

      <SectionHeader title="Today's schedule" action="Schedule" onAction={() => router.push('/schedule')} />
      {today.length ? (
        today.map((j) => <JobCard key={j.id} job={j} />)
      ) : (
        <Card>
          <Empty icon="sunny-outline" title="Nothing scheduled today" action={<Button small title="Schedule a job" onPress={() => router.push('/job/new')} />} />
        </Card>
      )}

      {(awaiting.length || approved.length || drafts.length || completedUnbilled.length) > 0 ? (
        <>
          <SectionHeader title="Needs attention" />
          <Card style={{ paddingVertical: space(1) }}>
            {completedUnbilled.length ? (
              <Attention
                icon="checkmark-done-outline"
                label={`${completedUnbilled.length} completed job${completedUnbilled.length > 1 ? 's' : ''} not invoiced`}
                onPress={() => router.push({ pathname: '/jobs', params: { filter: 'completed' } })}
              />
            ) : null}
            {drafts.length ? (
              <Attention
                icon="send-outline"
                label={`${drafts.length} draft invoice${drafts.length > 1 ? 's' : ''} ready to send · ${currency(drafts.reduce((a, i) => a + totals(i).total, 0))}`}
                onPress={() => router.push({ pathname: '/money', params: { tab: 'invoices' } })}
              />
            ) : null}
            {approved.length ? (
              <Attention
                icon="thumbs-up-outline"
                label={`${approved.length} approved estimate${approved.length > 1 ? 's' : ''} to convert`}
                onPress={() => router.push({ pathname: '/money', params: { tab: 'estimates' } })}
              />
            ) : null}
            {awaiting.length ? (
              <Attention
                icon="hourglass-outline"
                label={`${awaiting.length} estimate${awaiting.length > 1 ? 's' : ''} awaiting customer approval`}
                onPress={() => router.push({ pathname: '/money', params: { tab: 'estimates' } })}
                last
              />
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Quick({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.quickItem, pressed && { opacity: 0.7 }]}>
      <View style={s.quickIcon}>
        <Ionicons name={icon} size={22} color={colors.brand} />
      </View>
      <Text style={s.quickLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Attention({ icon, label, onPress, last }: { icon: IconName; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.attn, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      <Ionicons name={icon} size={18} color={colors.brand} />
      <Text style={[type.body, { flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function TechHome() {
  const me = useMe();
  const allJobs = useStore((s) => s.jobs);
  const now = useNow();
  const mine = allJobs.filter((j) => j.assigneeId === me.id && j.status !== 'cancelled').sort(byStart);
  const today = mine.filter((j) => sameDay(new Date(j.start), new Date(now)));
  const active = mine.find((j) => j.time.some((t) => t.memberId === me.id && !t.end));
  const next = today.find((j) => j.status === 'scheduled');
  const upcoming = mine.filter((j) => new Date(j.start) > new Date(now) && !sameDay(new Date(j.start), new Date(now))).slice(0, 5);
  const weekAgo = now - 7 * 86_400_000;
  const loggedMs = mine
    .flatMap((j) => j.time)
    .filter((t) => t.memberId === me.id && new Date(t.start).getTime() > weekAgo)
    .reduce((s, t) => s + ((t.end ? new Date(t.end).getTime() : now) - new Date(t.start).getTime()), 0);

  const focus = active ?? next;
  const openTimer = active?.time.find((t) => t.memberId === me.id && !t.end);

  return (
    <Screen edges={['top']}>
      <PageHeader
        subtitle={fmtDay(new Date(now))}
        title={`${greeting()}, ${me.name.split(' ')[0]}`}
        right={<HeaderButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />}
      />

      {focus ? (
        <Pressable onPress={() => router.push(`/job/${focus.id}`)} style={s.hero}>
          <Text style={s.heroLabel}>{active ? 'ON THE CLOCK' : 'UP NEXT'}</Text>
          <Text style={s.heroTitle}>{focus.title}</Text>
          <Text style={s.heroSub}>{focus.address}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space(4), alignItems: 'center' }}>
            <Text style={s.heroSub}>
              {openTimer ? `Timer ${fmtDuration(now - new Date(openTimer.start).getTime())}` : relativeDay(focus.start)}
            </Text>
            <View style={s.heroBtn}>
              <Text style={{ color: colors.brand, fontWeight: '700' }}>Open job</Text>
            </View>
          </View>
        </Pressable>
      ) : null}

      <View style={s.statRow}>
        <Stat label="Jobs today" value={String(today.length)} sub={`${today.filter((j) => j.status === 'completed').length} done`} />
        <Stat label="Hours (7 days)" value={fmtDuration(loggedMs)} />
      </View>

      <SectionHeader title="Today" />
      {today.length ? today.map((j) => <JobCard key={j.id} job={j} />) : <Card><Text style={type.small}>No jobs assigned today.</Text></Card>}

      <SectionHeader title="Coming up" />
      {upcoming.length ? upcoming.map((j) => <JobCard key={j.id} job={j} showDate />) : <Card><Text style={type.small}>Nothing else scheduled yet.</Text></Card>}
    </Screen>
  );
}

const s = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: space(3) },
  quick: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space(5), gap: space(2) },
  quickItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  attn: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(3) },
  hero: { backgroundColor: colors.brand, borderRadius: radius.lg, padding: space(5), marginBottom: space(4) },
  heroLabel: { color: '#BFE3D2', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 6 },
  heroSub: { color: '#DDF0E6', fontSize: 14, marginTop: 4 },
  heroBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
});
