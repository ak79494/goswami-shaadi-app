import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutLeft } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/button';
import { PersonRow } from '@/components/cards';
import { EmptyState } from '@/components/feedback';
import { TabTitle } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/format';
import { useUserProfile } from '@/lib/profiles';
import type { InterestRequest } from '@/lib/types';

type Kind = 'received' | 'accepted' | 'sent' | 'declined';

/** Matches InteractionService.DECLINE_PAUSE_DAYS: a declined profile returns to your matches after this. */
const DECLINE_PAUSE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const byNewest = (a: InterestRequest, b: InterestRequest) =>
  (b.respondedAt ?? b.createdAt).localeCompare(a.respondedAt ?? a.createdAt);

export default function Inbox() {
  const { incoming, outgoing, refresh } = useActivity();
  const [tab, setTab] = useState<Kind>('received');
  const [refreshing, setRefreshing] = useState(false);

  const received = incoming.filter((r) => r.status === 'PENDING').sort(byNewest);
  const sent = outgoing.filter((r) => r.status === 'PENDING').sort(byNewest);
  const accepted = [...incoming, ...outgoing].filter((r) => r.status === 'ACCEPTED').sort(byNewest);
  // Interests you declined, and interests of yours that were declined.
  const declined = [...incoming, ...outgoing].filter((r) => r.status === 'REJECTED').sort(byNewest);
  const data = { received, accepted, sent, declined }[tab];

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <TabTitle title="Interests" subtitle="People who want to connect with you" />
      <View style={styles.tabs}>
        <Segmented
          tabs={[
            { key: 'received', label: 'Received', badge: received.length || undefined },
            { key: 'accepted', label: 'Accepted' },
            { key: 'sent', label: 'Sent' },
            { key: 'declined', label: 'Declined' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <FlatList
        data={data}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item, index }) => <InterestItem request={item} kind={tab} index={index} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ListEmptyComponent={
          tab === 'received' ? (
            <EmptyState
              icon="mail-open-outline"
              title="No new interests"
              message="When someone likes your profile, they'll appear here. A complete profile with photos gets noticed faster."
              actionLabel="Improve my profile"
              onAction={() => router.navigate('/me')}
            />
          ) : tab === 'accepted' ? (
            <EmptyState icon="people-circle-outline" title="No connections yet" message="Accepted interests appear here so you can start chatting." />
          ) : tab === 'declined' ? (
            <EmptyState
              icon="close-circle-outline"
              title="No declined profiles"
              message={`Profiles you decline wait here and come back into your matches after ${DECLINE_PAUSE_DAYS} days, in case you change your mind.`}
            />
          ) : (
            <EmptyState
              icon="paper-plane-outline"
              title="You haven't sent any interests"
              message="Find someone you like and tap Send Interest."
              actionLabel="Browse matches"
              onAction={() => router.navigate('/matches')}
            />
          )
        }
      />
    </View>
  );
}

/** Days until a declined profile returns to your matches (0 once it has). */
function daysUntilBack(declinedAt: string): number {
  return Math.max(0, Math.ceil((new Date(declinedAt).getTime() + DECLINE_PAUSE_DAYS * DAY_MS - Date.now()) / DAY_MS));
}

function InterestItem({ request, kind, index }: { request: InterestRequest; kind: Kind; index: number }) {
  const { session } = useAuth();
  const { respond } = useActivity();
  const toast = useToast();
  const [busy, setBusy] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const otherId = request.sender.id === session?.userId ? request.receiver.id : request.sender.id;
  const declinedByMe = request.receiver.id === session?.userId;
  const profile = useUserProfile(otherId);

  const answer = async (status: 'ACCEPTED' | 'REJECTED') => {
    setBusy(status);
    try {
      await respond(request.id, status);
      toast(status === 'ACCEPTED' ? 'Connected! You can chat now.' : 'Declined — you can find it under Declined', status === 'ACCEPTED' ? 'success' : 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
      setBusy(null);
    }
  };

  const declinedAt = request.respondedAt ?? request.createdAt;
  const daysLeft = daysUntilBack(declinedAt);
  const subtitle =
    kind === 'received'
      ? `Interested in you · ${timeAgo(request.createdAt)}`
      : kind === 'sent'
        ? `Sent ${timeAgo(request.createdAt)} · Awaiting reply`
        : kind === 'declined'
          ? declinedByMe
            ? `You declined · ${timeAgo(declinedAt)}`
            : `Declined your interest · ${timeAgo(declinedAt)}`
          : `Connected ${timeAgo(request.respondedAt ?? request.createdAt)}`;

  return (
    <Animated.View layout={motion.layout} exiting={FadeOutLeft}>
      <PersonRow
        userId={otherId}
        profile={profile}
        subtitle={subtitle}
        index={index}
        right={
          // Chat is open as soon as there is an interest, whether or not it has been accepted yet.
          kind === 'declined' ? null : (
            <IconButton
              icon="chatbubble-ellipses"
              color={colors.white}
              background={colors.primary}
              accessibilityLabel="Chat"
              onPress={() => router.push(`/chat/${otherId}`)}
            />
          )
        }
        footer={
          kind === 'received' ? (
            <View style={styles.actions}>
              <Button
                title="Decline"
                icon="close"
                variant="muted"
                size="sm"
                loading={busy === 'REJECTED'}
                disabled={!!busy}
                onPress={() => answer('REJECTED')}
                style={{ flex: 1 }}
              />
              <Button
                title="Accept"
                icon="checkmark"
                size="sm"
                loading={busy === 'ACCEPTED'}
                disabled={!!busy}
                onPress={() => answer('ACCEPTED')}
                style={{ flex: 1 }}
              />
            </View>
          ) : kind === 'sent' ? (
            <Text style={styles.waiting}>We’ll notify you when they respond — you can already chat.</Text>
          ) : kind === 'declined' ? (
            declinedByMe ? (
              <View style={styles.declined}>
                <Text style={styles.declinedText}>
                  {daysLeft > 0 ? `Back in your matches in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'Back in your matches'}
                </Text>
                <Button
                  title="Accept now"
                  icon="checkmark"
                  variant="secondary"
                  size="sm"
                  loading={busy === 'ACCEPTED'}
                  disabled={!!busy}
                  onPress={() => answer('ACCEPTED')}
                />
              </View>
            ) : (
              <Text style={styles.waiting}>
                {daysLeft > 0 ? `You can send a new interest in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.` : 'You can send a new interest from their profile.'}
              </Text>
            )
          ) : null
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: { paddingHorizontal: 16, paddingBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  waiting: { fontSize: 12, color: colors.textFaint, marginTop: 10 },
  declined: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  declinedText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.textMuted },
});
