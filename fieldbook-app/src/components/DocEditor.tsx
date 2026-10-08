import { useState } from 'react';
import { Text, View } from 'react-native';

import { parseAmount } from '../lib/money';
import { useStore } from '../store/store';
import type { DocInput } from '../store/store';
import type { ID } from '../store/types';
import { space, type } from '../theme';
import { CustomerPicker, LineItemsEditor, notify, TotalsCard } from './domain';
import { Button, Card, Field, Screen } from './ui';

/** Shared editor for estimates and invoices — they have identical pricing shapes. */
export function DocEditor({
  initial,
  saveLabel,
  onSave,
}: {
  initial: DocInput;
  saveLabel: string;
  onSave: (input: DocInput) => void;
}) {
  const customers = useStore((s) => s.customers);
  const [customerId, setCustomerId] = useState<ID | undefined>(initial.customerId || undefined);
  const [title, setTitle] = useState(initial.title);
  const [items, setItems] = useState(initial.items);
  const [discount, setDiscount] = useState(initial.discount ? String(initial.discount) : '');
  const [taxRate, setTaxRate] = useState(String(initial.taxRate));
  const [notes, setNotes] = useState(initial.notes);

  const draft: DocInput = {
    customerId: customerId ?? '',
    jobId: initial.jobId,
    title,
    items,
    discount: parseAmount(discount),
    taxRate: parseAmount(taxRate),
    notes,
  };

  const save = () => {
    if (!customerId || !customers.some((c) => c.id === customerId)) return notify('Choose a customer');
    if (!title.trim()) return notify('Add a title');
    const clean = items.filter((i) => i.description.trim() || i.unitPrice);
    if (!clean.length) return notify('Add at least one line item');
    onSave({ ...draft, title: title.trim(), items: clean });
  };

  return (
    <Screen footer={<Button title={saveLabel} onPress={save} style={{ flex: 1 }} />}>
      <CustomerPicker value={customerId} onChange={setCustomerId} />
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Water heater replacement" />
      <Text style={[type.label, { marginTop: space(2) }]}>Line items</Text>
      <Card style={{ paddingVertical: 0, marginTop: space(2) }}>
        <LineItemsEditor items={items} onChange={setItems} />
      </Card>
      <View style={{ flexDirection: 'row', gap: space(3), marginTop: space(2) }}>
        <Field label="Discount ($)" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" placeholder="0.00" style={{ flex: 1 }} />
        <Field label="Tax rate (%)" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" style={{ flex: 1 }} />
      </View>
      <TotalsCard pricing={draft} />
      <Field label="Notes to customer" value={notes} onChangeText={setNotes} placeholder="Warranty, terms, scope…" multiline style={{ marginTop: space(2) }} />
    </Screen>
  );
}
