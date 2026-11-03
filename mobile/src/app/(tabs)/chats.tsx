import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { PressableScale } from '@/components/button';
import { EmptyState, ErrorBanner, RowSkeleton } from '@/components/feedback';
import { TabTitle } from '@/components/screen';
import { colors, radius } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { api, errorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useRealtime } from '@/lib/realtime';
import type { ConversationSummary } from '@/lib/types';

export default function Chats() {
  const { refresh } = useActivity();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isOpen = useRef(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<ConversationSummary[]>('/chats'));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setItems((prev) => prev ?? []);
    }
  }, []);

  // Reload whenever the tab is opened so last messages and unread counts stay fresh.
  useFocusEffect(
    useCallback(() => {
      isOpen.current = true;
      load();
      refresh();
      return () => {
        isOpen.current = false;
      };
    }, [load, refresh]),
  );

  // New and deleted messages show up straight away while the list is on screen. Typing signals don't change it.
  useRealtime<{ event?: string }>('chat', (e) => {
    if (!isOpen.current || e.event === 'typing') return;
    load();
    refresh();
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refresh()]);
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <TabTitle title="Chats" subtitle="Conversations with your connections" />
      {items === null ? (
        [0, 1, 2, 3].map((i) => <RowSkeleton key={i} />)
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => String(c.userId)}
          renderItem={({ item, index }) => <ChatRow chat={item} index={index} />}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : undefined}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              message="Send an interest to someone you like — once there's an interest between you, you can start chatting."
              actionLabel="Find matches"
              onAction={() => router.navigate('/matches')}
            />
          }
        />
      )}
    </View>
  );
}

function ChatRow({ chat, index }: { chat: ConversationSummary; index: number }) {
  const unread = chat.unreadCount > 0;
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45)}>
      <PressableScale onPress={() => router.push(`/chat/${chat.userId}`)} scaleTo={0.98} accessibilityLabel={`Chat with ${chat.name}`}>
        <View style={styles.row}>
          <Avatar uri={chat.photoUrl} name={chat.name} size={56} online={chat.online} />
          <View style={styles.middle}>
            <View style={styles.topLine}>
              <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
                {chat.name}
              </Text>
              <Text style={[styles.time, unread && styles.timeUnread]}>{timeAgo(chat.lastMessageTime)}</Text>
            </View>
            <View style={styles.bottomLine}>
              <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                {chat.lastMessage || 'Say hello 👋'}
              </Text>
              {unread ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: radius.lg,
  },
  middle: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: 12 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 12, color: colors.textFaint },
  timeUnread: { color: colors.primary, fontWeight: '700' },
  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  preview: { flex: 1, fontSize: 14, color: colors.textMuted },
  previewUnread: { color: colors.text, fontWeight: '600' },
  unread: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: colors.white, fontSize: 11, fontWeight: '800' },
});
