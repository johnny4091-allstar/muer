import { router, Stack, useLocalSearchParams } from 'expo-router';

import { DocEditor } from '../../components/DocEditor';
import { uid } from '../../lib/id';
import { useStore } from '../../store/store';

export default function InvoiceEdit() {
  const params = useLocalSearchParams<{ id?: string; customerId?: string }>();
  const existing = useStore((s) => s.invoices.find((i) => i.id === params.id));
  const taxRate = useStore((s) => s.business.taxRate);
  const saveInvoice = useStore((s) => s.saveInvoice);

  const initial = existing ?? {
    customerId: params.customerId ?? '',
    title: '',
    items: [{ id: uid(), description: '', quantity: 1, unitPrice: 0 }],
    discount: 0,
    taxRate,
    notes: '',
  };

  return (
    <>
      <Stack.Screen options={{ title: existing ? `Edit invoice #${existing.number}` : 'New invoice' }} />
      <DocEditor
        initial={initial}
        saveLabel={existing ? 'Save invoice' : 'Create invoice'}
        onSave={(input) => {
          const id = saveInvoice(input, existing?.id);
          if (existing) router.back();
          else router.replace(`/invoice/${id}`);
        }}
      />
    </>
  );
}
