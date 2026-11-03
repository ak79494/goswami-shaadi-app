import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { PressableScale } from '@/components/button';
import { Header } from '@/components/screen';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, radius } from '@/constants/theme';
import { api, errorMessage, imageSource, upload } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { shrinkPhoto } from '@/lib/images';
import type { Photo } from '@/lib/types';

const MAX = 10;

export default function Photos() {
  const { photos, setPhotos } = useAuth();
  const toast = useToast();
  const { width } = useWindowDimensions();
  // Upload progress from 0 to 1 while a photo is being sent.
  const [progress, setProgress] = useState<number | null>(null);
  const uploading = progress !== null;
  const tile = (width - 16 * 2 - 12 * 2) / 3;

  const reload = async () => {
    const list = await api.get<Photo[]>('/photos');
    setPhotos(list);
  };

  const add = async () => {
    if (photos.length >= MAX) return toast(`You can add up to ${MAX} photos`, 'info');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setProgress(0);
    try {
      const body = new FormData();
      if (Platform.OS === 'web' && asset.file) {
        body.append('file', asset.file);
      } else {
        const uri = await shrinkPhoto(asset.uri);
        body.append('file', { uri, name: `photo-${Date.now()}.jpg`, type: 'image/jpeg' } as unknown as Blob);
      }
      await upload<Photo>('/photos', body, setProgress);
      await reload();
      toast(photos.length === 0 ? 'Looking great! This is now your profile photo.' : 'Photo added');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setProgress(null);
    }
  };

  const manage = (photo: Photo) =>
    Alert.alert('Photo options', undefined, [
      ...(!photo.primaryPhoto
        ? [
            {
              text: 'Make profile photo',
              onPress: async () => {
                try {
                  await api.patch(`/photos/${photo.id}/primary`);
                  await reload();
                  toast('Profile photo updated');
                } catch (e) {
                  toast(errorMessage(e), 'error');
                }
              },
            },
          ]
        : []),
      {
        text: 'Delete photo',
        style: 'destructive' as const,
        onPress: async () => {
          try {
            await api.delete(`/photos/${photo.id}`);
            await reload();
            toast('Photo deleted', 'info');
          } catch (e) {
            toast(errorMessage(e), 'error');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const sorted = [...photos].sort((a, b) => Number(b.primaryPhoto) - Number(a.primaryPhoto) || a.sortOrder - b.sortOrder);

  return (
    <View style={styles.root}>
      <Header title="My photos" subtitle={`${photos.length} of ${MAX} added · tap a photo for options`} />
      <ScrollView contentContainerStyle={styles.body}>
        <Animated.View entering={motion.fade()} style={styles.tip}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.tipText}>Clear, recent photos with your face visible get the most interest. Your first photo is your profile photo.</Text>
        </Animated.View>

        <View style={styles.grid}>
          {sorted.map((p, i) => (
            <Animated.View
              key={p.id}
              entering={ZoomIn.delay(i * 40).duration(220)}
              exiting={ZoomOut.duration(160)}
              layout={motion.layout}>
              <PressableScale onPress={() => manage(p)} accessibilityLabel={p.primaryPhoto ? 'Profile photo options' : 'Photo options'}>
                <View style={[styles.tile, { width: tile, height: tile * 1.25 }]}>
                  <Image source={imageSource(p.url)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  {p.primaryPhoto ? (
                    <View style={styles.primary}>
                      <Ionicons name="star" size={11} color={colors.white} />
                      <Text style={styles.primaryText}>Profile</Text>
                    </View>
                  ) : null}
                </View>
              </PressableScale>
            </Animated.View>
          ))}
          {photos.length < MAX ? (
            <Animated.View layout={motion.layout}>
              <PressableScale onPress={add} disabled={uploading} accessibilityLabel="Add photo">
                <View style={[styles.add, { width: tile, height: tile * 1.25 }]}>
                  {uploading ? (
                    <>
                      <ActivityIndicator color={colors.primary} />
                      <Text style={styles.addText}>{(progress ?? 0) < 1 ? `Uploading ${Math.round((progress ?? 0) * 100)}%` : 'Saving…'}</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.addIcon}>
                        <Ionicons name="add" size={26} color={colors.white} />
                      </View>
                      <Text style={styles.addText}>Add photo</Text>
                    </>
                  )}
                </View>
              </PressableScale>
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  tip: { flexDirection: 'row', gap: 10, backgroundColor: colors.primarySoft, padding: 14, borderRadius: radius.md, marginBottom: 16 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.primaryTint },
  primary: {
    position: 'absolute',
    left: 6,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  primaryText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  add: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
  },
  addIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
