import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { easeIn, easeOut } from '@/constants/motion';
import { colors, gradients } from '@/constants/theme';

const TITLE = 'Goswami Shaadi';
/** The opening stays up at least this long, then waits for the app to be ready. All the words are in by 2.8s, which leaves time to read them. */
const MIN_SHOW_MS = 4500;
/** Same colour and heart as the native splash (app.json), so the hand-over can't be seen. */
const SPLASH_RED = '#D92F4B';
/** How long the native splash takes to fade away. Nothing moves until it has, or two hearts show. */
export const NATIVE_SPLASH_FADE_MS = 150;
const HEART_SIZE = 120;
const HEART_RISE = 96;
const BURST = [0, 30, 62, 90, 118, 150, 180, 212, 240, 270, 300, 332];

const rise = (delay: number, duration = 340) => withDelay(delay, withTiming(1, { duration, easing: easeOut }));

/**
 * The opening animation: the splash heart beats twice and lifts, little hearts burst out of it, and
 * the name and tagline appear beneath it. It takes over from the native splash and covers the app until
 * `ready`, so a slow server shows a beating heart rather than a blank screen.
 */
export function IntroSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const { width } = useWindowDimensions();
  const [heartShown, setHeartShown] = useState(false);
  const [started, setStarted] = useState(false);
  const [minDone, setMinDone] = useState(false);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const wash = useSharedValue(0);
  const line = useSharedValue(0);
  const tagline = useSharedValue(0);
  const hindi = useSharedValue(0);
  const footer = useSharedValue(0);
  const exit = useSharedValue(0);

  // Once the heart is on screen this looks exactly like the native splash, so that can go.
  useEffect(() => {
    if (!heartShown) {
      // In case the image never reports back.
      const fallback = setTimeout(() => setHeartShown(true), 600);
      return () => clearTimeout(fallback);
    }
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => setStarted(true), NATIVE_SPLASH_FADE_MS);
    return () => clearTimeout(timer);
  }, [heartShown]);

  useEffect(() => {
    if (!started) return;
    wash.set(withTiming(1, { duration: 700, easing: easeOut }));
    lift.set(withDelay(300, withTiming(1, { duration: 620, easing: easeOut })));
    scale.set(
      withDelay(
        120,
        withSequence(
          withTiming(1.18, { duration: 160, easing: easeOut }),
          withTiming(0.98, { duration: 140, easing: easeIn }),
          withTiming(1.14, { duration: 160, easing: easeOut }),
          withTiming(0.82, { duration: 280, easing: easeOut }),
          withRepeat(withTiming(0.88, { duration: 560, easing: Easing.inOut(Easing.sin) }), -1, true),
        ),
      ),
    );
    line.set(rise(1400, 420));
    tagline.set(rise(1600, 450));
    hindi.set(rise(1950, 450));
    footer.set(rise(2350, 450));
    const timer = setTimeout(() => setMinDone(true), MIN_SHOW_MS);
    return () => clearTimeout(timer);
  }, [footer, hindi, lift, line, scale, started, tagline, wash]);

  useEffect(() => {
    if (!ready || !minDone) return;
    exit.set(
      withTiming(1, { duration: 400, easing: easeIn }, (finished) => {
        if (finished) scheduleOnRN(onDone);
      }),
    );
  }, [exit, minDone, onDone, ready]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const washStyle = useAnimatedStyle(() => ({ opacity: wash.value }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + exit.value * 0.08 }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -HEART_RISE * lift.value }] }));
  const beatStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const lineStyle = useAnimatedStyle(() => ({ opacity: line.value, transform: [{ scaleX: line.value }] }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: tagline.value, transform: [{ translateY: (1 - tagline.value) * 14 }] }));
  const hindiStyle = useAnimatedStyle(() => ({ opacity: hindi.value, transform: [{ translateY: (1 - hindi.value) * 12 }] }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footer.value }));

  return (
    <Animated.View style={[styles.root, rootStyle]} accessibilityLabel="Goswami Shaadi. Find your perfect life partner.">
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, washStyle]}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[styles.center, contentStyle]}>
        <Animated.View style={[styles.heartArea, heartStyle]}>
          {started ? (
            <>
              <Ring delay={120} />
              <Ring delay={520} />
              {BURST.map((angle, i) => (
                <BurstHeart key={angle} angle={angle} index={i} />
              ))}
            </>
          ) : null}
          <Animated.View style={beatStyle}>
            <Image source={require('@/assets/images/splash-icon.png')} style={styles.heart} contentFit="contain" onDisplay={() => setHeartShown(true)} />
          </Animated.View>
        </Animated.View>

        <View style={styles.words}>
          <View style={styles.title} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {started
              ? TITLE.split('').map((letter, i) => <Letter key={i} letter={letter} index={i} size={Math.min(38, width / 10)} />)
              : null}
          </View>
          <Animated.View style={[styles.divider, lineStyle]}>
            <LinearGradient colors={['transparent', colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dividerLine} />
            <Ionicons name="heart" size={12} color="#F5D48A" />
            <LinearGradient colors={[colors.gold, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dividerLine} />
          </Animated.View>
          <Animated.Text style={[styles.tagline, taglineStyle]}>Find your perfect life partner</Animated.Text>
          <Animated.Text style={[styles.hindi, hindiStyle]}>रिश्ते जो उम्र भर साथ निभाएँ</Animated.Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, footerStyle]}>
        <Text style={styles.footerText}>Made with ♥ for Goswami families</Text>
      </Animated.View>
    </Animated.View>
  );
}

