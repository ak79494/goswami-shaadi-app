import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { ChangeServerLink } from '@/components/server-sheet';
import { motion } from '@/constants/motion';
import { colors } from '@/constants/theme';
import { ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [busy, setBusy] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const fail = (msg: string) => {
    setError(msg);
    shake.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  };

  const submit = async () => {
    if (!email.trim() || !password) return fail('Enter your email and password');
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setUnreachable(e instanceof ApiError && e.status === 0);
      fail(errorMessage(e) === 'Invalid credentials' ? 'Email or password is incorrect' : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header transparent />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.Text entering={motion.enter()} style={styles.title}>
          Welcome back
        </Animated.Text>
        <Animated.Text entering={motion.enter(80)} style={styles.subtitle}>
          Log in to continue your matrimonial journey
        </Animated.Text>

        <Animated.View entering={motion.enter(160)} style={shakeStyle}>
          <TextField
            label="Email address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secure
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            error={error}
          />
        </Animated.View>

        {unreachable ? (
          <ChangeServerLink />
        ) : (
          <Text style={styles.forgot} onPress={() => router.push('/forgot-password')}>
            Forgot password?
          </Text>
        )}

        <Animated.View entering={motion.enter(240)}>
          <Button title="Log in" size="lg" iconRight="arrow-forward" loading={busy} onPress={submit} />
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to GoswamiShaadi? </Text>
          <Text style={styles.link} onPress={() => router.replace('/register')}>
            Create an account
          </Text>
        </View>
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, marginBottom: 28 },
  forgot: { alignSelf: 'flex-end', color: colors.primary, fontWeight: '700', marginTop: -4, marginBottom: 24, padding: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '800', fontSize: 14 },
});
