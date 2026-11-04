import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { timing } from '@/constants/motion';
import { colors, shadow } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import type { IconName } from '@/components/button';
import { SideMenuProvider } from '@/components/side-menu';

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  matches: { label: 'Matches', icon: 'heart-outline', iconActive: 'heart' },
  inbox: { label: 'Interests', icon: 'mail-outline', iconActive: 'mail' },
  chats: { label: 'Chats', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  me: { label: 'Profile', icon: 'person-circle-outline', iconActive: 'person-circle' },
};

export default function TabsLayout() {
  return (
    <SideMenuProvider>
      <Tabs
        screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: colors.bg } }}
        tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="matches" />
        <Tabs.Screen name="inbox" />
        <Tabs.Screen name="chats" />
        <Tabs.Screen name="me" />
      </Tabs>
    </SideMenuProvider>
  );
}

function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { pendingIncoming, unreadChats } = useActivity();
  const badges: Record<string, number> = { inbox: pendingIncoming, chats: unreadChats };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        return (
          <TabItem
            key={route.key}
            label={tab.label}
            icon={focused ? tab.iconActive : tab.icon}
            focused={focused}
            badge={badges[route.name]}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync();
                navigateToTab(route.key);
              }
            }}
          />
        );
      })}
    </View>
  );
}

function TabItem({
  label,
  icon,
  focused,
  badge,
  onPress,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const progress = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(focused ? 1 : 0, timing));
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.5 + progress.value * 0.5 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * 2 }, { scale: 1 + progress.value * 0.12 }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label}>
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.pill, pillStyle]} />
        <Animated.View style={iconStyle}>
          <Ionicons name={icon} size={23} color={focused ? colors.primary : colors.textFaint} />
        </Animated.View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingTop: 8,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...shadow.raised,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 60, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { ...StyleSheet.absoluteFill, borderRadius: 16, backgroundColor: colors.primarySoft },
  label: { fontSize: 11, fontWeight: '600', color: colors.textFaint },
  labelActive: { color: colors.primary, fontWeight: '800' },
  badge: {
    position: 'absolute',
    top: -3,
    right: 8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primaryBright,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
});
