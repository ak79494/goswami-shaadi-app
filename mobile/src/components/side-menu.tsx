import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { easeOut, easeIn } from '@/constants/motion';
import { colors, gradients, radius } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { shareMyBiodata } from '@/lib/biodata';
import { APP_VERSION } from '@/lib/config';
import { fullName, longDate } from '@/lib/format';
import { Avatar } from './avatar';
import { Button, type IconName } from './button';
import { IdSearchSheet } from './id-search';
import { useToast } from './toast';

const SideMenuContext = createContext<(() => void) | null>(null);

/** Provides the ☰ menu to the tab screens; call useSideMenu() to get a function that opens it. */
export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <SideMenuContext.Provider value={() => setOpen(true)}>
      {children}
      <SideMenu visible={open} onClose={() => setOpen(false)} onSearch={() => setSearchOpen(true)} />
      <IdSearchSheet visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </SideMenuContext.Provider>
  );
}

export function useSideMenu() {
  const open = useContext(SideMenuContext);
  if (!open) throw new Error('useSideMenu must be used inside SideMenuProvider');
  return open;
}

function SideMenu({ visible, onClose, onSearch }: { visible: boolean; onClose: () => void; onSearch: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.84, 340);
  const { profile, photos, premium, isAdmin, signOut } = useAuth();
  const toast = useToast();
  const [mounted, setMounted] = useState(visible);
  const [makingBiodata, setMakingBiodata] = useState(false);
  if (visible && !mounted) setMounted(true);

  const progress = useSharedValue(0);
  useEffect(() => {
    if (visible) progress.set(withTiming(1, { duration: 250, easing: easeOut }));
    else
      progress.set(
        withTiming(0, { duration: 200, easing: easeIn }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
  }, [visible, progress]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (progress.value - 1) * panelWidth }] }));

  if (!profile) return null;
  const myPhoto = photos.find((p) => p.primaryPhoto)?.url ?? photos[0]?.url;
  const isPremium = !!premium?.active;

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  const biodata = async () => {
    setMakingBiodata(true);
    try {
      await shareMyBiodata(profile, photos);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setMakingBiodata(false);
    }
  };

  const logout = () =>
    Alert.alert('Log out?', 'You can log back in any time with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          onClose();
          signOut();
        },
      },
    ]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View style={[styles.panel, { width: panelWidth }, panelStyle]}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.head, { paddingTop: insets.top + 18 }]}>
            <View style={styles.headRow}>
              <Avatar uri={myPhoto} name={fullName(profile)} size={64} ring="rgba(255,255,255,0.85)" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {fullName(profile)}
                </Text>
                <Text style={styles.id}>{profile.user.goswamiId}</Text>
                <View style={[styles.plan, isPremium && styles.planPremium]}>
                  <Ionicons name={isPremium ? 'diamond' : 'person-outline'} size={12} color={isPremium ? colors.gold : colors.white} />
                  <Text style={[styles.planText, isPremium && { color: colors.gold }]}>
                    {isPremium ? `${premium?.planName ?? 'Premium'} · till ${longDate(premium?.validUntil)}` : 'Free Account'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.headButtons}>
              <Button title="Edit Profile" icon="create-outline" variant="light" size="sm" onPress={() => go('/me')} style={{ flex: 1 }} />
              <Button
                title={isPremium ? 'Renew' : 'Upgrade'}
                icon="diamond-outline"
                variant="outlineLight"
                size="sm"
                onPress={() => go('/premium')}
                style={{ flex: 1 }}
              />
            </View>
          </LinearGradient>

          <View style={styles.items}>
            <Item icon="diamond-outline" tint={colors.gold} label={isPremium ? 'Renew Premium' : 'Upgrade to Premium'} onPress={() => go('/premium')} />
            <Item
              icon="search-outline"
              label="Search by Profile ID"
              onPress={() => {
                onClose();
                setTimeout(onSearch, 220);
              }}
            />
            <Item icon="options-outline" label="Partner Preferences" onPress={() => go('/preferences')} />
            <Item icon="document-text-outline" label={makingBiodata ? 'Preparing biodata…' : 'Download Biodata'} onPress={biodata} />
            <Item icon="planet-outline" label="Astro Chat" onPress={() => go('/astro')} />
            <Item icon="shield-checkmark-outline" label="Privacy Settings" onPress={() => go('/privacy')} />
            <Item icon="ban-outline" label="Blocked Members" onPress={() => go('/blocked')} />
            <Item icon="help-buoy-outline" label="Help & Support" onPress={() => go('/help')} />
            <Item icon="information-circle-outline" label="About Goswami Shaadi" onPress={() => go('/about')} />
            {isAdmin ? <Item icon="briefcase-outline" label="Admin panel" onPress={() => go('/admin')} /> : null}
            <View style={styles.divider} />
            <Item icon="log-out-outline" label="Log out" danger onPress={logout} />
          </View>
          <Text style={styles.version}>Goswami Shaadi v{APP_VERSION}</Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function Item({ icon, label, onPress, tint, danger }: { icon: IconName; label: string; onPress: () => void; tint?: string; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.primarySoft }]} accessibilityRole="button">
      <Ionicons name={icon} size={21} color={danger ? colors.primaryBright : tint ?? colors.primary} />
      <Text style={[styles.itemText, danger && { color: colors.primaryBright }]}>{label}</Text>
      {!danger ? <Ionicons name="chevron-forward" size={16} color={colors.textFaint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  panel: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.surface, borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg, overflow: 'hidden' },
  head: { paddingHorizontal: 18, paddingBottom: 18 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { color: colors.white, fontSize: 19, fontWeight: '800' },
  id: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  planPremium: { backgroundColor: 'rgba(14,16,32,0.35)' },
  planText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  headButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  items: { paddingTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  itemText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 6, marginHorizontal: 20 },
  version: { textAlign: 'center', color: colors.textFaint, fontSize: 11, marginTop: 16 },
});
