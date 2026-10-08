import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useMe, useStore } from '../../store/store';
import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon =
  (name: IconName, active: IconName) =>
  ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : name} color={color as string} size={size} />
  );

export default function TabsLayout() {
  const me = useMe();
  const isOffice = me.role === 'office';
  const newRequests = useStore((s) => s.requests.filter((r) => r.status === 'new').length);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isOffice ? 'Home' : 'My day',
          tabBarIcon: icon('home-outline', 'home'),
          tabBarBadge: isOffice && newRequests ? newRequests : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent },
        }}
      />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs', tabBarIcon: icon('construct-outline', 'construct') }} />
      <Tabs.Screen
        name="customers"
        options={{ title: 'Customers', tabBarIcon: icon('people-outline', 'people'), href: isOffice ? undefined : null }}
      />
      <Tabs.Screen
        name="money"
        options={{ title: 'Money', tabBarIcon: icon('wallet-outline', 'wallet'), href: isOffice ? undefined : null }}
      />
    </Tabs>
  );
}
