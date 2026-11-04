import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { easeOut } from '@/constants/motion';
import { colors, radius, shadow } from '@/constants/theme';

type Kind = 'success' | 'error' | 'info';
type ToastItem = { id: number; message: string; kind: Kind };

const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => {});

const ICONS = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' } as const;
const TINT = { success: colors.success, error: colors.primary, info: colors.text } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, kind: Kind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
          <Animated.View key={toast.id} entering={SlideInUp.duration(240).easing(easeOut)} exiting={FadeOutUp} style={styles.toast}>
            <Ionicons name={ICONS[toast.kind]} size={22} color={TINT[toast.kind]} />
            <Text style={styles.text}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 520,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.raised,
  },
  text: { flexShrink: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
});
