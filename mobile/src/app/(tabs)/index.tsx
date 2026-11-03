import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, IconButton, PressableScale, type IconName } from '@/components/button';
import { MiniMatchCard } from '@/components/cards';
import { EmptyState, ErrorBanner, ProgressBar, Skeleton } from '@/components/feedback';
import { LightStatusBar } from '@/components/screen';
import { useSideMenu } from '@/components/side-menu';
import { motion } from '@/constants/motion';
import { colors, gradients, radius, shadow } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { profileCompletion } from '@/lib/format';
import { rememberProfiles } from '@/lib/profiles';
import type { Page, Profile } from '@/lib/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { profile, photos, premium } = useAuth();
  const openMenu = useSideMenu();
  const { pendingIncoming, unreadNotifications, refresh } = useActivity();
  const [recommended, setRecommended] = useState<Profile[] | null>(null);
  const [active, setActive] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [fresh, recent] = await Promise.all([
        api.get<Page<Profile>>('/profiles/search?type=new&size=10'),
        api.get<Page<Profile>>('/profiles/search?type=active&size=10'),
      ]);
      rememberProfiles([...fresh.content, ...recent.content]);
      setRecommended(fresh.content);
      setActive(recent.content);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setRecommended((r) => r ?? []);
      setActive((a) => a ?? []);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch: state is only set once the request resolves
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refresh()]);
    setRefreshing(false);
  };

  const completion = profileCompletion(profile, photos.length);
  const myPhoto = photos.find((p) => p.primaryPhoto)?.url ?? photos[0]?.url;

  return (
    <View style={styles.root}>
      <LightStatusBar />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} colors={[colors.primary]} />}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <View style={styles.heroRow}>
            <IconButton icon="menu" accessibilityLabel="Open menu" color={colors.white} background="rgba(255,255,255,0.18)" onPress={openMenu} />
            <PressableScale onPress={() => router.navigate('/me')} accessibilityLabel="My profile">
              <Avatar uri={myPhoto} name={profile?.firstName} size={46} ring="rgba(255,255,255,0.8)" />
            </PressableScale>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroHello}>{greeting()},</Text>
              <Text style={styles.heroName} numberOfLines={1}>
                {profile?.firstName ?? 'there'}
              </Text>
            </View>
            <IconButton
              icon="notifications-outline"
              accessibilityLabel="Notifications"
              color={colors.primary}
              background={colors.white}
              badge={unreadNotifications}
              onPress={() => router.push('/notifications')}
            />
          </View>
          <Text style={styles.heroId}>Profile ID · {profile?.user.goswamiId}</Text>
        </LinearGradient>

        <Animated.View entering={motion.enter()} style={styles.completion}>
          <View style={styles.completionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.completionTitle}>{completion < 100 ? 'Complete your profile' : 'Profile complete'}</Text>
              <Text style={styles.completionSub}>
                {photos.length === 0
                  ? 'Members with photos get up to 10x more responses.'
                  : completion < 100
                    ? 'A complete profile builds trust with families.'
                    : 'Looking great! Your profile is ready to impress.'}
              </Text>
            </View>
            <Text style={styles.completionPct}>{completion}%</Text>
          </View>
          <ProgressBar value={completion} />
          {completion < 100 ? (
            <Button
              title={photos.length === 0 ? 'Add photos' : 'Complete profile'}
              icon={photos.length === 0 ? 'camera' : 'create-outline'}
              size="sm"
              variant="secondary"
              onPress={() => router.push(photos.length === 0 ? '/photos' : '/me')}
              style={{ alignSelf: 'flex-start', marginTop: 14 }}
            />
          ) : null}
        </Animated.View>

        {premium && !premium.active ? (
          <Animated.View entering={motion.enter(60)}>
            <PressableScale onPress={() => router.push('/premium')} scaleTo={0.98} accessibilityLabel="Upgrade to Premium">
              <LinearGradient colors={['#2B2140', '#4A2C5E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premium}>
                <View style={styles.premiumIcon}>
                  <Ionicons name="diamond" size={22} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumText}>See mobile numbers and message members on WhatsApp</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        ) : null}

        {pendingIncoming > 0 ? <InterestsAlert count={pendingIncoming} /> : null}

        {error ? <ErrorBanner message={error} onRetry={load} /> : null}

        <SectionTitle title="Daily Recommendations" subtitle="Handpicked new members for you" onSeeAll={() => router.navigate('/matches')} />
        <Carousel data={recommended} />

        <SectionTitle title="Recently Active" subtitle="Members who were online recently" onSeeAll={() => router.navigate('/matches?tab=active')} />
        <Carousel data={active} />

        <SectionTitle title="Quick actions" />
        <View style={styles.grid}>
          <QuickAction icon="options-outline" label="Partner preferences" onPress={() => router.push('/preferences')} index={0} />
          <QuickAction icon="star-outline" label="Shortlisted" onPress={() => router.navigate('/matches?tab=shortlist')} index={1} />
          <QuickAction icon="images-outline" label="My photos" onPress={() => router.push('/photos')} index={2} />
          <QuickAction icon="create-outline" label="Edit profile" onPress={() => router.navigate('/me')} index={3} />
        </View>

        <View style={styles.safety}>
          <Ionicons name="shield-checkmark" size={22} color={colors.success} />
          <Text style={styles.safetyText}>
            Stay safe: never share OTPs, bank details or money with anyone you meet here. Meet in public with family.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InterestsAlert({ count }: { count: number }) {
  const beat = useSharedValue(1);
  useEffect(() => {
    beat.set(withRepeat(
      withSequence(withTiming(1.25, { duration: 260 }), withTiming(1, { duration: 260 }), withTiming(1, { duration: 900, easing: Easing.linear })),
      -1,
    ));
  }, [beat]);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));
  return (
    <Animated.View entering={motion.enter(120)}>
      <PressableScale onPress={() => router.navigate('/inbox')} style={styles.alert} accessibilityLabel="Open interests">
        <View style={styles.alertRow}>
          <Animated.View style={[styles.alertIcon, heartStyle]}>
            <Ionicons name="heart" size={22} color={colors.white} />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>
              {count} {count === 1 ? 'person has' : 'people have'} shown interest in you
            </Text>
            <Text style={styles.alertSub}>Respond now — they’re waiting to hear back</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function SectionTitle({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionText}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
      {onSeeAll ? (
        <Text style={styles.seeAll} onPress={onSeeAll}>
          See all
        </Text>
      ) : null}
    </View>
  );
}

