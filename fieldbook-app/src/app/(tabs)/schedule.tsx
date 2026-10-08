import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeaderButton, JobCard } from '../../components/domain';
import { PageHeader } from '../../components/PageHeader';
import { Avatar, Card, Chips, Screen, Segmented } from '../../components/ui';
import {
  addDays,
  addMonths,
  fmtDay,
  fmtMonth,
  fmtShortDay,
  sameDay,
  startOfDay,
  startOfWeek,
} from '../../lib/dates';
import { useMe, useStore } from '../../store/store';
import type { Job } from '../../store/types';
import { colors, jobTone, radius, space, type } from '../../theme';

type View_ = 'month' | 'week' | 'list';

export default function Schedule() {
  const me = useMe();
  const allJobs = useStore((s) => s.jobs);
  const team = useStore((s) => s.team);
  const [mode, setMode] = useState<View_>('week');
  const [cursor, setCursor] = useState(startOfDay(new Date()));
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const [tech, setTech] = useState<string>('all');

  const isOffice = me.role === 'office';
  const jobs = useMemo(
    () =>
      allJobs
        .filter((j) => j.status !== 'cancelled')
        .filter((j) => (isOffice ? tech === 'all' || j.assigneeId === tech : j.assigneeId === me.id))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [allJobs, isOffice, tech, me.id],
  );
  const onDay = (d: Date) => jobs.filter((j) => sameDay(new Date(j.start), d));

  const step = (dir: 1 | -1) => {
    if (mode === 'month') setCursor((c) => addMonths(c, dir));
    else setCursor((c) => addDays(c, dir * 7));
  };

  const techs = team.filter((m) => m.role === 'technician');

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Schedule"
        right={isOffice ? <HeaderButton icon="add" label="New job" onPress={() => router.push('/job/new')} /> : null}
      />
      <Segmented<View_>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'month', label: 'Month' },
          { value: 'week', label: 'Week' },
          { value: 'list', label: 'List' },
        ]}
      />
      {isOffice ? (
        <View style={{ marginBottom: space(3) }}>
          <Chips
            value={tech}
            onChange={setTech}
            options={[{ value: 'all', label: 'Everyone' }, ...techs.map((t) => ({ value: t.id, label: t.name.split(' ')[0] }))]}
          />
        </View>
      ) : null}

      {mode !== 'list' ? (
        <View style={s.nav}>
          <Pressable onPress={() => step(-1)} hitSlop={10} accessibilityLabel="Previous">
            <Ionicons name="chevron-back" size={22} color={colors.brand} />
          </Pressable>
          <Pressable
            onPress={() => {
              const t = startOfDay(new Date());
              setCursor(t);
              setSelected(t);
            }}
          >
            <Text style={type.h2}>
              {mode === 'month'
                ? fmtMonth(cursor)
                : `${fmtShortDay(startOfWeek(cursor))} – ${fmtShortDay(addDays(startOfWeek(cursor), 6))}`}
            </Text>
          </Pressable>
          <Pressable onPress={() => step(1)} hitSlop={10} accessibilityLabel="Next">
            <Ionicons name="chevron-forward" size={22} color={colors.brand} />
          </Pressable>
        </View>
      ) : null}

      {mode === 'month' ? (
        <>
          <MonthGrid cursor={cursor} selected={selected} onSelect={setSelected} jobsOn={onDay} />
          <DayList day={selected} jobs={onDay(selected)} />
        </>
      ) : null}

      {mode === 'week' ? (
        <>
          <View style={s.weekStrip}>
            {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)).map((d) => {
              const active = sameDay(d, selected);
              const count = onDay(d).length;
              const isToday = sameDay(d, new Date());
              return (
                <Pressable key={d.toISOString()} onPress={() => setSelected(d)} style={[s.weekDay, active && s.weekDayActive]}>
                  <Text style={[s.dow, active && { color: '#fff' }]}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</Text>
                  <Text style={[s.dom, active && { color: '#fff' }, !active && isToday && { color: colors.brand }]}>
                    {d.getDate()}
                  </Text>
                  <View style={s.dots}>
                    {Array.from({ length: Math.min(count, 3) }).map((_, k) => (
                      <View key={k} style={[s.dot, { backgroundColor: active ? '#fff' : colors.brand }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <DayList day={selected} jobs={onDay(selected)} />
          {isOffice ? <Workload jobs={jobs} weekStart={startOfWeek(cursor)} /> : null}
        </>
      ) : null}

      {mode === 'list' ? <UpcomingList jobs={jobs} /> : null}
    </Screen>
  );
}

function MonthGrid({
  cursor,
  selected,
  onSelect,
  jobsOn,
}: {
  cursor: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  jobsOn: (d: Date) => Job[];
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const rows = cells[35].getMonth() !== cursor.getMonth() ? 5 : 6;
  return (
    <Card style={{ padding: space(2) }}>
      <View style={s.gridRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={[s.gridHead]}>
            {d}
          </Text>
        ))}
      </View>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={s.gridRow}>
          {cells.slice(r * 7, r * 7 + 7).map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const active = sameDay(d, selected);
            const dayJobs = jobsOn(d);
            return (
              <Pressable key={d.toISOString()} onPress={() => onSelect(d)} style={s.cell}>
                <View style={[s.cellInner, active && { backgroundColor: colors.brand }]}>
                  <Text
                    style={[
                      s.cellText,
                      !inMonth && { color: colors.textFaint },
                      sameDay(d, new Date()) && !active && { color: colors.brand, fontWeight: '800' },
                      active && { color: '#fff' },
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </View>
                <View style={s.dots}>
                  {dayJobs.slice(0, 3).map((j) => (
                    <View key={j.id} style={[s.dot, { backgroundColor: jobTone[j.status].fg }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

function DayList({ day, jobs }: { day: Date; jobs: Job[] }) {
  return (
    <View style={{ marginTop: space(3) }}>
      <Text style={[type.label, { marginBottom: space(2) }]}>{fmtDay(day)}</Text>
      {jobs.length ? (
        jobs.map((j) => <JobCard key={j.id} job={j} />)
      ) : (
        <Card>
          <Text style={type.small}>No jobs scheduled.</Text>
        </Card>
      )}
    </View>
  );
}

function UpcomingList({ jobs }: { jobs: Job[] }) {
  const today = startOfDay(new Date());
  const upcoming = jobs.filter((j) => new Date(j.start) >= today).slice(0, 60);
  const groups: { day: Date; jobs: Job[] }[] = [];
  for (const j of upcoming) {
    const d = startOfDay(new Date(j.start));
    const g = groups.find((x) => sameDay(x.day, d));
    if (g) g.jobs.push(j);
    else groups.push({ day: d, jobs: [j] });
  }
  if (!groups.length) {
    return (
      <Card>
        <Text style={type.small}>No upcoming jobs.</Text>
      </Card>
    );
  }
  return (
    <View>
      {groups.map((g) => (
        <View key={g.day.toISOString()} style={{ marginBottom: space(2) }}>
          <Text style={[type.label, { marginBottom: space(2), marginTop: space(2) }]}>{fmtDay(g.day)}</Text>
          {g.jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Workload({ jobs, weekStart }: { jobs: Job[]; weekStart: Date }) {
  const team = useStore((s) => s.team);
  const end = addDays(weekStart, 7);
  const week = jobs.filter((j) => new Date(j.start) >= weekStart && new Date(j.start) < end);
  const techs = team.filter((m) => m.role === 'technician');
  const max = Math.max(1, ...techs.map((t) => week.filter((j) => j.assigneeId === t.id).reduce((s, j) => s + j.durationMins, 0)));
  return (
    <View style={{ marginTop: space(4) }}>
      <Text style={[type.label, { marginBottom: space(2) }]}>Team workload this week</Text>
      <Card>
        {techs.map((t) => {
          const mins = week.filter((j) => j.assigneeId === t.id).reduce((s, j) => s + j.durationMins, 0);
          return (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: 6 }}>
              <Avatar name={t.name} color={t.color} size={26} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={type.body}>{t.name}</Text>
                  <Text style={type.small}>{(mins / 60).toFixed(1)} h</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${(mins / max) * 100}%`, backgroundColor: t.color }]} />
                </View>
              </View>
            </View>
          );
        })}
        {week.some((j) => !j.assigneeId) ? (
          <Text style={[type.small, { color: colors.danger, marginTop: space(2) }]}>
            {week.filter((j) => !j.assigneeId).length} unassigned job(s) this week
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space(3) },
  gridRow: { flexDirection: 'row' },
  gridHead: { flex: 1, textAlign: 'center', ...type.label, paddingVertical: 6 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4, minHeight: 46 },
  cellInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  weekStrip: { flexDirection: 'row', gap: space(1) },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDayActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  dow: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  dom: { fontSize: 18, fontWeight: '700', color: colors.text, marginVertical: 2 },
  barTrack: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});
