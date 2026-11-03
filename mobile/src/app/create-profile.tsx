import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ProgressBar } from '@/components/feedback';
import { emptyForm, ProfileFields, toRequest, validateSection, WIZARD_SECTIONS as SECTIONS } from '@/components/profile-form';
import { useToast } from '@/components/toast';
import { KeyboardScreen } from '@/components/screen';
import { motion } from '@/constants/motion';
import { colors, radius } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Profile, ProfileForm } from '@/lib/types';

export default function CreateProfile() {
  const insets = useSafeAreaInsets();
  const { reload, signOut } = useAuth();
  const toast = useToast();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const section = SECTIONS[step];
  const last = step === SECTIONS.length - 1;

  // Android's back button steps back through the wizard instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      setStep(step - 1);
      setErrors({});
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const update = (key: keyof ProfileForm, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const go = (delta: 1 | -1) => {
    setStep((s) => s + delta);
    setErrors({});
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const next = async () => {
    const e = validateSection(section, form);
    if (Object.values(e).some(Boolean)) {
      setErrors(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!last) return go(1);
    setBusy(true);
    try {
      await api.put<Profile>('/profiles/me', toRequest({ ...form, profileVisible: true }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast('Profile created! Add photos to get 10x more interests.');
      await reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardScreen style={styles.root}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <Text style={styles.stepText}>
            Step {step + 1} of {SECTIONS.length}
          </Text>
          <Text style={styles.logout} onPress={signOut}>
            Log out
          </Text>
        </View>
        <ProgressBar value={((step + 1) / SECTIONS.length) * 100} />
      </View>

      <ScrollView ref={scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.View key={section.key} entering={motion.fade()}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name={section.icon} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{section.title}</Text>
              <Text style={styles.subtitle}>{section.subtitle}</Text>
            </View>
          </View>
          <ProfileFields section={section} form={form} onChange={update} errors={errors} />
          {last ? (
            <Animated.View entering={motion.enter(200)} style={styles.tip}>
              <Ionicons name="bulb-outline" size={18} color={colors.warning} />
              <Text style={styles.tipText}>
                Tip: profiles with a heartfelt “About me” and 3+ photos receive far more interests.
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        {step > 0 ? <Button title="Back" variant="secondary" onPress={() => go(-1)} style={{ flex: 1 }} /> : null}
        <Button
          title={last ? 'Create my profile' : 'Next'}
          iconRight={last ? 'checkmark' : 'arrow-forward'}
          loading={busy}
          onPress={next}
          style={{ flex: 2 }}
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 20, paddingBottom: 14, gap: 10, backgroundColor: colors.bg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepText: { fontSize: 13, fontWeight: '700', color: colors.primary, letterSpacing: 0.4 },
  logout: { fontSize: 13, fontWeight: '600', color: colors.textMuted, padding: 4 },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  sectionIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  tip: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 4,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
  bottom: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
