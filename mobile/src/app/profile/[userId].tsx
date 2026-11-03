import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileImage } from '@/components/avatar';
import { Button, IconButton, type IconName } from '@/components/button';
import { ConnectButton, ShortlistButton } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { MatchSection } from '@/components/match-section';
import { PhotoViewer } from '@/components/photo-viewer';
import { LightStatusBar } from '@/components/screen';
import { ActionSheet, type SheetAction } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, gradients, radius, shadow } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { api, errorMessage, imageSource } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ageFromDob, fullName, heightLabel, isPremiumUser, lastSeen } from '@/lib/format';
import { callPhone, formatPhone, openWhatsApp } from '@/lib/links';
import { fetchPhotos, fetchProfile, usePrimaryPhoto } from '@/lib/profiles';
import type { BlockedMember, Compatibility, Contact, Photo, Profile } from '@/lib/types';

const PHOTO_HEIGHT = 500;

export default function ProfileDetail() {
  const { userId: raw } = useLocalSearchParams<{ userId: string }>();
  const userId = Number(raw);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session, profile: me } = useAuth();
  const { acceptedWith, respond, refresh, interestState, sendInterest } = useActivity();
  const toast = useToast();
  const isMe = session?.userId === userId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [match, setMatch] = useState<Compatibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [blocked, setBlocked] = useState(false);
  const myPhoto = usePrimaryPhoto(session?.userId);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const matchY = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!isMe) api.post(`/profile-visits/${userId}`).catch(() => {});
    (async () => {
      try {
        // Everything loads before the page appears, so no card pops in later and shifts the others.
        const [p, ph, m, c, b] = await Promise.all([
          fetchProfile(userId, true),
          fetchPhotos(userId, true).catch(() => []),
          isMe ? null : api.get<Compatibility>(`/preferences/compatibility/${userId}`).catch(() => null),
          isMe
            ? null
            : api.get<Contact>(`/profiles/user/${userId}/contact`).catch((): Contact => ({ available: false, reason: 'NO_NUMBER' })),
          isMe ? null : api.get<BlockedMember[]>('/blocks').catch(() => null),
        ]);
        if (!alive) return;
        setBlocked(!!b?.some((member) => member.targetUserId === userId));
        setPhotos(ph);
        setMatch(m);
        setContact(c);
        setProfile(p);
      } catch (e) {
        if (alive) setError(errorMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, isMe]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-PHOTO_HEIGHT, 0, PHOTO_HEIGHT], [-PHOTO_HEIGHT / 2, 0, PHOTO_HEIGHT * 0.45]) },
      { scale: interpolate(scrollY.value, [-PHOTO_HEIGHT, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [PHOTO_HEIGHT - 180, PHOTO_HEIGHT - 100], [0, 1], Extrapolation.CLAMP),
  }));

  if (error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 60 }]}>
        <EmptyState icon="person-remove-outline" title="Profile unavailable" message={error} actionLabel="Go back" onAction={() => router.back()} />
      </View>
    );
  }
  if (!profile) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const age = ageFromDob(profile.dateOfBirth);
  const connection = acceptedWith(userId);
  const seen = lastSeen(profile.user.lastActiveAt);
  const premiumMember = isPremiumUser(profile.user);

  const menuActions: SheetAction[] = [
    ...(connection
      ? [
          {
            label: 'Cancel connection',
            icon: 'close-circle-outline' as const,
            destructive: true,
            onPress: async () => {
              try {
                await respond(connection.id, 'WITHDRAWN');
                toast('Connection cancelled', 'info');
              } catch (e) {
                toast(errorMessage(e), 'error');
              }
            },
          },
        ]
      : []),
    { label: 'Report profile', icon: 'flag-outline', onPress: () => setReportOpen(true) },
    blocked
      ? { label: `Unblock ${profile.firstName}`, icon: 'checkmark-circle-outline', onPress: () => unblock() }
      : { label: `Block ${profile.firstName}`, icon: 'ban-outline', destructive: true, onPress: () => block() },
  ];

  const openChat = async () => {
    if (interestState(userId) === 'SEND_INTEREST') {
      // Chatting starts with an interest: send it on the member's behalf, then open the chat.
      setChatBusy(true);
      try {
        await sendInterest(userId);
        toast(`Interest sent to ${profile.firstName} — say hello!`);
      } catch (e) {
        toast(errorMessage(e), 'error');
        return;
      } finally {
        setChatBusy(false);
      }
    }
    router.push(`/chat/${userId}`);
  };

  const whatsApp = () => {
    const number = contact?.whatsapp || contact?.phone;
    if (contact?.available && number) {
      openWhatsApp(number, `Namaste ${profile.firstName}, I saw your profile (${profile.user.goswamiId}) on Goswami Jodi${me ? ` — I am ${fullName(me)} (${me.user.goswamiId})` : ''}.`);
    } else if (!contact || contact.reason === 'PREMIUM_REQUIRED') {
      toast('Messaging on WhatsApp is a premium feature', 'info');
      router.push('/premium');
    } else {
      toast(contactLockedText(contact.reason, profile.firstName), 'info');
    }
  };

  const block = () =>
    Alert.alert(`Block ${profile.firstName}?`, "They won't be able to see your profile or message you.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/blocks/${userId}`);
            await refresh();
            toast(`${profile.firstName} has been blocked. You can undo this from ☰ → Blocked Members`, 'info');
            router.back();
          } catch (e) {
            toast(errorMessage(e), 'error');
          }
        },
      },
    ]);

  const unblock = async () => {
    try {
      await api.delete(`/blocks/${userId}`);
      await refresh();
      setBlocked(false);
      toast(`${profile.firstName} has been unblocked`, 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const report = async (reason: string) => {
    const body = new FormData();
    body.append('targetUserId', String(userId));
    body.append('reason', reason);
    try {
      await api.post('/reports/profile', body);
      toast('Thanks — our team will review this profile', 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <View style={styles.root}>
      <LightStatusBar />
      <Animated.ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: isMe ? 40 : 120 }}>
        <Animated.View style={[{ height: PHOTO_HEIGHT }, photoStyle]}>
          {photos.length ? (
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => String(p.id)}
              onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => setViewerIndex(index)} accessibilityRole="imagebutton" accessibilityLabel="Open photo full screen">
                  <Image source={imageSource(item.url)} style={{ width, height: PHOTO_HEIGHT }} contentFit="cover" transition={250} />
                </Pressable>
              )}
            />
          ) : (
            <ProfileImage name={fullName(profile)} style={{ width, height: PHOTO_HEIGHT }} />
          )}
          <LinearGradient colors={['rgba(14,16,32,0.45)', 'transparent']} style={styles.topFade} pointerEvents="none" />
          <LinearGradient colors={gradients.photoFade} style={styles.bottomFade} pointerEvents="none" />
          {photos.length > 1 ? (
            <View style={styles.dots} pointerEvents="none">
              {photos.map((p, i) => (
                <View key={p.id} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </Animated.View>

        <View style={styles.sheet}>
          <Animated.View entering={motion.enter()}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {fullName(profile)}
                {age ? `, ${age}` : ''}
              </Text>
              {premiumMember ? <Ionicons name="diamond" size={18} color={colors.gold} accessibilityLabel="Premium member" /> : null}
            </View>
            <Text style={styles.sub}>
              {[heightLabel(profile.height), profile.maritalStatus, profile.city && `${profile.city}${profile.state ? `, ${profile.state}` : ''}`]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <View style={styles.pills}>
              <Pill text={`ID ${profile.user.goswamiId}`} />
              {seen ? <Pill icon="ellipse" text={seen} tint={seen === 'Online now' ? colors.online : colors.textFaint} /> : null}
              {match?.percentage != null ? (
                <Pressable onPress={() => scrollRef.current?.scrollTo({ y: matchY.current, animated: true })} accessibilityRole="button">
                  <Pill icon="heart" text={`${match.percentage}% match`} tint={colors.primary} />
                </Pressable>
              ) : null}
            </View>
          </Animated.View>

          {isMe ? (
            <View style={styles.selfBanner}>
              <Ionicons name="eye-outline" size={18} color={colors.primary} />
              <Text style={styles.selfText}>This is how other members see your profile.</Text>
            </View>
          ) : null}

          {profile.aboutMe ? (
            <Card title={`About ${profile.firstName}`} icon="chatbox-ellipses-outline" delay={100}>
              <Text style={styles.about}>{profile.aboutMe}</Text>
            </Card>
          ) : null}

          {profile.hobbies?.length ? (
            <Card title="Interests & hobbies" icon="sparkles-outline" delay={140}>
              <View style={styles.chips}>
                {profile.hobbies.map((h) => (
                  <View key={h} style={styles.chip}>
                    <Text style={styles.chipText}>{h}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          <Details
            title="Basic details"
            icon="person-outline"
            rows={[
              ['Age', age ? `${age} years` : null],
              ['Height', heightLabel(profile.height)],
              ['Marital status', profile.maritalStatus],
              ['Mother tongue', profile.motherTongue],
              ['Body type', profile.bodyType],
              ['Lives in', [profile.city, profile.state, profile.country].filter(Boolean).join(', ')],
            ]}
          />
          <Details
            title="Religion & community"
            icon="flower-outline"
            rows={[
              ['Religion', profile.religion],
              ['Community', profile.community],
              ['Sub-community', profile.subCommunity],
            ]}
          />
          <Details
            title="Education & career"
            icon="school-outline"
            rows={[
              ['Education', profile.education],
              ['College', profile.college],
              ['Profession', profile.profession],
              ['Company', profile.company],
              ['Annual income', profile.incomeRange],
            ]}
          />
          <Details
            title="Family"
            icon="home-outline"
            rows={[
              ['Family type', profile.familyType],
              ['Family values', profile.familyValues],
              ["Father's occupation", profile.fatherOccupation],
              ["Mother's occupation", profile.motherOccupation],
              ['Siblings', profile.siblings !== null && profile.siblings !== undefined ? String(profile.siblings) : null],
            ]}
          />
          <Details
            title="Lifestyle"
            icon="leaf-outline"
            rows={[
              ['Diet', profile.foodPreference],
              ['Smoking', profile.smoking],
              ['Drinking', profile.drinking],
              ['Lifestyle', profile.lifestyle],
            ]}
          />
          <Details
            title="Horoscope"
            icon="moon-outline"
            rows={[
              ['Manglik', profile.manglik],
              ['Rashi', profile.rashi],
              ['Nakshatra', profile.nakshatra],
              ['Time of birth', profile.timeOfBirth],
              ['Place of birth', profile.placeOfBirth],
            ]}
            footer={
              isMe ? null : (
                <Button
                  title="Match kundli with an astrologer"
                  icon="planet-outline"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push({ pathname: '/astro', params: { with: profile.user.goswamiId } })}
                  style={{ marginTop: 12 }}
                />
              )
            }
          />

          {!isMe && contact?.reason !== 'BLOCKED' && contact?.reason !== 'NO_NUMBER' ? (
            <Card title="Contact details" icon="call-outline" delay={0}>
              {contact === null ? (
                <ActivityIndicator color={colors.primary} />
              ) : contact.available && contact.phone ? (
                <>
                  <View style={styles.contactRow}>
                    <Ionicons name="call" size={18} color={colors.primary} />
                    <Text style={styles.contactNumber} selectable>
                      {formatPhone(contact.phone)}
                    </Text>
                  </View>
                  {contact.whatsapp && contact.whatsapp !== contact.phone ? (
                    <View style={styles.contactRow}>
                      <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
                      <Text style={styles.contactNumber} selectable>
                        {formatPhone(contact.whatsapp)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.contactButtons}>
                    <Button title="Call" icon="call" variant="secondary" size="sm" onPress={() => callPhone(contact.phone!)} style={{ flex: 1 }} />
                    <Button title="WhatsApp" icon="logo-whatsapp" variant="success" size="sm" onPress={whatsApp} style={{ flex: 1 }} />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.locked}>
                    <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
                    <Text style={styles.lockedText}>{contactLockedText(contact.reason, profile.firstName)}</Text>
                  </View>
                  {contact.reason === 'PREMIUM_REQUIRED' ? (
                    <Button
                      title="About Premium"
                      icon="diamond-outline"
                      size="sm"
                      onPress={() => router.push('/premium')}
                      style={{ alignSelf: 'flex-start', marginTop: 12 }}
                    />
                  ) : null}
                </>
              )}
            </Card>
          ) : null}

          {me && match ? (
            <View onLayout={(e) => (matchY.current = e.nativeEvent.layout.y + PHOTO_HEIGHT - 110)}>
              <MatchSection me={me} myPhoto={myPhoto} other={profile} otherPhoto={photos[0]?.url} compatibility={match} />
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.solidBar, { height: insets.top + 60 }, barStyle]} pointerEvents="none">
        <Text style={[styles.solidTitle, { marginTop: insets.top + 18 }]} numberOfLines={1}>
          {fullName(profile)}
        </Text>
      </Animated.View>
      <View style={[styles.floatingBar, { top: insets.top + 8 }]}>
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={() => router.back()} background="rgba(255,255,255,0.92)" />
        {!isMe ? (
          <View style={styles.topActions}>
            <IconButton icon="logo-whatsapp" accessibilityLabel="Message on WhatsApp" onPress={whatsApp} color={colors.success} background="rgba(255,255,255,0.92)" />
            <IconButton icon="ellipsis-horizontal" accessibilityLabel="More options" onPress={() => setMenuOpen(true)} background="rgba(255,255,255,0.92)" />
          </View>
        ) : null}
      </View>

      {!isMe ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <ShortlistButton userId={userId} light />
          {interestState(userId) === 'SEND_INTEREST' || interestState(userId) === 'INTEREST_RECEIVED' ? (
            <>
              <Button title="Chat" icon="chatbubble-ellipses-outline" variant="secondary" size="lg" loading={chatBusy} onPress={openChat} style={{ flex: 1 }} />
              <ConnectButton userId={userId} size="lg" style={{ flex: 1.4 }} />
            </>
          ) : (
            <ConnectButton userId={userId} size="lg" style={{ flex: 1 }} />
          )}
        </View>
      ) : null}

      <ActionSheet visible={menuOpen} title={fullName(profile)} actions={menuActions} onClose={() => setMenuOpen(false)} />
      <PhotoViewer photos={photos} index={viewerIndex} onClose={() => setViewerIndex(null)} />
      <ActionSheet
        visible={reportOpen}
        title="Why are you reporting this profile?"
        message="Your report is private. Our team reviews every report."
        actions={['Fake profile', 'Inappropriate photos', 'Asking for money', 'Already married', 'Rude or abusive behaviour', 'Under 18 or child safety concern'].map((reason) => ({
          label: reason,
          onPress: () => report(reason),
        }))}
        onClose={() => setReportOpen(false)}
      />
    </View>
  );
}

function contactLockedText(reason: Contact['reason'], name: string): string {
  switch (reason) {
    case 'PREMIUM_REQUIRED':
      return `${name}'s mobile number and WhatsApp are for Premium members.`;
    case 'CONNECT_FIRST':
      return `${name} shares contact details with premium members after you connect. Send an interest to connect.`;
    case 'HIDDEN':
      return `${name} keeps contact details private. Chat or call in the app instead.`;
    default:
      return 'Contact details are not available.';
  }
}

function Pill({ icon, text, tint = colors.primary }: { icon?: IconName; text: string; tint?: string }) {
  return (
    <View style={styles.pill}>
      {icon ? <Ionicons name={icon} size={icon === 'ellipse' ? 9 : 13} color={tint} /> : null}
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

function Card({ title, icon, children, delay = 0 }: { title: string; icon: IconName; children: ReactNode; delay?: number }) {
  return (
    <Animated.View entering={motion.enter(delay)} style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function Details({
  title,
  icon,
  rows,
  footer,
}: {
  title: string;
  icon: IconName;
  rows: [string, string | null | undefined][];
  footer?: ReactNode;
}) {
  const filled = rows.filter((r): r is [string, string] => !!r[1]);
  if (!filled.length) return null;
  return (
    <Card title={title} icon={icon}>
      {filled.map(([label, value], i) => (
        <View key={label} style={[styles.detailRow, i === filled.length - 1 && { borderBottomWidth: 0 }]}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      ))}
      {footer}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  topFade: { position: 'absolute', left: 0, right: 0, top: 0, height: 140 },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 180 },
  dots: { position: 'absolute', bottom: 46, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 22, backgroundColor: colors.white },
  sheet: {
    marginTop: -28,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  name: { fontSize: 26, fontWeight: '800', color: colors.text, flexShrink: 1 },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: 4, paddingHorizontal: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingHorizontal: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.text },
  selfBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 16,
  },
  selfText: { flex: 1, fontSize: 13, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  about: { fontSize: 15, lineHeight: 23, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 14, color: colors.textMuted },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '600', color: colors.text },
  locked: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  contactNumber: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
  contactButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  topActions: { flexDirection: 'row', gap: 10 },
  lockedText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  solidBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  solidTitle: { fontSize: 17, fontWeight: '800', color: colors.text, maxWidth: '60%' },
  floatingBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...shadow.raised,
  },
});
