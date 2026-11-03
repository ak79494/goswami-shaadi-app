import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Fixed layout so the background looks the same on every launch.
const HEARTS = [
  { x: 0.08, size: 18, duration: 9000, delay: 0 },
  { x: 0.22, size: 28, duration: 12000, delay: 2500 },
  { x: 0.38, size: 14, duration: 8000, delay: 1200 },
  { x: 0.55, size: 24, duration: 11000, delay: 4000 },
  { x: 0.7, size: 16, duration: 9500, delay: 600 },
  { x: 0.84, size: 30, duration: 13000, delay: 3200 },
  { x: 0.93, size: 12, duration: 7500, delay: 5200 },
  { x: 0.46, size: 20, duration: 10500, delay: 6800 },
];

/** Hearts drifting slowly upward — the welcome screen background. */
export function FloatingHearts() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {HEARTS.map((h, i) => (
        <Heart key={i} left={h.x * width} travel={height + 80} {...h} />
      ))}
    </View>
  );
}

function Heart({ left, travel, size, duration, delay }: { left: number; travel: number; size: number; duration: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)));
  }, [delay, duration, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.1 ? t.value * 3 : 0.3 * (1 - t.value) + 0.05,
    transform: [
      { translateY: -t.value * travel },
      { translateX: Math.sin(t.value * Math.PI * 4) * 14 },
      { rotate: `${Math.sin(t.value * Math.PI * 2) * 15}deg` },
    ],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left, bottom: -40 }, style]}>
      <Ionicons name="heart" size={size} color="#FFFFFF" />
    </Animated.View>
  );
}
