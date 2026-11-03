import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { ChangeServerLink } from '@/components/server-sheet';
import { motion, timing } from '@/constants/motion';
import { colors, radius } from '@/constants/theme';
import { ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Gender } from '@/lib/types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Too short', color: colors.primaryBright },
    { label: 'Weak', color: colors.primaryBright },
    { label: 'Fair', color: colors.warning },
    { label: 'Good', color: colors.success },
    { label: 'Strong', color: colors.success },
  ];
  return { score, ...levels[pw.length < 8 ? 0 : score] };
}

export default function Register() {
  const { signUp } = useAuth();
  const [gender, setGender] = useState<Gender | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(password);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!gender) e.gender = 'Please choose one';
    if (!EMAIL.test(email.trim())) e.email = 'Enter a valid email address';
    if (!/^\d{10}$/.test(phone)) e.phone = 'Enter your 10-digit mobile number';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    if (Object.keys(e).length || !gender) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setBusy(true);
    try {
      await signUp({ email, phone, password, gender });
    } catch (err) {
      setErrors({ form: errorMessage(err), ...(err instanceof ApiError && err.status === 0 ? { network: '1' } : {}) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header transparent />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.Text entering={motion.enter()} style={styles.title}>
          Let’s create your account
        </Animated.Text>
        <Animated.Text entering={motion.enter(80)} style={styles.subtitle}>
          It takes less than 2 minutes. Your details stay private.
        </Animated.Text>

        <Animated.View entering={motion.enter(150)}>
          <Text style={styles.label}>I am a</Text>
          <View style={styles.genderRow}>
            <GenderCard label="Man" sub="Looking for a bride" icon="man" selected={gender === 'MALE'} onPress={() => setGender('MALE')} />
            <GenderCard label="Woman" sub="Looking for a groom" icon="woman" selected={gender === 'FEMALE'} onPress={() => setGender('FEMALE')} />
          </View>
          {errors.gender ? <Text style={styles.error}>{errors.gender}</Text> : null}
        </Animated.View>

        <Animated.View entering={motion.enter(230)} style={{ marginTop: 20 }}>
          <TextField
            label="Email address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <TextField
            label="Mobile number"
            prefix="+91"
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit number"
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
            hint="Only shown to members you choose"
          />
          <TextField
            label="Create password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.password}
          />
          {password ? (
            <View style={styles.strength}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.strengthBar, i < strength.score && { backgroundColor: strength.color }]} />
              ))}
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          ) : null}
        </Animated.View>

        {errors.form ? <Text style={[styles.error, styles.formError]}>{errors.form}</Text> : null}
        {errors.network ? <ChangeServerLink /> : null}

        <Button title="Continue" size="lg" iconRight="arrow-forward" loading={busy} onPress={submit} style={{ marginTop: 12 }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already a member? </Text>
          <Text style={styles.link} onPress={() => router.replace('/login')}>
            Log in
          </Text>
        </View>
      </ScrollView>
    </KeyboardScreen>
  );
}

function GenderCard({
  label,
  sub,
  icon,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  icon: 'man' | 'woman';
  selected: boolean;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({ transform: [{ scale: withTiming(selected ? 1.03 : 1, timing) }] }));
  return (
    <Animated.View style={[styles.genderCardWrap, style]}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={[styles.genderCard, selected && styles.genderCardOn]}
        accessibilityRole="radio"
        accessibilityState={{ selected }}>
        <View style={[styles.genderIcon, selected && styles.genderIconOn]}>
          <Ionicons name={icon} size={26} color={selected ? colors.white : colors.primary} />
        </View>
        <Text style={[styles.genderLabel, selected && { color: colors.primary }]}>{label}</Text>
        <Text style={styles.genderSub}>{sub}</Text>
        {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={styles.genderCheck} /> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCardWrap: { flex: 1 },
  genderCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderCardOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  genderIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  genderIconOn: { backgroundColor: colors.primary },
  genderLabel: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 10 },
  genderSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  genderCheck: { position: 'absolute', top: 10, right: 10 },
  strength: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 12 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  strengthLabel: { fontSize: 12, fontWeight: '700', marginLeft: 6, width: 64 },
  error: { color: colors.primaryBright, fontSize: 12, marginTop: 6, fontWeight: '600' },
  formError: { textAlign: 'center', fontSize: 14, marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 14 },
});
