import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FloatingHearts } from '@/components/floating-hearts';
import { LightStatusBar } from '@/components/screen';
import { motion, easeOut } from '@/constants/motion';
import { gradients } from '@/constants/theme';
import { openWebsite, PAGES } from '@/lib/links';

const FEATURES = [
  { icon: 'shield-checkmark', text: 'Verified Goswami community profiles' },
  { icon: 'heart-circle', text: 'Matches based on your preferences' },
  { icon: 'lock-closed', text: 'You control who sees your photos & contact' },
] as const;

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.set(withRepeat(
      withSequence(
        withTiming(1.12, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    ));
  }, [pulse]);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.root}>
      <LightStatusBar />
      <FloatingHearts />
      <View style={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.top}>
          <Animated.View entering={ZoomIn.duration(420).easing(easeOut)} style={styles.logo}>
            <Animated.View style={logoStyle}>
              <Ionicons name="heart" size={44} color="#ED3154" />
            </Animated.View>
          </Animated.View>
          <Animated.Text entering={motion.enter(150)} style={styles.brand}>
            Goswami<Text style={styles.brandBold}>Jodi</Text>
          </Animated.Text>
          <Animated.Text entering={motion.enter(260)} style={styles.tagline}>
            Where meaningful relationships begin
          </Animated.Text>

          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <Animated.View key={f.text} entering={motion.enter(420 + i * 120)} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View entering={motion.enterUp(800)} style={styles.actions}>
          <Button title="Create free account" variant="light" size="lg" iconRight="arrow-forward" onPress={() => router.push('/register')} />
          <Button title="I already have an account" variant="outlineLight" size="lg" onPress={() => router.push('/login')} />
          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => openWebsite(PAGES.terms)}>
              Terms
            </Text>{' '}
            &{' '}
            <Text style={styles.legalLink} onPress={() => openWebsite(PAGES.privacy)}>
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  top: { alignItems: 'center' },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    transform: [{ rotate: '-6deg' }],
  },
  brand: { fontSize: 36, color: '#FFFFFF', fontWeight: '300', letterSpacing: -0.5 },
  brandBold: { fontWeight: '900' },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 6, textAlign: 'center' },
  features: { marginTop: 40, alignSelf: 'stretch', gap: 12 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  actions: { gap: 12 },
  legal: { textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 },
  legalLink: { textDecorationLine: 'underline', color: '#FFFFFF' },
});
