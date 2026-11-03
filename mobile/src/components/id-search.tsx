import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { rememberProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/types';
import { Button } from './button';
import { TextField } from './fields';
import { BottomSheet } from './sheet';

/** Opens a member's profile from their Goswami Jodi ID (e.g. GJ0014). */
export function IdSearchSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setId('');
      setError(null);
    }
  }

  const search = async () => {
    const clean = id.trim().toUpperCase().replace(/\s+/g, '');
    if (clean.length < 3) {
      setError('Enter a profile ID, for example GJ0014');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const profile = await api.get<Profile>(`/profiles/goswami/${encodeURIComponent(clean)}`);
      rememberProfiles([profile]);
      onClose();
      router.push(profile.user.id === session?.userId ? '/me' : `/profile/${profile.user.id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Search by Profile ID">
      <Text style={styles.text}>Every member has a Goswami Jodi ID on their profile. Enter it to open that profile.</Text>
      <TextField
        value={id}
        onChangeText={(v) => {
          setId(v);
          if (error) setError(null);
        }}
        placeholder="e.g. GJ0014"
        icon="search-outline"
        autoCapitalize="characters"
        returnKeyType="search"
        onSubmitEditing={search}
        error={error}
      />
      <Button title="Find profile" icon="search" loading={busy} onPress={search} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: 14 },
});
