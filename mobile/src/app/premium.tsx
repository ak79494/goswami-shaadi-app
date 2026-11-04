import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type IconName } from '@/components/button';
import { Header } from '@/components/screen';
import { motion } from '@/constants/motion';
import { colors, gradients, radius } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { WEBSITE_URL } from '@/lib/config';
import { longDate } from '@/lib/format';

const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: 'call', text: 'See mobile numbers of members' },
  { icon: 'logo-whatsapp', text: 'Message members directly on WhatsApp' },
  { icon: 'diamond', text: 'Premium badge on your profile' },
];

/**
 * Shows the member's plan and what Premium includes. Memberships are sold on the website, not in this app, so
 * Google Play's billing rules allow it: this screen may say so, but must not link to a payment page or take a payment.
 */
export default function Premium() {
  const insets = useSafeAreaInsets();
  const { premium, refreshPremium } = useAuth();

  useEffect(() => {
    refreshPremium();
  }, [refreshPremium]);

  const pending = premium?.latestOrder?.status === 'PENDING' ? premium.latestOrder : null;
  const rejected = premium?.latestOrder?.status === 'REJECTED' ? premium.latestOrder : null;

  return (
    <View style={styles.root}>
      <Header title="Premium membership" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
        <Animated.View entering={motion.enter()}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Ionicons name="diamond" size={30} color={colors.gold} />
            <Text style={styles.heroTitle}>{premium?.active ? `You are a ${premium.planName} member` : 'What Premium includes'}</Text>
            {premium?.active ? <Text style={styles.heroText}>Active till {longDate(premium.validUntil)}</Text> : null}
            <View style={styles.benefits}>
              {BENEFITS.map((b) => (
                <View key={b.text} style={styles.benefit}>
                  <Ionicons name={b.icon} size={16} color={colors.white} />
                  <Text style={styles.benefitText}>{b.text}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {pending ? (
          <Animated.View entering={motion.enter(60)} style={[styles.banner, { backgroundColor: colors.warningSoft }]}>
            <Ionicons name="time-outline" size={22} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Payment being verified</Text>
              <Text style={styles.bannerText}>We will activate your {pending.planName} plan and notify you as soon as it is confirmed.</Text>
            </View>
          </Animated.View>
        ) : null}
        {rejected ? (
          <Animated.View entering={motion.enter(60)} style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Last payment could not be verified</Text>
              <Text style={styles.bannerText}>{rejected.adminNote}</Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={motion.enter(120)} style={styles.card}>
          <Text style={styles.cardTitle}>Memberships aren’t sold in this app</Text>
          <Text style={styles.cardText}>
            Go to our website to {premium?.active ? 'renew' : 'upgrade'} your membership. Once it is confirmed, Premium works here automatically.
          </Text>
          <Text style={styles.website}>{WEBSITE_URL.replace(/^https?:\/\//, '')}</Text>
        </Animated.View>

        <Button title="Questions? Help & Support" icon="help-buoy-outline" variant="ghost" onPress={() => router.push('/help')} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  hero: { borderRadius: radius.lg, padding: 20, gap: 6 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
  benefits: { marginTop: 10, gap: 8 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  banner: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, marginTop: 14 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  bannerText: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 3 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardText: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  website: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 10 },
});
