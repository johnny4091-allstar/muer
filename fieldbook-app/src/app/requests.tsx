import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Empty, Screen, Segmented } from '../components/ui';
import { fmtDate, relativeDay } from '../lib/dates';
import { useStore } from '../store/store';
import type { RequestStatus } from '../store/types';
import { colors, requestTone, space, type } from '../theme';

export default function Requests() {
  const requests = useStore((s) => s.requests);
  const [tab, setTab] = useState<RequestStatus>('new');
  const list = requests.filter((r) => r.status === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (st: RequestStatus) => requests.filter((r) => r.status === st).length;

  return (
    <Screen>
      <Card style={{ backgroundColor: colors.brandSoft, borderColor: colors.brandSoft }}>
        <Text style={type.h3}>Your online booking page</Text>
        <Text style={[type.small, { marginTop: 4 }]}>Customers request service there. Review each request, assign a technician, and it becomes a scheduled job.</Text>
        <Button title="Open booking page" icon="globe-outline" small variant="secondary" onPress={() => router.push('/book')} style={{ marginTop: space(3), alignSelf: 'flex-start' }} />
      </Card>
      <Segmented<RequestStatus>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'new', label: 'New', count: count('new') },
          { value: 'scheduled', label: 'Scheduled', count: count('scheduled') },
          { value: 'declined', label: 'Declined', count: count('declined') },
        ]}
      />
      {list.length ? (
        list.map((r) => (
          <Card key={r.id} onPress={() => router.push(`/request/${r.id}`)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={type.h3}>{r.service}</Text>
              <Badge {...requestTone[r.status]} />
            </View>
            <Text style={[type.small, { marginTop: 4 }]}>
              {r.name} · {r.address}
            </Text>
            <Text style={[type.small, { marginTop: 2 }]}>
              Prefers {relativeDay(r.preferredDate)}, {r.preferredWindow} · received {fmtDate(r.createdAt)}
            </Text>
          </Card>
        ))
      ) : (
        <Empty icon="mail-open-outline" title={tab === 'new' ? 'No new requests' : 'Nothing here yet'} />
      )}
    </Screen>
  );
}
