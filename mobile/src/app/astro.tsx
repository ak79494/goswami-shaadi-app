import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button, type IconName } from '@/components/button';
import { TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, radius } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAppInfo } from '@/lib/app-info';
import { useAuth } from '@/lib/auth';
import { fullName } from '@/lib/format';
import { openWhatsApp } from '@/lib/links';
import { usePrimaryPhoto } from '@/lib/profiles';
import type { Profile } from '@/lib/types';

const SERVICES: { icon: IconName; text: string }[] = [
  { icon: 'heart-half', text: 'Kundli matching (Guna Milan) with a profile' },
  { icon: 'flame', text: 'Manglik dosh and remedies' },
  { icon: 'calendar', text: 'Auspicious dates for roka and marriage' },
  { icon: 'sparkles', text: 'Questions about your horoscope' },
];

const cleanId = (id: string) => id.trim().toUpperCase().replace(/\s+/g, '');

function birthDetails(p: Profile): string {
  return [
    `Name: ${fullName(p)} (${p.user.goswamiId})`,
    p.dateOfBirth ? `Date of birth: ${p.dateOfBirth}` : null,
    p.timeOfBirth ? `Time of birth: ${p.timeOfBirth}` : null,
    p.placeOfBirth ? `Place of birth: ${p.placeOfBirth}` : null,
    p.rashi ? `Rashi: ${p.rashi}` : null,
    p.nakshatra ? `Nakshatra: ${p.nakshatra}` : null,
    p.manglik ? `Manglik: ${p.manglik}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function Astro() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const info = useAppInfo();
  const toast = useToast();
  const { with: withId } = useLocalSearchParams<{ with?: string }>();
  const [partnerId, setPartnerId] = useState(withId ?? '');
  const [partner, setPartner] = useState<Profile | null>(null);
  const [finding, setFinding] = useState(false);

  // Opened from a profile's "Match kundli" button: show who the match is for straight away.
  useEffect(() => {
    if (!withId) return;
    api
      .get<Profile>(`/profiles/goswami/${encodeURIComponent(cleanId(withId))}`)
      .then(setPartner)
      .catch(() => {});
  }, [withId]);

  if (!profile) return null;
  const missing = [
    !profile.dateOfBirth && 'date of birth',
    !profile.timeOfBirth && 'time of birth',
    !profile.placeOfBirth && 'place of birth',
  ].filter(Boolean) as string[];

  const ask = async (text: string) => {
    if (!(await openWhatsApp(info.astroWhatsapp, text))) toast('Could not open WhatsApp on this phone', 'error');
  };

  const myQuestion = () => ask(`Namaste 🙏 I would like an astrology consultation.\n\n${birthDetails(profile)}\n\nMy question: `);

  const matchKundli = async () => {
    const id = cleanId(partnerId);
    if (!id) {
      toast('Enter their profile ID, e.g. GS0014', 'error');
      return;
    }
    if (id === profile.user.goswamiId) {
      toast("That's your own profile ID — enter the other person's ID", 'error');
      return;
    }
    let other = partner?.user.goswamiId === id ? partner : null;
    if (!other) {
      setFinding(true);
      try {
        other = await api.get<Profile>(`/profiles/goswami/${encodeURIComponent(id)}`);
        setPartner(other);
      } catch (e) {
        toast(errorMessage(e) || `No profile found with ID ${id}`, 'error');
        return;
      } finally {
        setFinding(false);
      }
    }
    // Both kundlis go in the message, so the astrologer has everything needed for Guna Milan.
    ask(
      `Namaste 🙏 Please do kundli matching (Guna Milan) for these two Goswami Shaadi profiles.\n\n` +
        `👤 Profile 1 (me)\n${birthDetails(profile)}\n\n` +
        `👤 Profile 2\n${birthDetails(other)}`,
    );
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header title="Astro Chat" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Animated.View entering={motion.enter()}>
          <LinearGradient colors={['#2B1055', '#7597DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Ionicons name="planet" size={34} color="#FFD98E" />
            <Text style={styles.heroTitle}>Talk to our astrologer</Text>
            <Text style={styles.heroText}>Chat on WhatsApp with the {info.companyName} astrology desk. Your birth details are added to the message for you.</Text>
            <View style={styles.services}>
              {SERVICES.map((s) => (
                <View key={s.text} style={styles.service}>
                  <Ionicons name={s.icon} size={15} color="#FFD98E" />
                  <Text style={styles.serviceText}>{s.text}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={motion.enter(60)} style={styles.card}>
          <Text style={styles.cardTitle}>My horoscope details</Text>
          <Text style={styles.details}>{birthDetails(profile)}</Text>
          {missing.length ? (
            <View style={styles.warn}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.warnText}>Add your {missing.join(', ')} for an accurate reading.</Text>
            </View>
          ) : null}
          <Button
            title="Edit horoscope details"
            icon="create-outline"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/edit/religion')}
            style={{ alignSelf: 'flex-start' }}
          />
          <Button title="Ask about my horoscope" icon="logo-whatsapp" variant="success" onPress={myQuestion} style={{ marginTop: 8 }} />
        </Animated.View>

        <Animated.View entering={motion.enter(120)} style={styles.card}>
          <Text style={styles.cardTitle}>Kundli matching</Text>
          <Text style={styles.cardText}>Found someone you like? Enter their profile ID and the astrologer will match your kundlis.</Text>
          <TextField value={partnerId} onChangeText={setPartnerId} placeholder="Their profile ID, e.g. GS0014" icon="search-outline" autoCapitalize="characters" />
          {partner && partner.user.goswamiId === cleanId(partnerId) ? <PartnerPreview profile={partner} /> : null}
          <Button title="Match kundli on WhatsApp" icon="logo-whatsapp" variant="success" loading={finding} onPress={matchKundli} />
          <Text style={styles.hint}>Both your birth details and theirs are sent to the astrologer.</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardScreen>
  );
}

function PartnerPreview({ profile }: { profile: Profile }) {
  const photo = usePrimaryPhoto(profile.user.id);
  const missing = !profile.dateOfBirth || !profile.timeOfBirth || !profile.placeOfBirth;
  return (
    <Animated.View entering={motion.fade()} style={styles.partner}>
      <Avatar uri={photo} name={fullName(profile)} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={styles.partnerName}>
          {fullName(profile)} · {profile.user.goswamiId}
        </Text>
        <Text style={styles.partnerSub} numberOfLines={2}>
          {missing
            ? 'Some of their birth details are missing — the astrologer may ask for them.'
            : [profile.rashi, profile.nakshatra, profile.placeOfBirth].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  hero: { borderRadius: radius.lg, padding: 20, gap: 6 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 6 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
  services: { marginTop: 10, gap: 8 },
  service: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceText: { color: colors.white, fontSize: 13, fontWeight: '600', flex: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardText: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: 12 },
  details: { fontSize: 14, lineHeight: 22, color: colors.text },
  warn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.warningSoft, padding: 10, borderRadius: radius.sm, marginTop: 10 },
  warnText: { flex: 1, fontSize: 12, color: colors.text },
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    marginBottom: 12,
  },
  partnerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  partnerSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  hint: { fontSize: 12, color: colors.textFaint, textAlign: 'center', marginTop: 10 },
});
