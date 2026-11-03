import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale, type IconName } from '@/components/button';
import { EmptyState, ErrorBanner, RowSkeleton } from '@/components/feedback';
import { Header } from '@/components/screen';
import { colors, radius } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { api, errorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { Notification } from '@/lib/types';

const META: Record<string, { icon: IconName; color: string; route: '/inbox' | '/chats' | '/matches' }> = {
  INTEREST: { icon: 'heart', color: colors.primary, route: '/inbox' },
  MESSAGE: { icon: 'chatbubble-ellipses', color: '#2563EB', route: '/chats' },
  SHORTLIST: { icon: 'star', color: colors.gold, route: '/matches' },
  PROFILE_VISIT: { icon: 'eye', color: colors.success, route: '/matches' },
  REPORT: { icon: 'shield-checkmark', color: colors.warning, route: '/matches' },
};

export default function Notifications() {
  const { refresh } = useActivity();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<Notification[]>('/notifications'));
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

  const open = async (n: Notification) => {
    if (!n.read) {
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
      api.patch(`/notifications/${n.id}/read`).then(refresh).catch(() => {});
    }
    const meta = META[n.type ?? ''];
    if (meta) router.navigate(meta.route);
  };

  const unread = items?.filter((n) => !n.read).length ?? 0;

  return (
    <View style={styles.root}>
      <Header title="Notifications" subtitle={unread ? `${unread} unread` : 'You are all caught up'} />
      {items === null ? (
        [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : undefined}
          ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="No notifications yet" message="Interests, messages and profile visits will show up here." />}
          renderItem={({ item, index }) => {
            const meta = META[item.type ?? ''] ?? { icon: 'notifications' as IconName, color: colors.textMuted };
            return (
              <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40)}>
                <PressableScale onPress={() => open(item)} scaleTo={0.98} accessibilityLabel={item.message}>
                  <View style={[styles.row, !item.read && styles.rowUnread]}>
                    <View style={[styles.icon, { backgroundColor: `${meta.color}1A` }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.message, !item.read && styles.messageUnread]}>{item.message}</Text>
                      <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    {!item.read ? <View style={styles.dot} /> : null}
                  </View>
                </PressableScale>
              </Animated.View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowUnread: { backgroundColor: colors.primarySoft, borderColor: colors.primaryTint },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 14, lineHeight: 20, color: colors.text },
  messageUnread: { fontWeight: '700' },
  time: { fontSize: 12, color: colors.textFaint, marginTop: 3 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
});
