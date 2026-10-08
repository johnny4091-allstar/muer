import { router, Stack, useLocalSearchParams } from 'expo-router';

import { DocEditor } from '../../components/DocEditor';
import { uid } from '../../lib/id';
import { useStore } from '../../store/store';

export default function EstimateEdit() {
  const params = useLocalSearchParams<{ id?: string; jobId?: string; customerId?: string }>();
  const existing = useStore((s) => s.estimates.find((e) => e.id === params.id));
  const job = useStore((s) => s.jobs.find((j) => j.id === params.jobId));
  const taxRate = useStore((s) => s.business.taxRate);
  const saveEstimate = useStore((s) => s.saveEstimate);

  const initial = existing ?? {
    customerId: job?.customerId ?? params.customerId ?? '',
    jobId: job?.id,
    title: job?.title ?? '',
    items: [{ id: uid(), description: '', quantity: 1, unitPrice: 0 }],
    discount: 0,
    taxRate,
    notes: '',
  };

  return (
    <>
      <Stack.Screen options={{ title: existing ? `Edit estimate #${existing.number}` : 'New estimate' }} />
      <DocEditor
        initial={initial}
        saveLabel={existing ? 'Save estimate' : 'Create estimate'}
        onSave={(input) => {
          const id = saveEstimate(input, existing?.id);
          if (existing) router.back();
          else router.replace(`/estimate/${id}`);
        }}
      />
    </>
  );
}
