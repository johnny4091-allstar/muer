import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStore } from '../store/store';
import { colors } from '../theme';

export default function RootLayout() {
  const hydrated = useStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.brand,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Job' }} />
        <Stack.Screen name="job/new" options={{ title: 'New job', presentation: 'modal' }} />
        <Stack.Screen name="customer/[id]" options={{ title: 'Customer' }} />
        <Stack.Screen name="customer/new" options={{ title: 'New customer', presentation: 'modal' }} />
        <Stack.Screen name="estimate/[id]" options={{ title: 'Estimate' }} />
        <Stack.Screen name="estimate/edit" options={{ title: 'Estimate', presentation: 'modal' }} />
        <Stack.Screen name="invoice/[id]" options={{ title: 'Invoice' }} />
        <Stack.Screen name="invoice/edit" options={{ title: 'Invoice', presentation: 'modal' }} />
        <Stack.Screen name="invoice/pay" options={{ title: 'Record payment', presentation: 'modal' }} />
        <Stack.Screen name="request/[id]" options={{ title: 'Booking request' }} />
        <Stack.Screen name="requests" options={{ title: 'Booking requests' }} />
        <Stack.Screen name="book" options={{ title: 'Online booking page' }} />
        <Stack.Screen name="reports" options={{ title: 'Reports' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
