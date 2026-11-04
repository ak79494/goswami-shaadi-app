import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/fields';
import { Header, KeyboardScreen } from '@/components/screen';
import { colors, radius } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const REASONS = ['Found my match', 'Taking a break', 'Not happy with the app', 'Something else'];

const DELETED = [
  'Your profile, photos and partner preferences',
  'Your chats, voice notes and call history, for you and for the members you talked to',
  'Your interests, shortlists, blocks, reports and notifications',
];

export default function DeleteAccount() {
  const insets = useSafeAreaInsets();
  const { signOut, premium } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post('/account/delete', { password, reason });
      await signOut();
      Alert.alert('Account deleted', 'Your account and your data have been deleted.');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!password) {
      setError('Enter your password to confirm');
      return;
    }
    setError(null);
    Alert.alert('Delete your account?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <KeyboardScreen style={styles.root}>
      <Header title="Delete account" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={22} color={colors.primary} />
          <Text style={styles.warningText}>This permanently deletes your account. It can’t be undone.</Text>
        </View>

        <Text style={styles.section}>What gets deleted</Text>
        <View style={styles.card}>
          {DELETED.map((text) => (
            <View key={text} style={styles.row}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
              <Text style={styles.rowText}>{text}</Text>
            </View>
          ))}
          {premium?.active ? (
            <View style={styles.row}>
              <Ionicons name="diamond-outline" size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
              <Text style={styles.rowText}>Your {premium.planName} membership, which ends with your account</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.section}>What we keep</Text>
        <View style={styles.card}>
          <Text style={styles.rowText}>
            Payment records (plan, amount, payment reference and date), without your name or contact details, because tax rules require them.
          </Text>
        </View>

        <Text style={styles.section}>Why are you leaving? (optional)</Text>
        <View style={styles.reasons}>
          {REASONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setReason(reason === r ? null : r)}
              style={[styles.reason, reason === r && styles.reasonOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r }}>
              <Text style={[styles.reasonText, reason === r && styles.reasonTextOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Your password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError(null);
          }}
          placeholder="Enter your password to confirm"
          secure
          autoCapitalize="none"
          autoComplete="password"
          error={error}
        />
        <Text style={styles.hint}>Forgot it? Log out and tap Forgot password on the login screen.</Text>

        <Button title="Delete my account" icon="trash-outline" size="lg" loading={busy} onPress={confirm} style={{ marginTop: 16 }} />
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16 },
  warning: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  warningText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.text },
  section: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: 10 },
  rowText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  reason: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  reasonOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  reasonText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  reasonTextOn: { color: colors.primary },
  hint: { fontSize: 12, lineHeight: 18, color: colors.textFaint, marginTop: -6 },
});
