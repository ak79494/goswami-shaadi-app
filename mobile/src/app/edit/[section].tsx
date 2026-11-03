import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/feedback';
import { formFromProfile, ProfileFields, sectionByKey, toRequest, validateSection } from '@/components/profile-form';
import { Header, KeyboardScreen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Profile, ProfileForm } from '@/lib/types';

export default function EditSection() {
  const { section: key } = useLocalSearchParams<{ section: string }>();
  const section = sectionByKey(key);
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<ProfileForm | null>(() => (profile ? formFromProfile(profile) : null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!section || !form) {
    return (
      <View style={styles.root}>
        <Header title="Edit profile" />
        <EmptyState icon="alert-circle-outline" title="Section not found" actionLabel="Go back" onAction={() => router.back()} />
      </View>
    );
  }

  const update = (k: keyof ProfileForm, value: unknown) => {
    setForm((f) => (f ? { ...f, [k]: value } : f));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const save = async () => {
    const e = validateSection(section, form);
    if (Object.values(e).some(Boolean)) {
      setErrors(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setBusy(true);
    try {
      const saved = await api.put<Profile>('/profiles/me', toRequest(form));
      setProfile(saved);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast(`${section.title} saved`);
      router.back();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header title={section.title} subtitle={section.subtitle} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.View entering={motion.enter()}>
          <ProfileFields section={section} form={form} onChange={update} errors={errors} />
        </Animated.View>
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Save changes" icon="checkmark" size="lg" loading={busy} onPress={save} />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 32 },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
