import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';
import { DEFAULT_API_URL, getApiUrl, setServerOverride } from '@/lib/config';
import { Button } from './button';
import { TextField } from './fields';
import { BottomSheet } from './sheet';

/** Any HTTP answer from the login endpoint (even 400 for an empty body) means the backend is up. */
async function isReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lets testers point the app at a different backend without a rebuild — e.g. when the
 * computer running the backend gets a new Wi-Fi address.
 */
export function ServerSheet({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [address, setAddress] = useState(getApiUrl());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Each time the sheet opens, start from the address in use right now.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setAddress(getApiUrl());
      setError(null);
    }
  }

  const save = async (value: string | null) => {
    setBusy(true);
    setError(null);
    const url = await setServerOverride(value);
    const ok = await isReachable(url);
    setBusy(false);
    if (!ok) {
      setAddress(url);
      setError(`Saved, but nothing answered at ${url}. Check the address and that the backend is running.`);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Server address">
      <Text style={styles.text}>The address of the computer running the GoswamiShaadi backend, for example 192.168.1.20:8080.</Text>
      <TextField
        value={address}
        onChangeText={setAddress}
        placeholder="192.168.1.20:8080"
        icon="server-outline"
        keyboardType="url"
        autoCapitalize="none"
        error={error}
      />
      <Button title="Save & connect" icon="checkmark" loading={busy} onPress={() => save(address)} />
      <Button
        title={`Reset to default (${DEFAULT_API_URL.replace(/^https?:\/\//, '')})`}
        variant="ghost"
        size="sm"
        disabled={busy}
        onPress={() => save(null)}
        style={{ marginTop: 8 }}
      />
    </BottomSheet>
  );
}

/** "Change server address" link shown under a connection error on the login and sign-up screens. */
export function ChangeServerLink() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Text style={styles.link} onPress={() => setOpen(true)} accessibilityRole="button">
        Change server address
      </Text>
      <ServerSheet visible={open} onClose={() => setOpen(false)} onSaved={() => {}} />
    </>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'center', color: colors.primary, fontWeight: '700', fontSize: 13, padding: 8, marginBottom: 8 },
  text: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: 14 },
});
