import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients, radius } from '@/constants/theme';
import { Button, type IconName } from './button';

/** Grey placeholder block that gently pulses while data loads. */
export function Skeleton({
  width = '100%',
  height = 16,
  rounded = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: rounded, backgroundColor: '#F3E6EA' }, animatedStyle, style]} />;
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={380} rounded={radius.lg} />
      <Skeleton width="60%" height={20} style={{ marginTop: 14 }} />
      <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
}

export function RowSkeleton() {
  return (
    <View style={styles.rowSkeleton}>
      <Skeleton width={56} height={56} rounded={28} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="55%" height={15} />
        <Skeleton width="80%" height={12} />
      </View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    ));
  }, [y]);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
      <Animated.View style={floatStyle}>
        <LinearGradient colors={gradients.brandSoft} style={styles.emptyIcon}>
          <Ionicons name={icon} size={40} color={colors.primary} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: 20, alignSelf: 'center' }} />
      ) : null}
    </Animated.View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Animated.View entering={FadeInDown} style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={22} color={colors.primary} />
      <Text style={styles.bannerText}>{message}</Text>
      {onRetry ? (
        <Text style={styles.bannerAction} onPress={onRetry}>
          Retry
        </Text>
      ) : null}
    </Animated.View>
  );
}

/** Horizontal bar that animates up to `value` (0–100). */
export function ProgressBar({ value, height = 8, light }: { value: number; height?: number; light?: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(Math.max(0, Math.min(100, value)), { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value, progress]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: light ? 'rgba(255,255,255,0.3)' : colors.primaryTint, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height / 2, overflow: 'hidden' }, fillStyle]}>
        <LinearGradient
          colors={light ? ['#FFFFFF', '#FFE1E7'] : gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: { marginHorizontal: 16, marginBottom: 20 },
  rowSkeleton: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyMessage: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.primaryTint,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
  bannerAction: { color: colors.primary, fontWeight: '800', fontSize: 14, padding: 4 },
});
