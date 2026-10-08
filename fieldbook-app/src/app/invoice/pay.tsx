import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { notify } from '../../components/domain';
import { Button, Card, Chips, Empty, Field, Screen, styles as ui } from '../../components/ui';
import { balanceOf, currency, parseAmount } from '../../lib/money';
import { useStore } from '../../store/store';
import type { PaymentMethod } from '../../store/types';
import { space, type } from '../../theme';

export default function RecordPayment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inv = useStore((s) => s.invoices.find((i) => i.id === id));
  const payments = useStore((s) => s.payments);
  const recordPayment = useStore((s) => s.recordPayment);
  const balance = inv ? balanceOf(inv, payments) : 0;
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [reference, setReference] = useState('');

  if (!inv) {
    return (
      <Screen>
        <Empty icon="receipt-outline" title="Invoice not found" />
      </Screen>
    );
  }

  const save = () => {
    const value = Math.round(parseAmount(amount) * 100) / 100;
    if (value <= 0) return notify('Enter an amount greater than zero');
    if (value > balance + 0.001) return notify('Amount exceeds balance', `The remaining balance is ${currency(balance)}.`);
    recordPayment({ invoiceId: inv.id, amount: value, method, reference: reference.trim(), receivedAt: new Date().toISOString() });
    router.back();
  };

  return (
    <Screen footer={<Button title="Record payment" icon="checkmark" onPress={save} style={{ flex: 1 }} />}>
      <Card style={{ alignItems: 'center', paddingVertical: space(5) }}>
        <Text style={type.small}>Invoice #{inv.number} balance</Text>
        <Text style={{ fontSize: 30, fontWeight: '700', marginTop: 4 }}>{currency(balance)}</Text>
      </Card>
      <Field label="Amount received" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <View style={{ marginBottom: space(4) }}>
        <Text style={ui.fieldLabel}>Method</Text>
        <Chips<PaymentMethod>
          value={method}
          onChange={setMethod}
          options={[
            { value: 'card', label: 'Card' },
            { value: 'cash', label: 'Cash' },
            { value: 'check', label: 'Check' },
            { value: 'bank', label: 'Bank transfer' },
          ]}
        />
      </View>
      <Field label="Reference" value={reference} onChangeText={setReference} placeholder="Check #, transaction ID…" />
    </Screen>
  );
}
