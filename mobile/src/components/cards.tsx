import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/constants/motion';
import { colors, gradients, radius, shadow } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { errorMessage } from '@/lib/api';
import { ageFromDob, displayName, fullName, isOnline, profileHeadline } from '@/lib/format';
import { usePrimaryPhoto } from '@/lib/profiles';
import type { Profile } from '@/lib/types';
import { Avatar, ProfileImage } from './avatar';
import { Button, PressableScale } from './button';
import { useToast } from './toast';

/** "Send Interest" → "Chat Now" (as soon as the interest is sent, accepted or not), with a burst of hearts when it goes out. */
export function ConnectButton({ userId, size = 'md', style }: { userId: number; size?: 'sm' | 'md' | 'lg'; style?: StyleProp<ViewStyle> }) {
  const { interestState, sendInterest, respond, requestFrom } = useActivity();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(0);
  const state = interestState(userId);

  const onPress = async () => {
    if (state === 'INTEREST_ACCEPTED' || state === 'INTEREST_SENT') {
      router.push(`/chat/${userId}`);
      return;
    }
    setBusy(true);
    try {
      if (state === 'INTEREST_RECEIVED') {
        const req = requestFrom(userId);
        if (req) await respond(req.id, 'ACCEPTED');
        toast("Interest accepted — say hello!");
      } else {
        await sendInterest(userId);
        setBurst((b) => b + 1);
        toast('Interest sent — you can chat now');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const props = {
    SEND_INTEREST: { title: 'Send Interest', icon: 'heart' as const, variant: 'primary' as const },
    INTEREST_SENT: { title: 'Chat Now', icon: 'chatbubble-ellipses' as const, variant: 'secondary' as const },
    INTEREST_RECEIVED: { title: 'Accept Interest', icon: 'checkmark-done' as const, variant: 'success' as const },
    INTEREST_ACCEPTED: { title: 'Chat Now', icon: 'chatbubble-ellipses' as const, variant: 'secondary' as const },
  }[state];

  return (
    <View style={style}>
      <Button {...props} size={size} loading={busy} onPress={onPress} />
      {burst > 0 ? <HeartBurst key={burst} /> : null}
    </View>
  );
}

function HeartBurst() {
  return (
    <View pointerEvents="none" style={styles.burst}>
      {Array.from({ length: 8 }, (_, i) => (
        <BurstHeart key={i} index={i} />
      ))}
    </View>
  );
}

function BurstHeart({ index }: { index: number }) {
  const t = useSharedValue(0);
  const angle = ((-90 + (index - 3.5) * 20) * Math.PI) / 180;
  const distance = 54 + (index % 3) * 16;
  useEffect(() => {
    t.set(withDelay(index * 20, withTiming(1, { duration: 850, easing: Easing.out(Easing.quad) })));
  }, [index, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * distance * t.value },
      { translateY: Math.sin(angle) * distance * t.value },
      { scale: 0.5 + t.value * 0.9 },
    ],
  }));
  return (
    <Animated.View style={[styles.burstHeart, style]}>
      <Ionicons name="heart" size={index % 2 ? 14 : 18} color={index % 3 ? colors.primaryBright : '#FF8FA3'} />
    </Animated.View>
  );
}