function Carousel({ data }: { data: Profile[] | null }) {
  if (data === null) {
    return (
      <View style={styles.carouselLoading}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={150} height={206} rounded={radius.lg} />
        ))}
      </View>
    );
  }
  if (data.length === 0) {
    return (
      <View style={styles.carouselEmpty}>
        <EmptyState icon="people-outline" title="No members yet" message="New members join every day. Check back soon!" />
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item, index }) => <MiniMatchCard profile={item} index={index} />}
      contentContainerStyle={styles.carousel}
      showsHorizontalScrollIndicator={false}
      snapToInterval={162}
      decelerationRate="fast"
    />
  );
}

function QuickAction({ icon, label, onPress, index }: { icon: IconName; label: string; onPress: () => void; index: number }) {
  return (
    <Animated.View entering={motion.enter(100 + index * 60)} style={styles.quickWrap}>
      <PressableScale onPress={onPress} style={styles.quick} accessibilityLabel={label}>
        <View style={styles.quickIcon}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <Text style={styles.quickLabel}>{label}</Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { paddingHorizontal: 20, paddingBottom: 64, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroHello: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  heroName: { color: colors.white, fontSize: 22, fontWeight: '800' },
  heroId: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 12, letterSpacing: 0.4 },
  completion: {
    marginHorizontal: 16,
    marginTop: -44,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    ...shadow.raised,
  },
  completionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  completionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  completionSub: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },
  completionPct: { fontSize: 26, fontWeight: '900', color: colors.primary },
  premium: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: radius.lg },
  premiumIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { fontSize: 15, fontWeight: '800', color: colors.white },
  premiumText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, lineHeight: 17 },
  alert: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryTint,
  },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  alertIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  alertSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 26, marginBottom: 12 },
  sectionText: { fontSize: 19, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  seeAll: { color: colors.primary, fontWeight: '800', fontSize: 13, padding: 4 },
  carousel: { paddingHorizontal: 16, gap: 12, paddingBottom: 6 },
  carouselLoading: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  carouselEmpty: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: radius.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  quickWrap: { width: '50%', padding: 4 },
  quick: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  quickIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  safety: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
  },
  safetyText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.text },
});
