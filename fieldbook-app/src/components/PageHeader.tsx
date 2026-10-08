import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { space, type } from '../theme';

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: space(4), marginTop: space(2) }}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={[type.small, { marginBottom: 2 }]}>{subtitle}</Text> : null}
        <Text style={type.title}>{title}</Text>
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: space(1) }}>{right}</View> : null}
    </View>
  );
}