function Letter({ letter, index, size }: { letter: string; index: number; size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(rise(620 + index * 40));
  }, [index, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 22 }] }));
  return <Animated.Text style={[styles.letter, { fontSize: size }, style]}>{letter === ' ' ? ' ' : letter}</Animated.Text>;
}

/** A soft ring spreading out from the heart, again and again. */
function Ring({ delay }: { delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }), -1)));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - t.value), transform: [{ scale: 0.7 + t.value * 1.7 }] }));
  return <Animated.View style={[styles.ring, style]} pointerEvents="none" />;
}

/** One of the little hearts thrown outward on the first beat. */
function BurstHeart({ angle, index }: { angle: number; index: number }) {
  const t = useSharedValue(0);
  const distance = 92 + (index % 3) * 34;
  const radians = (angle * Math.PI) / 180;
  useEffect(() => {
    t.set(withDelay(240 + (index % 4) * 30, withTiming(1, { duration: 1050, easing: easeOut })));
  }, [index, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value / 0.15 : 1 - (t.value - 0.15) / 0.85,
    transform: [
      { translateX: Math.cos(radians) * distance * t.value },
      { translateY: Math.sin(radians) * distance * t.value },
      { scale: 0.5 + t.value * 0.6 },
      { rotate: `${(index % 2 ? 1 : -1) * 18 * t.value}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.burst, style]} pointerEvents="none">
      <Ionicons name="heart" size={10 + (index % 3) * 4} color="rgba(255,255,255,0.9)" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: SPLASH_RED, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heartArea: { width: HEART_SIZE, height: HEART_SIZE, alignItems: 'center', justifyContent: 'center' },
  heart: { width: HEART_SIZE, height: HEART_SIZE },
  ring: { position: 'absolute', width: HEART_SIZE, height: HEART_SIZE, borderRadius: HEART_SIZE / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  burst: { position: 'absolute' },
  // Hung from the centre of the screen, so the heart starts exactly where the native splash left it.
  words: { position: 'absolute', top: '50%', marginTop: -8, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  title: { flexDirection: 'row', justifyContent: 'center' },
  letter: { color: colors.white, fontWeight: '800', letterSpacing: 0.4 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  dividerLine: { width: 68, height: 1.5 },
  tagline: { color: colors.white, fontSize: 18, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  hindi: { color: 'rgba(255,255,255,0.9)', fontSize: 15, marginTop: 6, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 44, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
});
