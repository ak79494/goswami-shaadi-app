import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { EmptyState, ErrorBanner, RowSkeleton } from '@/components/feedback';
import { Header } from '@/components/screen';
import { ActionSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors, radius, shadow } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { api, errorMessage } from '@/lib/api';
import { longDate } from '@/lib/format';
import type { BlockedMember } from '@/lib/types';

/** Everyone this member has blocked, with a way to unblock them. Opened from the ☰ menu. */
export default function Blocked() {
  const { refresh } = useActivity();
  const toast = useToast();
  const [items, setItems] = useState<BlockedMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<BlockedMember | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<BlockedMember[]>('/blocks'));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch: state is only set once the request resolves
    load();
  }, [load]);

  const unblock = async (member: BlockedMember) => {
    try {
      await api.delete(`/blocks/${member.targetUserId}`);
      setItems((list) => list?.filter((m) => m.targetUserId !== member.targetUserId) ?? null);
      toast(`${member.name} has been unblocked`, 'info');
      refresh();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const ask = (member: BlockedMember) => {
    setConfirm(member);
    setSheetOpen(true);
  };

  return (
    <View style={styles.root}>
      <Header title="Blocked members" subtitle={items?.length ? `${items.length} blocked` : undefined} />
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {items === null ? (
        [0, 1, 2].map((i) => <RowSkeleton key={i} />)
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => String(m.targetUserId)}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={motion.enter(index * 40)} layout={motion.layout} exiting={motion.fadeOut} style={styles.card}>
              <Pressable
                onPress={() => router.push(`/profile/${item.targetUserId}`)}
                style={styles.person}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.name}'s profile`}>
                <Avatar uri={item.photoUrl} name={item.name} size={52} />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta}>{item.goswamiId}</Text>
                  <Text style={styles.meta}>Blocked on {longDate(item.createdAt)}</Text>
                </View>
              </Pressable>
              <Button title="Unblock" variant="secondary" size="sm" onPress={() => ask(item)} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="ban-outline"
              title="No blocked members"
              message="When you block someone from the ⋯ menu on their profile, they appear here so you can unblock them any time."
            />
          }
        />
      )}
      <ActionSheet
        visible={sheetOpen}
        title={confirm ? `Unblock ${confirm.name}?` : undefined}
        message="You will be able to see each other again, and chat and call if there is an interest between you."
        actions={confirm ? [{ label: 'Unblock', icon: 'checkmark-circle-outline', onPress: () => unblock(confirm) }] : []}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
