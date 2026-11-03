import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { IconButton } from './button';

/**
 * Keeps the focused input above the keyboard. Android apps draw edge-to-edge (Expo SDK 54+), so the
 * window no longer shrinks when the keyboard opens — padding is needed on Android too, not just iOS.
 * On a device that still resizes the window, the measured overlap is 0 and nothing is added.
 */
export function KeyboardScreen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.fill, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}

/**
 * White status bar icons for a screen with a dark header. The screen stays mounted under whatever opens on
 * top of it, and those mostly have light headers, so this only applies while the screen is the one showing.
 */
export function LightStatusBar() {
  return useIsFocused() ? <StatusBar style="light" /> : null;
}

/** Standard top bar for stack screens: back button, title, optional right-side actions. */
export function Header({
  title,
  subtitle,
  right,
  back = true,
  transparent,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
  transparent?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }, !transparent && styles.headerSolid]}>
      {back ? (
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          background={transparent ? 'rgba(255,255,255,0.92)' : colors.surfaceAlt}
          size={40}
        />
      ) : null}
      <View style={styles.titles}>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

/** Big title used at the top of each tab. */
export function TabTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabTitle, { paddingTop: insets.top + 12 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tabTitleText}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSolid: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  titles: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabTitle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  tabTitleText: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
});
