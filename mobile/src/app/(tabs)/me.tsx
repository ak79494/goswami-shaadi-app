import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, IconButton, PressableScale, type IconName } from '@/components/button';
import { ProgressBar } from '@/components/feedback';
import { SECTIONS } from '@/components/profile-form';
import { LightStatusBar } from '@/components/screen';
import { useSideMenu } from '@/components/side-menu';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, gradients, radius, shadow } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { shareMyBiodata } from '@/lib/biodata';
import { APP_VERSION } from '@/lib/config';
import { fullName, longDate, profileCompletion, profileHeadline } from '@/lib/format';
import type { Profile } from '@/lib/types';

export default function Me() {
  const insets = useSafeAreaInsets();
  const { profile, photos, session, premium, signOut } = useAuth();
  const toast = useToast();
  const openMenu = useSideMenu();
  const [makingBiodata, setMakingBiodata] = useState(false);

  if (!profile) return null;

  const completion = profileCompletion(profile, photos.length);
  const myPhoto = photos.find((p) => p.primaryPhoto)?.url ?? photos[0]?.url;

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

  const contactPrivacy = {
    PREMIUM: 'Number visible to premium members',
    CONNECTED: 'Number visible to premium connections',
    HIDDEN: 'Number hidden from everyone',
  }[profile.contactDisplayOption ?? 'PREMIUM'];

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You can log back in any time with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <View style={styles.root}>
      <LightStatusBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <View style={[styles.menuButton, { top: insets.top + 12 }]}>
            <IconButton icon="menu" accessibilityLabel="Open menu" color={colors.white} background="rgba(255,255,255,0.18)" onPress={openMenu} />
          </View>
          <PressableScale onPress={() => router.push('/photos')} accessibilityLabel="Manage photos">
            <View>
              <Avatar uri={myPhoto} name={fullName(profile)} size={100} ring="rgba(255,255,255,0.9)" />
              <View style={styles.camera}>
                <Ionicons name="camera" size={16} color={colors.primary} />
              </View>
            </View>
          </PressableScale>
          <Text style={styles.name}>{fullName(profile)}</Text>
          <Text style={styles.headline}>{profileHeadline(profile) || 'Add your details'}</Text>
          <View style={styles.idPill}>
            <Text style={styles.idText}>ID {profile.user.goswamiId}</Text>
          </View>
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressRow}>
              <Text style={styles.heroProgressText}>Profile strength</Text>
              <Text style={styles.heroProgressText}>{completion}%</Text>
            </View>
            <ProgressBar value={completion} light />
          </View>
        </LinearGradient>

        <View style={styles.actionsRow}>
          <Button
            title="Preview profile"
            icon="eye-outline"
            variant="secondary"
            size="sm"
            onPress={() => router.push(`/profile/${profile.user.id}`)}
            style={{ flex: 1 }}
          />
          <Button title={`Photos (${photos.length}/10)`} icon="images-outline" size="sm" onPress={() => router.push('/photos')} style={{ flex: 1 }} />
        </View>

        <View style={styles.plan}>
          <View style={[styles.planIcon, premium?.active && { backgroundColor: '#2B2140' }]}>
            <Ionicons name="diamond" size={20} color={premium?.active ? colors.gold : colors.textFaint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>{premium?.active ? `${premium.planName} member` : 'Free Account'}</Text>
            <Text style={styles.planSub}>
              {premium?.active
                ? `Premium till ${longDate(premium.validUntil)}`
                : premium?.latestOrder?.status === 'PENDING'
                  ? 'Payment being verified'
                  : 'Contact numbers are for Premium members'}
            </Text>
          </View>
          <Button title="Premium" icon="diamond-outline" size="sm" onPress={() => router.push('/premium')} />
        </View>

        <Group title="Edit profile">
          {SECTIONS.map((s, i) => {
            const filled = s.fields.filter((f) => {
              const v = profile[f.key as keyof Profile];
              return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== '';
            }).length;
            return (
              <MenuRow
                key={s.key}
                icon={s.icon}
                title={s.title}
                subtitle={`${filled} of ${s.fields.length} filled`}
                done={filled === s.fields.length}
                onPress={() => router.push(`/edit/${s.key}`)}
                index={i}
              />
            );
          })}
        </Group>

        <Group title="Matchmaking">
          <MenuRow icon="options-outline" title="Partner preferences" subtitle="Age, community, city and more" onPress={() => router.push('/preferences')} />
          <MenuRow icon="star-outline" title="Shortlisted profiles" onPress={() => router.navigate('/matches?tab=shortlist')} />
          <MenuRow icon="notifications-outline" title="Notifications" onPress={() => router.push('/notifications')} />
        </Group>

        <Group title="Privacy">
          <MenuRow
            icon="shield-checkmark-outline"
            title="Privacy settings"
            subtitle={`${profile.profileVisible !== false ? 'Visible in search' : 'Hidden from search'} · ${contactPrivacy}`}
            onPress={() => router.push('/privacy')}
          />
        </Group>

        <Group title="More">
          <MenuRow
            icon="document-text-outline"
            title={makingBiodata ? 'Preparing biodata…' : 'Download biodata'}
            subtitle="A PDF to save or share on WhatsApp"
            onPress={biodata}
          />
          <MenuRow icon="planet-outline" title="Astro Chat" subtitle="Kundli matching and horoscope questions" onPress={() => router.push('/astro')} />
          <MenuRow icon="help-buoy-outline" title="Help & Support" onPress={() => router.push('/help')} />
          <MenuRow icon="information-circle-outline" title="About Goswami Jodi" onPress={() => router.push('/about')} />
        </Group>

        <Group title="Account">
          <MenuRow icon="mail-outline" title={session?.email ?? ''} subtitle="Login email" />
          <MenuRow icon="log-out-outline" title="Log out" danger onPress={confirmLogout} />
          <MenuRow icon="trash-outline" title="Delete account" danger onPress={() => router.push('/delete-account')} />
        </Group>

        <Text style={styles.footer}>GoswamiJodi v{APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  done,
  danger,
  index = 0,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  done?: boolean;
  danger?: boolean;
  index?: number;
}) {
  const content = (
    <View style={styles.menuRow}>
      <View style={[styles.menuIcon, danger && { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: colors.primary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {done ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
      {onPress && !danger ? <Ionicons name="chevron-forward" size={18} color={colors.textFaint} /> : null}
    </View>
  );
  return (
    <Animated.View entering={motion.enter(index * 40)}>
      {onPress ? (
        <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={title}>
          {content}
        </PressableScale>
      ) : (
        content
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  camera: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  name: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  headline: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  idText: { color: colors.white, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  heroProgress: { alignSelf: 'stretch', marginTop: 18, gap: 8 },
  heroProgressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgressText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  group: { marginTop: 22, paddingHorizontal: 16 },
  groupTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  groupCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  menuButton: { position: 'absolute', left: 16 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  planTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  planSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer: { textAlign: 'center', color: colors.textFaint, fontSize: 11, marginTop: 24 },
});
