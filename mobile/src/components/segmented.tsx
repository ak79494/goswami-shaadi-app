import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { timing } from '@/constants/motion';
import { colors, radius, shadow } from '@/constants/theme';

type Tab<K extends string> = { key: K; label: string; badge?: number };

/** Pill tabs with a sliding white indicator. */
export function Segmented<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab<K>[];
  value: K;
  onChange: (key: K) => void;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((t) => t.key === value));
  const segment = width > 0 ? (width - 8) / tabs.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withTiming(index * segment, timing));
  }, [index, segment, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {segment > 0 ? <Animated.View style={[styles.indicator, { width: segment }, indicatorStyle]} /> : null}
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) Haptics.selectionAsync();
              onChange(t.key);
            }}
            style={styles.tab}>
            <Text style={[styles.label, tabs.length > 3 && styles.labelSmall, active && styles.labelActive]} numberOfLines={1}>
              {t.label}
            </Text>
            {t.badge ? (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{t.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  tab: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelSmall: { fontSize: 12 },
  labelActive: { color: colors.primary, fontWeight: '700' },
  badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: colors.primary },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  badgeTextActive: { color: colors.white },
});
