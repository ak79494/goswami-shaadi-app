import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/button';
import { TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';

export default function ForgotPassword() {
  const toast = useToast();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) return setError('Enter the email you registered with');
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast('We emailed you a 6-digit code');
      setStep('reset');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (otp.length !== 6) return setError('Enter the 6-digit code from your email');
    if (password.length < 8) return setError('New password must be at least 8 characters');
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { email: email.trim().toLowerCase(), otp, newPassword: password });
      toast('Password changed. Please log in.');
      router.replace('/login');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header transparent />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.Text entering={motion.enter()} style={styles.title}>
          {step === 'email' ? 'Reset your password' : 'Check your email'}
        </Animated.Text>
        <Text style={styles.subtitle}>
          {step === 'email'
            ? "Enter your registered email and we'll send you a one-time code."
            : `Enter the code sent to ${email.trim()} and choose a new password.`}
        </Text>

        {step === 'email' ? (
          <Animated.View key="email" entering={motion.enter(100)}>
            <TextField
              label="Email address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
            />
            <Button title="Send code" size="lg" loading={busy} onPress={sendOtp} style={{ marginTop: 8 }} />
          </Animated.View>
        ) : (
          <Animated.View key="reset" entering={motion.fade()}>
            <TextField
              label="6-digit code"
              icon="keypad-outline"
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
            />
            <TextField
              label="New password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secure
              autoCapitalize="none"
              error={error}
            />
            <Button title="Change password" size="lg" loading={busy} onPress={reset} style={{ marginTop: 8 }} />
            <Button title="Resend code" variant="ghost" onPress={sendOtp} style={{ marginTop: 8 }} />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textMuted, marginTop: 6, marginBottom: 24 },
});
