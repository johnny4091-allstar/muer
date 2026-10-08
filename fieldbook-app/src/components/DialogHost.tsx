import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { create } from 'zustand';

import { colors, radius, shadow, space, type } from '../theme';
import { Button } from './ui';

interface DialogRequest {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm?: () => void; // absent → informational dialog with a single OK
}

export const useDialog = create<{ current: DialogRequest | null }>(() => ({ current: null }));

export const showDialog = (req: DialogRequest) => useDialog.setState({ current: req });

/**
 * In-app replacement for window.alert/confirm on web, where browsers (and embedded
 * viewers) may suppress native dialogs. Native platforms keep using Alert.
 */
export function DialogHost() {
  const current = useDialog((s) => s.current);
  const close = () => useDialog.setState({ current: null });
  if (!current) return null;
  const isConfirm = !!current.onConfirm;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close} accessibilityLabel="Close dialog">
        <Pressable style={s.card} onPress={() => {}} accessibilityRole="alert">
          <Text style={type.h2}>{current.title}</Text>
          {current.message ? <Text style={[type.body, { color: colors.textMuted, marginTop: space(2) }]}>{current.message}</Text> : null}
          <View style={s.actions}>
            {isConfirm ? <Button title="Cancel" variant="secondary" onPress={close} style={{ flex: 1 }} /> : null}
            <Button
              title={isConfirm ? current.confirmLabel ?? 'Confirm' : 'OK'}
              onPress={() => {
                close();
                current.onConfirm?.();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,26,18,0.45)', alignItems: 'center', justifyContent: 'center', padding: space(6) },
  card: { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space(5), ...shadow },
  actions: { flexDirection: 'row', gap: space(3), marginTop: space(5) },
});
