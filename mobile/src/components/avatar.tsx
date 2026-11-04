import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients } from '@/constants/theme';
import { imageSource, mediaUrl } from '@/lib/api';
import { initials } from '@/lib/format';

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  online?: boolean;
  /** Draws a ring around the photo; pass a color to change it from the brand red. */
  ring?: boolean | string;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ uri, name, size = 48, online, ring, style }: Props) {
  const src = mediaUrl(uri);
  const dot = Math.max(10, size * 0.24);
  const outer = ring ? size + 10 : size;
  return (
    <View style={[{ width: outer, height: outer }, ring && styles.ring, ring && { borderRadius: outer / 2, borderColor: typeof ring === 'string' ? ring : colors.primary }, style]}>
      {src ? (
        <Image
          source={imageSource(uri)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
        </LinearGradient>
      )}
      {online ? (
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, right: size * 0.02, bottom: size * 0.02 }]} />
      ) : null}
    </View>
  );
}

/** Large photo with a gradient-initials fallback — used on match cards and the profile header. */
export function ProfileImage({
  uri,
  name,
  style,
}: {
  uri?: string | null;
  name?: string | null;
  style?: StyleProp<ViewStyle>;
}) {
  const src = mediaUrl(uri);
  if (src) {
    return (
      <View style={[styles.photoWrap, style]}>
        <Image source={imageSource(uri)} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </View>
    );
  }
  return (
    <LinearGradient colors={['#F7C6D1', '#E7849A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.photoFallback, style]}>
      <Text style={styles.photoInitials}>{initials(name)}</Text>
      <Text style={styles.photoHint} numberOfLines={1} maxFontSizeMultiplier={1}>
        Photo coming soon
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ring: { padding: 3, borderWidth: 2 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontWeight: '800' },
  dot: { position: 'absolute', backgroundColor: colors.online, borderWidth: 2, borderColor: colors.white },
  photoWrap: { overflow: 'hidden', backgroundColor: colors.primaryTint },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoInitials: { color: colors.white, fontSize: 64, fontWeight: '800', opacity: 0.95 },
  photoHint: { color: colors.white, opacity: 0.85, marginTop: 4, fontWeight: '600' },
});
