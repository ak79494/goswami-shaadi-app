import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { IconButton } from '@/components/button';
import { timing } from '@/constants/motion';
import { colors } from '@/constants/theme';
import { imageSource } from '@/lib/api';
import type { Photo } from '@/lib/types';

const MAX_ZOOM = 4;

/**
 * Full-screen photo gallery: each photo shown whole (not cropped), swipe between photos,
 * pinch or double-tap to zoom, and the ✕ (or the back button) to return to the profile.
 */
export function PhotoViewer({
  photos,
  index,
  onClose,
}: {
  photos: Photo[];
  /** Photo to open at; null keeps the viewer closed. */
  index: number | null;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index ?? 0);
  const [zoomed, setZoomed] = useState(false);
  const [opened, setOpened] = useState(index);

  // Each time the viewer opens, start on the photo that was tapped.
  if (index !== opened) {
    setOpened(index);
    if (index !== null) {
      setCurrent(index);
      setZoomed(false);
    }
  }

  return (
    <Modal visible={index !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        {index !== null ? (
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(p) => String(p.id)}
            scrollEventThrottle={32}
            onScroll={(e) => setCurrent(Math.min(photos.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / width))))}
            renderItem={({ item }) => <ZoomableImage url={item.url} width={width} height={height} onZoom={setZoomed} />}
          />
        ) : null}

        <View style={[styles.top, { top: insets.top + 10 }]} pointerEvents="box-none">
          <Text style={styles.counter}>
            {current + 1} / {photos.length}
          </Text>
          <IconButton icon="close" accessibilityLabel="Close photo" onPress={onClose} color={colors.white} background="rgba(255,255,255,0.16)" size={44} />
        </View>

        {photos.length > 1 ? (
          <View style={[styles.dots, { bottom: insets.bottom + 28 }]} pointerEvents="none">
            {photos.map((p, i) => (
              <View key={p.id} style={[styles.dot, i === current && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomableImage({ url, width, height, onZoom }: { url: string; width: number; height: number; onZoom: (zoomed: boolean) => void }) {
  const [zoomed, setZoomed] = useState(false);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const report = (value: boolean) => {
    setZoomed(value);
    onZoom(value);
  };

  const clampTo = (value: number, size: number, s: number) => {
    'worklet';
    const max = (size * (s - 1)) / 2;
    return Math.min(max, Math.max(-max, value));
  };

  const pinch = usePinchGesture({
    onActivate: () => {
      'worklet';
      startScale.set(scale.value);
    },
    onUpdate: (e) => {
      'worklet';
      scale.set(Math.min(MAX_ZOOM, Math.max(1, startScale.value * e.scale)));
      x.set(clampTo(x.value, width, scale.value));
      y.set(clampTo(y.value, height, scale.value));
    },
    onDeactivate: () => {
      'worklet';
      const isZoomed = scale.value > 1.05;
      if (!isZoomed) {
        scale.set(withTiming(1, timing));
        x.set(withTiming(0, timing));
        y.set(withTiming(0, timing));
      }
      scheduleOnRN(report, isZoomed);
    },
  });

  // Moving around a zoomed photo; while not zoomed, swipes go to the gallery instead.
  const pan = usePanGesture({
    enabled: zoomed,
    onActivate: () => {
      'worklet';
      startX.set(x.value);
      startY.set(y.value);
    },
    onUpdate: (e) => {
      'worklet';
      x.set(clampTo(startX.value + e.translationX, width, scale.value));
      y.set(clampTo(startY.value + e.translationY, height, scale.value));
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      'worklet';
      const zoomIn = scale.value <= 1.05;
      scale.set(withTiming(zoomIn ? 2.5 : 1, timing));
      x.set(withTiming(0, timing));
      y.set(withTiming(0, timing));
      scheduleOnRN(report, zoomIn);
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, style]}>
        <Image source={imageSource(url)} style={StyleSheet.absoluteFill} contentFit="contain" transition={200} accessibilityLabel="Profile photo" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05060C' },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  dots: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 22, backgroundColor: colors.white },
});
