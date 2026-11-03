import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type IconName } from '@/components/button';
import { Header } from '@/components/screen';
import { motion } from '@/constants/motion';
import { colors, gradients, radius, shadow } from '@/constants/theme';
import { useAppInfo } from '@/lib/app-info';
import { APP_VERSION } from '@/lib/config';
import { initials } from '@/lib/format';
import { callPhone, formatPhone, openWebsite, openWhatsApp, PAGES } from '@/lib/links';

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'shield-checkmark', title: 'Privacy first', text: 'Your contact details are shared only the way you choose.' },
  { icon: 'heart', title: 'Serious relationships', text: 'Built for marriage-minded members and their families.' },
  { icon: 'people', title: 'Family values', text: 'Respects Indian traditions and the role of family in marriage.' },
  { icon: 'sparkles', title: 'Meaningful matches', text: 'Matches based on compatibility, preferences and values.' },
];

export default function About() {
  const insets = useSafeAreaInsets();
  const info = useAppInfo();

  return (
    <View style={styles.root}>
      <Header title={`About ${info.companyName}`} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
        <Animated.View entering={motion.enter()}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="heart" size={34} color={colors.primary} />
            </View>
            <Text style={styles.brand}>{info.companyName}</Text>
            <Text style={styles.tagline}>Where hearts meet, families connect</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={motion.enter(60)} style={styles.card}>
          <Text style={styles.cardTitle}>Who we are</Text>
          <Text style={styles.text}>
            {info.companyName} is a trusted matrimonial platform for individuals and families looking for meaningful, compatible and
            lasting relationships. Every profile represents a real person with dreams, expectations and a family — so every
            interaction here should be respectful, secure and meaningful.
          </Text>
        </Animated.View>

        <View style={styles.values}>
          {VALUES.map((v, i) => (
            <Animated.View key={v.title} entering={motion.enter(100 + i * 50)} style={styles.value}>
              <Ionicons name={v.icon} size={22} color={colors.primary} />
              <Text style={styles.valueTitle}>{v.title}</Text>
              <Text style={styles.valueText}>{v.text}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={motion.enter(200)} style={[styles.card, styles.founder]}>
          <LinearGradient colors={gradients.brand} style={styles.founderAvatar}>
            <Text style={styles.founderInitials}>{initials(info.founderName)}</Text>
          </LinearGradient>
          <Text style={styles.founderLabel}>FOUNDER</Text>
          <Text style={styles.founderName}>{info.founderName}</Text>
          <Text style={styles.quote}>
            “Finding a life partner should be a journey built on trust, understanding and shared values — not just a search
            through profiles.”
          </Text>
        </Animated.View>

        <Animated.View entering={motion.enter(240)} style={styles.card}>
          <Text style={styles.cardTitle}>Contact us</Text>
          <Text style={styles.text}>Need help with your profile, membership or finding the right match? We are here for you.</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call" size={18} color={colors.primary} />
            <Text style={styles.contactText}>{formatPhone(info.supportPhone)}</Text>
          </View>
          {info.supportEmail ? (
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={18} color={colors.primary} />
              <Text style={styles.contactText}>{info.supportEmail}</Text>
            </View>
          ) : null}
          <View style={styles.buttons}>
            <Button title="Call" icon="call" variant="secondary" onPress={() => callPhone(info.supportPhone)} style={{ flex: 1 }} />
            <Button
              title="WhatsApp"
              icon="logo-whatsapp"
              variant="success"
              onPress={() => openWhatsApp(info.supportWhatsapp, `Hi ${info.companyName}!`)}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        <Animated.View entering={motion.enter(280)} style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          <LegalLink title="Privacy Policy" path={PAGES.privacy} />
          <LegalLink title="Terms & Conditions" path={PAGES.terms} />
          <LegalLink title="Child Safety Standards" path={PAGES.childSafety} />
        </Animated.View>

        <Text style={styles.version}>
          {info.companyName} app v{APP_VERSION}
        </Text>
      </ScrollView>
    </View>
  );
}

function LegalLink({ title, path }: { title: string; path: string }) {
  return (
    <Pressable onPress={() => openWebsite(path)} style={styles.legalRow} accessibilityRole="link">
      <Text style={styles.legalText}>{title}</Text>
      <Ionicons name="open-outline" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  hero: { borderRadius: radius.lg, paddingVertical: 28, alignItems: 'center' },
  logo: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.white, fontSize: 26, fontWeight: '800', marginTop: 12 },
  tagline: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 8 },
  text: { fontSize: 14, lineHeight: 22, color: colors.textMuted },
  values: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  value: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 6, ...shadow.card },
  valueTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  valueText: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
  founder: { alignItems: 'center' },
  founderAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  founderInitials: { color: colors.white, fontSize: 26, fontWeight: '800' },
  founderLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.5, marginTop: 12 },
  founderName: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  quote: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  legalText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  contactText: { fontSize: 16, fontWeight: '700', color: colors.text },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  version: { textAlign: 'center', color: colors.textFaint, fontSize: 11, marginTop: 20 },
});
