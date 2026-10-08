import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { addDays, fmtTime, sameDay, startOfDay } from '../lib/dates';
import { uid } from '../lib/id';
import { currency, lineTotal, parseAmount, totals } from '../lib/money';
import { useStore } from '../store/store';
import type { ID, Job, LineItem, Pricing } from '../store/types';
import { colors, jobTone, radius, space, type } from '../theme';
import { showDialog } from './DialogHost';
import { Avatar, Badge, Card, KeyValue, styles as ui, type IconName } from './ui';

/** Cross-platform confirm: native Alert on devices, an in-app dialog on web. */
export function confirm(title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirm') {
  if (Platform.OS === 'web') {
    showDialog({ title, message, confirmLabel, onConfirm });
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    showDialog({ title, message });
    return;
  }
  Alert.alert(title, message);
}

export function JobCard({ job, showDate }: { job: Job; showDate?: boolean }) {
  const customer = useStore((s) => s.customers.find((c) => c.id === job.customerId));
  const tech = useStore((s) => s.team.find((m) => m.id === job.assigneeId));
  const tone = jobTone[job.status];
  const done = job.checklist.filter((c) => c.done).length;
  const end = new Date(new Date(job.start).getTime() + job.durationMins * 60_000).toISOString();
  return (
    <Card onPress={() => router.push(`/job/${job.id}`)} style={{ flexDirection: 'row', gap: space(3) }}>
      <View style={[jc.rail, { backgroundColor: tone.fg }]} />
      <View style={{ flex: 1 }}>
        <View style={jc.top}>
          <Text style={type.small}>
            {showDate
              ? new Date(job.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · '
              : ''}
            {fmtTime(job.start)} – {fmtTime(end)}
          </Text>
          <Badge {...tone} />
        </View>
        <Text style={[type.h3, { marginTop: 6 }]} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={[type.small, { marginTop: 2 }]} numberOfLines={1}>
          {customer?.name ?? 'Unknown customer'} · {job.address}
        </Text>
        <View style={jc.meta}>
          {tech ? (
            <View style={jc.metaItem}>
              <Avatar name={tech.name} color={tech.color} size={20} />
              <Text style={type.small}>{tech.name.split(' ')[0]}</Text>
            </View>
          ) : (
            <Text style={[type.small, { color: colors.danger }]}>Unassigned</Text>
          )}
          {job.checklist.length ? (
            <View style={jc.metaItem}>
              <Ionicons name="checkbox-outline" size={14} color={colors.textMuted} />
              <Text style={type.small}>
                {done}/{job.checklist.length}
              </Text>
            </View>
          ) : null}
          {job.recurrence !== 'none' ? (
            <View style={jc.metaItem}>
              <Ionicons name="repeat" size={14} color={colors.textMuted} />
              <Text style={type.small}>Recurring</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const jc = StyleSheet.create({
  rail: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space(2) },
  meta: { flexDirection: 'row', gap: space(4), marginTop: space(3), alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

const SLOTS = Array.from({ length: 23 }, (_, i) => 7 * 60 + i * 30); // 7:00 → 18:00

/** Touch-friendly date + time picker that works identically on iOS, Android and web. */
export function DateTimePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const current = new Date(value);
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => {
    const base = addDays(startOfDay(new Date()), weekOffset * 14);
    return Array.from({ length: 14 }, (_, i) => addDays(base, i));
  }, [weekOffset]);

  const setDay = (d: Date) => {
    const n = new Date(d);
    n.setHours(current.getHours(), current.getMinutes(), 0, 0);
    onChange(n.toISOString());
  };
  const setSlot = (mins: number) => {
    const n = new Date(current);
    n.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    onChange(n.toISOString());
  };
  const curMins = current.getHours() * 60 + current.getMinutes();

  return (
    <View style={{ marginBottom: space(4) }}>
      <View style={dt.header}>
        <Text style={ui.fieldLabel}>Date</Text>
        <View style={{ flexDirection: 'row', gap: space(3) }}>
          <Pressable onPress={() => setWeekOffset((w) => w - 1)} hitSlop={8} disabled={weekOffset <= -2}>
            <Ionicons name="chevron-back" size={20} color={weekOffset <= -2 ? colors.textFaint : colors.brand} />
          </Pressable>
          <Pressable onPress={() => setWeekOffset((w) => w + 1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.brand} />
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
        {days.map((d) => {
          const active = sameDay(d, current);
          return (
            <Pressable key={d.toISOString()} onPress={() => setDay(d)} style={[dt.day, active && dt.active]}>
              <Text style={[dt.dow, active && dt.activeText]}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[dt.dom, active && dt.activeText]}>{d.getDate()}</Text>
              <Text style={[dt.dow, active && dt.activeText]}>{d.toLocaleDateString('en-US', { month: 'short' })}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[ui.fieldLabel, { marginTop: space(4) }]}>Start time</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
        {SLOTS.map((m) => {
          const active = m === curMins;
          const d = new Date(2000, 0, 1, Math.floor(m / 60), m % 60);
          return (
            <Pressable key={m} onPress={() => setSlot(m)} style={[ui.chip, active && ui.chipActive]}>
              <Text style={[ui.chipText, active && { color: '#fff' }]}>
                {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const dt = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  day: {
    width: 58,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  active: { backgroundColor: colors.brand, borderColor: colors.brand },
  activeText: { color: '#fff' },
  dow: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dom: { fontSize: 20, fontWeight: '700', color: colors.text, marginVertical: 2 },
});

export function MemberPicker({
  value,
  onChange,
  allowNone = true,
}: {
  value?: ID;
  onChange: (id: ID | undefined) => void;
  allowNone?: boolean;
}) {
  const team = useStore((s) => s.team);
  const techs = team.filter((m) => m.role === 'technician');
  return (
    <View style={{ marginBottom: space(4) }}>
      <Text style={ui.fieldLabel}>Assign technician</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(2) }}>
        {allowNone ? (
          <Pressable onPress={() => onChange(undefined)} style={[ui.chip, !value && ui.chipActive]}>
            <Text style={[ui.chipText, !value && { color: '#fff' }]}>Unassigned</Text>
          </Pressable>
        ) : null}
        {techs.map((m) => {
          const active = m.id === value;
          return (
            <Pressable
              key={m.id}
              onPress={() => onChange(m.id)}
              style={[ui.chip, { flexDirection: 'row', alignItems: 'center', gap: 6 }, active && ui.chipActive]}
            >
              <Avatar name={m.name} color={m.color} size={20} />
              <Text style={[ui.chipText, active && { color: '#fff' }]}>{m.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CustomerPicker({ value, onChange }: { value?: ID; onChange: (id: ID) => void }) {
  const customers = useStore((s) => s.customers);
  const [q, setQ] = useState('');
  const selected = customers.find((c) => c.id === value);
  const [open, setOpen] = useState(!value);
  const matches = customers
    .filter((c) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 6);

  return (
    <View style={{ marginBottom: space(4) }}>
      <Text style={ui.fieldLabel}>Customer</Text>
      {selected && !open ? (
        <Pressable onPress={() => setOpen(true)} style={[ui.input, cp.selected]}>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>{selected.name}</Text>
            <Text style={type.small}>{selected.address}</Text>
          </View>
          <Text style={ui.link}>Change</Text>
        </Pressable>
      ) : (
        <View style={cp.box}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search customers"
            placeholderTextColor={colors.textFaint}
            style={[ui.input, { borderWidth: 0, borderBottomWidth: 1, borderRadius: 0 }]}
          />
          {matches.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                onChange(c.id);
                setOpen(false);
                setQ('');
              }}
              style={({ pressed }) => [cp.option, pressed && { backgroundColor: colors.surfaceAlt }]}
            >
              <Text style={type.h3}>{c.name}</Text>
              <Text style={type.small}>{c.address}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => router.push('/customer/new')} style={cp.option}>
            <Text style={ui.link}>+ New customer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const cp = StyleSheet.create({
  selected: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  box: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, overflow: 'hidden' },
  option: { paddingHorizontal: space(3), paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});

/** Editable line items with live per-line totals. Quantities/prices are kept as text while editing. */
export function LineItemsEditor({ items, onChange }: { items: LineItem[]; onChange: (items: LineItem[]) => void }) {
  const [drafts, setDrafts] = useState<Record<ID, { q: string; p: string }>>({});
  const update = (id: ID, patch: Partial<LineItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <View>
      {items.map((item, idx) => {
        const d = drafts[item.id] ?? { q: String(item.quantity), p: item.unitPrice ? String(item.unitPrice) : '' };
        return (
          <View key={item.id} style={li.item}>
            <View style={li.head}>
              <Text style={type.label}>Item {idx + 1}</Text>
              <Pressable
                onPress={() => onChange(items.filter((i) => i.id !== item.id))}
                hitSlop={8}
                accessibilityLabel="Remove item"
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
            <TextInput
              value={item.description}
              onChangeText={(t) => update(item.id, { description: t })}
              placeholder="Description"
              placeholderTextColor={colors.textFaint}
              style={[ui.input, { marginBottom: space(2) }]}
            />
            <View style={{ flexDirection: 'row', gap: space(2), alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={type.small}>Qty</Text>
                <TextInput
                  value={d.q}
                  keyboardType="decimal-pad"
                  onChangeText={(t) => {
                    setDrafts((s) => ({ ...s, [item.id]: { ...d, q: t } }));
                    update(item.id, { quantity: parseAmount(t) });
                  }}
                  style={ui.input}
                />
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={type.small}>Unit price</Text>
                <TextInput
                  value={d.p}
                  placeholder="0.00"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="decimal-pad"
                  onChangeText={(t) => {
                    setDrafts((s) => ({ ...s, [item.id]: { ...d, p: t } }));
                    update(item.id, { unitPrice: parseAmount(t) });
                  }}
                  style={ui.input}
                />
              </View>
              <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                <Text style={type.small}>Amount</Text>
                <Text style={[type.h3, { paddingVertical: 14 }]}>{currency(lineTotal(item))}</Text>
              </View>
            </View>
          </View>
        );
      })}
      <Pressable
        onPress={() => onChange([...items, { id: uid(), description: '', quantity: 1, unitPrice: 0 }])}
        style={li.add}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.brand} />
        <Text style={ui.link}>Add line item</Text>
      </Pressable>
    </View>
  );
}

const li = StyleSheet.create({
  item: { paddingVertical: space(3), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space(2) },
  add: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: space(4) },
});

export function TotalsCard({ pricing, paid }: { pricing: Pricing; paid?: number }) {
  const t = totals(pricing);
  return (
    <Card>
      <KeyValue label="Subtotal" value={currency(t.subtotal)} />
      {t.discount ? <KeyValue label="Discount" value={`– ${currency(t.discount)}`} /> : null}
      <KeyValue label={`Tax (${pricing.taxRate}%)`} value={currency(t.tax)} />
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: space(2) }} />
      <KeyValue label="Total" value={currency(t.total)} strong />
      {paid != null ? (
        <>
          <KeyValue label="Paid" value={currency(paid)} />
          <KeyValue label="Balance due" value={currency(Math.max(t.total - paid, 0))} strong />
        </>
      ) : null}
    </Card>
  );
}

export function LineItemsTable({ items }: { items: LineItem[] }) {
  return (
    <Card>
      {items.map((i, idx) => (
        <View
          key={i.id}
          style={[
            { flexDirection: 'row', paddingVertical: space(2), gap: space(3) },
            idx < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={type.body}>{i.description || 'Untitled item'}</Text>
            <Text style={type.small}>
              {i.quantity} × {currency(i.unitPrice)}
            </Text>
          </View>
          <Text style={type.h3}>{currency(lineTotal(i))}</Text>
        </View>
      ))}
      {!items.length ? <Text style={type.small}>No line items.</Text> : null}
    </Card>
  );
}

export function HeaderButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={label} style={{ paddingHorizontal: 8 }}>
      <Ionicons name={icon} size={24} color={colors.brand} />
    </Pressable>
  );
}