export function ShortlistButton({ userId, style, light }: { userId: number; style?: StyleProp<ViewStyle>; light?: boolean }) {
  const { shortlistIds, toggleShortlist } = useActivity();
  const toast = useToast();
  const on = shortlistIds.has(userId);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPress = async () => {
    scale.set(withSequence(withTiming(1.25, { duration: 120 }), withTiming(1, { duration: 160 })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const added = await toggleShortlist(userId);
      toast(added ? 'Added to shortlist' : 'Removed from shortlist', 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <PressableScale onPress={onPress} scaleTo={0.9} accessibilityLabel={on ? 'Remove from shortlist' : 'Add to shortlist'} style={style}>
      <Animated.View style={[styles.star, light && styles.starLight, animatedStyle]}>
        <Ionicons name={on ? 'star' : 'star-outline'} size={20} color={on ? colors.gold : light ? colors.text : colors.white} />
      </Animated.View>
    </PressableScale>
  );
}

/** Full-width card for the Matches feed, modelled on the big photo cards of matrimony apps. */
export function MatchCard({ profile, index = 0 }: { profile: Profile; index?: number }) {
  const userId = profile.user.id;
  const photo = usePrimaryPhoto(userId);
  const online = isOnline(profile.user.lastActiveAt);
  const community = [profile.subCommunity || profile.community, profile.motherTongue].filter(Boolean).join(' · ');

  return (
    <Animated.View entering={motion.enter(Math.min(index, 4) * 80)} style={styles.card}>
      <PressableScale onPress={() => router.push(`/profile/${userId}`)} scaleTo={0.985} accessibilityLabel={`Open ${fullName(profile)}'s profile`}>
        <View style={styles.photoBox}>
          <ProfileImage uri={photo} name={fullName(profile)} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={gradients.photoFade} style={styles.photoFade} />
          <View style={styles.topRow}>
            {online ? (
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.photoText}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName(profile)}
              </Text>
            </View>
            <Text style={styles.meta}>{profileHeadline(profile)}</Text>
            {community ? <Text style={styles.metaSoft}>{community}</Text> : null}
          </View>
        </View>
      </PressableScale>
      {/* Sibling of the card's pressable (not inside it) so the two buttons never nest. */}
      <ShortlistButton userId={userId} style={styles.cardStar} />
      <View style={styles.cardBottom}>
        <View style={styles.infoGrid}>
          <InfoPill icon="briefcase-outline" text={profile.profession || 'Profession not added'} />
          <InfoPill icon="school-outline" text={profile.education || 'Education not added'} />
        </View>
        <ConnectButton userId={userId} />
      </View>
    </Animated.View>
  );
}

function InfoPill({ icon, text }: { icon: 'briefcase-outline' | 'school-outline'; text: string }) {
  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={styles.infoText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/** Compact card for horizontal carousels on the home screen. */
export function MiniMatchCard({ profile, index = 0 }: { profile: Profile; index?: number }) {
  const userId = profile.user.id;
  const photo = usePrimaryPhoto(userId);
  const age = ageFromDob(profile.dateOfBirth);
  return (
    <Animated.View entering={motion.enterRight(Math.min(index, 6) * 70)}>
      <PressableScale onPress={() => router.push(`/profile/${userId}`)} accessibilityLabel={`Open ${fullName(profile)}'s profile`} style={styles.miniShadow}>
        <View style={styles.mini}>
          <ProfileImage uri={photo} name={fullName(profile)} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={gradients.photoFade} style={styles.photoFade} />
          {isOnline(profile.user.lastActiveAt) ? <View style={[styles.onlineDot, styles.miniDot]} /> : null}
          <View style={styles.miniText}>
            <Text style={styles.miniName} numberOfLines={1}>
              {profile.firstName}
              {age ? `, ${age}` : ''}
            </Text>
            <Text style={styles.miniMeta} numberOfLines={1}>
              {profile.city || profile.profession || ' '}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** Row with avatar, name and a subtitle — used in the Interests inbox and lists. */
export function PersonRow({
  userId,
  profile,
  subtitle,
  right,
  footer,
  index = 0,
}: {
  userId: number;
  profile?: Profile;
  subtitle?: string;
  right?: ReactNode;
  footer?: ReactNode;
  index?: number;
}) {
  const photo = usePrimaryPhoto(userId);
  const name = profile ? fullName(profile) : 'Member';
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50)} style={styles.row}>
      <View style={styles.rowMain}>
        <PressableScale
          onPress={() => router.push(`/profile/${userId}`)}
          scaleTo={0.98}
          accessibilityLabel={`Open ${name}'s profile`}
          style={{ flex: 1 }}>
          <View style={styles.rowPerson}>
            <Avatar uri={photo} name={name} size={58} online={isOnline(profile?.user.lastActiveAt)} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName} numberOfLines={1}>
                {profile ? displayName(profile) : 'Loading…'}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {profile ? profileHeadline(profile) : ' '}
              </Text>
              {subtitle ? (
                <Text style={styles.rowHint} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </PressableScale>
        {right}
      </View>
      {footer}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  burstHeart: { position: 'absolute' },
  star: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,16,32,0.35)',
  },
  starLight: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  photoBox: { height: 420, justifyContent: 'space-between' },
  photoFade: { ...StyleSheet.absoluteFill, top: '45%' },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: 14, minHeight: 68 },
  cardStar: { position: 'absolute', top: 14, right: 14 },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(14,16,32,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.online },
  onlineText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  photoText: { padding: 18, paddingBottom: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: colors.white, fontSize: 24, fontWeight: '800', flexShrink: 1 },
  meta: { color: colors.white, fontSize: 15, fontWeight: '600', marginTop: 4 },
  metaSoft: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 3 },
  cardBottom: { padding: 14, gap: 12 },
  infoGrid: { flexDirection: 'row', gap: 8 },
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  infoText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text },
  miniShadow: { borderRadius: radius.lg, backgroundColor: colors.primaryTint, ...shadow.card },
  mini: { width: 150, height: 206, borderRadius: radius.lg, overflow: 'hidden' },
  miniDot: { position: 'absolute', top: 10, right: 10, borderWidth: 2, borderColor: colors.white, width: 12, height: 12, borderRadius: 6 },
  miniText: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  miniName: { color: colors.white, fontSize: 16, fontWeight: '800' },
  miniMeta: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 2 },
  row: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowPerson: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowName: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rowHint: { fontSize: 12, color: colors.textFaint, marginTop: 3 },
});
