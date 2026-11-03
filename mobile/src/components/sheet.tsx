import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { easeOut, easeIn } from '@/constants/motion';
import { colors, radius, shadow } from '@/constants/theme';
import type { IconName } from './button';

/**
 * Bottom sheet used by every dropdown, filter and action menu. It glides up on an ease-out curve
 * (no spring, so it never bounces) and slides back down before the modal closes.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  style,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      progress.set(withTiming(1, { duration: 260, easing: easeOut }));
    } else {
      progress.set(
        withTiming(0, { duration: 190, easing: easeIn }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, progress]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * sheetHeight.value }] }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
          <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          onLayout={(e) => sheetHeight.set(e.nativeEvent.layout.height)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 12 }, sheetStyle, style]}>
          <View style={styles.grabber} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type SheetAction = {
  label: string;
  icon?: IconName;
  destructive?: boolean;
  onPress: () => void;
};

/**
 * A list of choices with a Cancel button — replaces Alert menus, which Android cuts off after three
 * buttons and which can't be dismissed with a clear Cancel.
 */
export function ActionSheet({
  visible,
  title,
  message,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  message?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => {
              onClose();
              // Let the sheet finish closing before the action opens anything else.
              setTimeout(a.onPress, 220);
            }}
            style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.primarySoft }]}
            accessibilityRole="button">
            {a.icon ? <Ionicons name={a.icon} size={20} color={a.destructive ? colors.primaryBright : colors.text} /> : null}
            <Text style={[styles.actionText, a.destructive && { color: colors.primaryBright }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]} accessibilityRole="button">
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...shadow.raised,
  },
  grabber: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  message: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: -4, marginBottom: 10 },
  actions: { borderRadius: radius.md, overflow: 'hidden' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionText: { fontSize: 16, fontWeight: '600', color: colors.text },
  cancel: {
    marginTop: 12,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: colors.text },
});
