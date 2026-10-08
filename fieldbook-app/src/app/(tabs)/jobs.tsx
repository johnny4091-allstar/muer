import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { HeaderButton, JobCard } from '../../components/domain';
import { PageHeader } from '../../components/PageHeader';
import { Chips, Empty, Screen, styles as ui } from '../../components/ui';
import { useMe, useStore } from '../../store/store';
import type { JobStatus } from '../../store/types';
import { colors, space } from '../../theme';

type Filter = 'active' | JobStatus | 'all';

export default function Jobs() {
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const me = useMe();
  const allJobs = useStore((s) => s.jobs);
  const customers = useStore((s) => s.customers);
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'active');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (params.filter) setFilter(params.filter);
  }, [params.filter]);

  const isOffice = me.role === 'office';
  const jobs = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = allJobs
      .filter((j) => isOffice || j.assigneeId === me.id)
      .filter((j) => {
        if (filter === 'all') return true;
        if (filter === 'active') return j.status === 'scheduled' || j.status === 'in_progress';
        return j.status === filter;
      })
      .filter((j) => {
        if (!term) return true;
        const c = customers.find((x) => x.id === j.customerId);
        return `${j.title} ${j.address} ${c?.name ?? ''} #${j.number}`.toLowerCase().includes(term);
      });
    // Active work soonest-first; history most-recent-first.
    const asc = filter === 'active' || filter === 'scheduled' || filter === 'in_progress';
    return list.sort((a, b) => (asc ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start)));
  }, [allJobs, customers, filter, q, isOffice, me.id]);

  return (
    <Screen edges={['top']}>
      <PageHeader
        title={isOffice ? 'Jobs' : 'My jobs'}
        right={isOffice ? <HeaderButton icon="add" label="New job" onPress={() => router.push('/job/new')} /> : null}
      />
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search by customer, address, or job #"
        placeholderTextColor={colors.textFaint}
        style={[ui.input, { marginBottom: space(3) }]}
      />
      <View style={{ marginBottom: space(4) }}>
        <Chips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>
      {jobs.length ? (
        jobs.map((j) => <JobCard key={j.id} job={j} showDate />)
      ) : (
        <Empty icon="construct-outline" title="No jobs here" body="Try a different filter or search." />
      )}
    </Screen>
  );
}
