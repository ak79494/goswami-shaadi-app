import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ChipSelect, TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, radius } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { COMMUNITIES, EDUCATION, FOOD, LIFESTYLE, MARITAL_STATUS, PROFESSIONS, RELIGIONS } from '@/lib/options';
import type { Preference } from '@/lib/types';

// The backend stores multi-choice preferences as comma-separated strings (same as the web app).
const split = (v?: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const join = (v: string[]) => (v.length ? v.join(', ') : null);

export default function Preferences() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [pref, setPref] = useState<Preference | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<Preference>('/preferences')
      .then((p) => setPref({ minAge: 21, maxAge: 35, ...p }))
      .catch(() => setPref({ minAge: 21, maxAge: 35 }));
  }, []);

  if (!pref) {
    return (
      <View style={styles.root}>
        <Header title="Partner preferences" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const set = (patch: Partial<Preference>) => setPref((p) => ({ ...p, ...patch }));
  const minAge = pref.minAge ?? 21;
  const maxAge = pref.maxAge ?? 35;

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/preferences', pref);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast('Preferences saved — your matches will improve');
      router.back();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const chips = (label: string, key: keyof Preference, options: string[]) => (
    <ChipSelect label={label} options={options} value={split(pref[key] as string)} onChange={(v) => set({ [key]: join(v) })} multiple />
  );

  return (
    <KeyboardScreen style={styles.root}>
      <Header title="Partner preferences" subtitle="We use these to rank your matches" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.View entering={motion.enter()} style={styles.card}>
          <Text style={styles.cardTitle}>Age range</Text>
          <View style={styles.ageRow}>
            <Stepper label="From" value={minAge} min={18} max={maxAge} onChange={(v) => set({ minAge: v })} />
            <Text style={styles.ageDash}>—</Text>
            <Stepper label="To" value={maxAge} min={minAge} max={70} onChange={(v) => set({ maxAge: v })} />
          </View>
        </Animated.View>

        <Animated.View entering={motion.enter(60)} style={styles.card}>
          {chips('Marital status', 'maritalStatuses', MARITAL_STATUS)}
          {chips('Religion', 'religions', RELIGIONS)}
          {chips('Community', 'communities', COMMUNITIES)}
        </Animated.View>

        <Animated.View entering={motion.enter(120)} style={styles.card}>
          {chips('Education', 'education', EDUCATION)}
          {chips('Profession', 'profession', PROFESSIONS)}
        </Animated.View>

        <Animated.View entering={motion.enter(180)} style={styles.card}>
          {chips('Diet', 'foodPreference', FOOD)}
          {chips('Lifestyle', 'lifestyle', LIFESTYLE)}
          <TextField
            label="Preferred cities"
            icon="location-outline"
            value={pref.cities ?? ''}
            onChangeText={(cities) => set({ cities })}
            placeholder="e.g. Varanasi, Delhi, Pune"
            autoCapitalize="words"
            hint="Separate cities with commas"
          />
          <TextField
            label="What I'm looking for"
            value={pref.expectations ?? ''}
            onChangeText={(expectations) => set({ expectations })}
            placeholder="Share the qualities and values you hope for in a partner…"
            multiline
            maxLength={2000}
          />
        </Animated.View>
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Save preferences" icon="checkmark" size="lg" loading={busy} onPress={save} />
      </View>
    </KeyboardScreen>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const step = (d: number) => {
    const next = Math.min(max, Math.max(min, value + d));
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
  };
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable onPress={() => step(-1)} style={styles.stepBtn} accessibilityLabel={`Decrease ${label} age`}>
          <Ionicons name="remove" size={18} color={colors.primary} />
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable onPress={() => step(1)} style={styles.stepBtn} accessibilityLabel={`Increase ${label} age`}>
          <Ionicons name="add" size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingBottom: 32, gap: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, paddingBottom: 4, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  ageDash: { fontSize: 18, color: colors.textFaint, marginTop: 18 },
  stepper: { flex: 1 },
  stepLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 6,
  },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
