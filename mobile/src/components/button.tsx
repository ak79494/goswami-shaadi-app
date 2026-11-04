import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, gradients, radius } from '@/constants/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type PressableScaleProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  accessibilityLabel?: string;
  hitSlop?: number;
};

/**
 * A Pressable that presses down slightly when touched — used for every tappable card and button.
 * The inner Pressable deliberately has no flex/flexGrow: on Android, Yoga grows such a child to the
 * full height of the surrounding ScrollView. Put fixed sizes on a View inside it instead.
 */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  scaleTo = 0.96,
  haptic = false,
  accessibilityLabel,
  hitSlop,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        hitSlop={hitSlop}
        onPressIn={() => {
          scale.set(withTiming(scaleTo, { duration: 90 }));
        }}
        onPressOut={() => {
          scale.set(withTiming(1, { duration: 140 }));
        }}
        onPress={() => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onLongPress={onLongPress}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'light' | 'outlineLight' | 'success' | 'muted';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  style,
}: ButtonProps) {
  const height = size === 'lg' ? 56 : size === 'sm' ? 38 : 48;
  const fontSize = size === 'sm' ? 13 : 15;
  const fg = FOREGROUND[variant];
  const content = (
    <View style={[styles.inner, { height, paddingHorizontal: size === 'sm' ? 14 : 20 }]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={fontSize + 3} color={fg} /> : null}
          <Text style={[styles.label, { color: fg, fontSize }]} numberOfLines={1}>
            {title}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={fontSize + 3} color={fg} /> : null}
        </>
      )}
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      haptic
      accessibilityLabel={title}
      style={[styles.base, { opacity: disabled ? 0.5 : 1 }, BOX[variant], style]}>
      {variant === 'primary' ? (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </PressableScale>
  );
}

/** Round icon-only button used in headers and on photos. */
export function IconButton({
  icon,
  onPress,
  color = colors.text,
  background = colors.surface,
  size = 42,
  badge,
  accessibilityLabel,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  background?: string;
  size?: number;
  badge?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale onPress={onPress} haptic scaleTo={0.9} accessibilityLabel={accessibilityLabel} hitSlop={6} style={style}>
      <View style={[styles.iconBtn, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}>
        <Ionicons name={icon} size={size * 0.5} color={color} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const FOREGROUND: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.primary,
  ghost: colors.primary,
  light: colors.primary,
  outlineLight: colors.white,
  success: colors.white,
  muted: colors.textMuted,
};

const BOX: Record<Variant, ViewStyle> = {
  primary: {},
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  light: { backgroundColor: colors.white },
  outlineLight: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.75)' },
  success: { backgroundColor: colors.success },
  muted: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
};

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, overflow: 'hidden' },
  gradient: { borderRadius: radius.pill },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontWeight: '700', letterSpacing: 0.2, includeFontPadding: false },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primaryBright,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
});
