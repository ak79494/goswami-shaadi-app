import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, BackHandler, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Avatar } from '@/components/avatar';
import { Button, IconButton, PressableScale, type IconName } from '@/components/button';
import { ConnectButton } from '@/components/cards';
import { ErrorBanner } from '@/components/feedback';
import { useToast } from '@/components/toast';
import { KeyboardScreen } from '@/components/screen';
import { ActionSheet, BottomSheet, type SheetAction } from '@/components/sheet';
import { easeOut, motion, timing } from '@/constants/motion';
import { chatTheme, colors, radius, shadow } from '@/constants/theme';
import { useActivity } from '@/lib/activity';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCalls } from '@/lib/calls';
import { clockTime, dateTime, fullName, isOnline, lastSeen } from '@/lib/format';
import { usePrimaryPhoto, useUserProfile } from '@/lib/profiles';
import { usePublish, useRealtime } from '@/lib/realtime';
import type { BlockedMember, Message } from '@/lib/types';

type Row = { kind: 'message'; message: Message } | { kind: 'day'; label: string; key: string };
type Entering = ComponentProps<typeof Animated.View>['entering'];
/** The chat topic carries new messages, plus small events (see ChatController). */
type ChatEvent = Message | { event: 'refresh' | 'typing'; userId: number };

/** Messages from the same person this close together are drawn as one group. */
const GROUP_GAP_MS = 5 * 60 * 1000;
/** Same limit as Message.DELETE_FOR_EVERYONE_HOURS on the server, which is what enforces it. */
const DELETE_FOR_EVERYONE_HOURS = 8;
const DELETED_TEXT = 'This message was deleted';
const TYPING_SEND_EVERY_MS = 2500;
const TYPING_SHOW_MS = 4000;
const SWIPE_TO_REPLY = 56;
const FLASH_MS = 1400;

const ICEBREAKERS = [
  'Namaste! How are you?',
  'I really liked your profile 😊',
  'Tell me a little about your family',
  'What do you enjoy doing on weekends?',
];

// New messages glide in from their own side and settle without overshooting.
const enterMine = FadeInRight.duration(280).easing(easeOut);
const enterTheirs = FadeInLeft.duration(280).easing(easeOut);

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Newest-first rows with a date chip between days (the list is inverted). */
function buildRows(messages: Message[]): Row[] {
  const rows: Row[] = [];
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  let lastDay = '';
  for (const m of sorted) {
    const label = dayLabel(m.createdAt);
    if (label !== lastDay) {
      rows.push({ kind: 'day', label, key: `day-${m.id}` });
      lastDay = label;
    }
    rows.push({ kind: 'message', message: m });
  }
  return rows.reverse();
}

function sameGroup(a: Row | undefined, b: Row | undefined): boolean {
  if (a?.kind !== 'message' || b?.kind !== 'message') return false;
  if (isCallLog(a.message) || isCallLog(b.message)) return false;
  return (
    a.message.sender.id === b.message.sender.id &&
    Math.abs(new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime()) < GROUP_GAP_MS
  );
}

/** Calls are logged in the chat as "📞 Voice call · 2:31" or "📞 Missed voice call" (see the call screen). */
const isCallLog = (m: Message) => m.content?.startsWith('📞');
const isDeleted = (m: Message) => m.messageType === 'DELETED';
const isVoice = (m: Message) => m.messageType === 'VOICE';
const previewOf = (m: Message) => (isVoice(m) ? '🎤 Voice message' : m.content);

function timeLeft(seconds: number): string {
  const totalMinutes = Math.ceil(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export default function Chat() {
  const { userId: raw } = useLocalSearchParams<{ userId: string }>();
  const otherId = Number(raw);
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { interestState, refresh } = useActivity();
  const { startCall } = useCalls();
  const toast = useToast();
  const profile = useUserProfile(otherId);
  const photo = usePrimaryPhoto(otherId);
  const myId = session?.userId;
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const list = useRef<FlatList<Row>>(null);
  const publish = usePublish();

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [info, setInfo] = useState<Message | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [flashed, setFlashed] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const firstLoadMaxId = useRef<number | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const load = useCallback(async () => {
    try {
      const list = await api.get<Message[]>(`/chats/${otherId}/messages`);
      if (firstLoadMaxId.current === null) firstLoadMaxId.current = list.reduce((max, m) => Math.max(max, m.id), 0);
      setMessages(list);
      setError(null);
      api.patch(`/chats/${otherId}/read`).catch(() => {});
    } catch (e) {
      setError(errorMessage(e));
      setMessages((prev) => prev ?? []);
    }
  }, [otherId]);

  useEffect(() => {
    // Safety net in case the live connection drops.
    const timer = setInterval(load, 10_000);
    return () => {
      clearInterval(timer);
      refresh();
    };
  }, [load, refresh]);

  // Reload whenever the chat comes back into view — e.g. after a call, so its log shows up at once.
  useFocusEffect(
    useCallback(() => {
      load();
      api
        .get<BlockedMember[]>('/blocks')
        .then((members) => setBlocked(members.some((b) => b.targetUserId === otherId)))
        .catch(() => {});
    }, [load, otherId]),
  );

  useRealtime<ChatEvent>('chat', (e) => {
    if ('event' in e) {
      if (e.userId !== otherId) return;
      if (e.event === 'refresh') load();
      else {
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), TYPING_SHOW_MS);
      }
      return;
    }
    if (e.sender?.id !== otherId) return;
    setTyping(false);
    setMessages((prev) => (prev && !prev.some((x) => x.id === e.id) ? [...prev, e] : prev));
    if (scrolledUp) setUnseen((n) => n + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    api.patch(`/chats/${otherId}/read`).catch(() => {});
  });

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    [],
  );

  const selecting = selected.length > 0;

  // While messages are selected, the back button clears the selection instead of leaving the chat.
  useEffect(() => {
    if (!selecting) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelected([]);
      return true;
    });
    return () => sub.remove();
  }, [selecting]);

  const onChangeText = (value: string) => {
    setText(value);
    const now = Date.now();
    if (value.trim() && !blocked && now - lastTypingSent.current > TYPING_SEND_EVERY_MS) {
      lastTypingSent.current = now;
      publish('/app/chat.typing', JSON.stringify({ toUserId: otherId }));
    }
  };

  const toBottom = () => {
    list.current?.scrollToOffset({ offset: 0, animated: true });
    setUnseen(0);
  };

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const saved = await api.post<Message>('/chats/messages', { toUserId: otherId, content, replyToId: replyTo?.id });
      setMessages((prev) => [...(prev ?? []), saved]);
      setText('');
      setReplyTo(null);
      lastTypingSent.current = 0;
      toBottom();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setSending(false);
    }
  };

  const toggle = (id: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const startReply = (m: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelected([]);
    setReplyTo(m);
    input.current?.focus();
  };

  const picked = (messages ?? []).filter((m) => selected.includes(m.id));
  const only = picked.length === 1 ? picked[0] : null;
  const canReply = !!only && !blocked && !isDeleted(only) && !isCallLog(only);
  const canCopy = picked.length > 0 && picked.every((m) => !isDeleted(m) && !isCallLog(m) && !isVoice(m));
  const canDeleteForEveryone = picked.length > 0 && picked.every((m) => m.sender.id === myId && (m.deleteForEveryoneSeconds ?? 0) > 0);
  const tooLate = picked.some((m) => m.sender.id === myId && !isDeleted(m) && !isCallLog(m) && !(m.deleteForEveryoneSeconds ?? 0));

  const copy = async () => {
    const copied = picked.map((m) => m.content).join('\n');
    setSelected([]);
    await Clipboard.setStringAsync(copied);
    toast(picked.length > 1 ? `${picked.length} messages copied` : 'Message copied', 'info');
  };

  const remove = async (forEveryone: boolean) => {
    const ids = selected;
    setSelected([]);
    if (replyTo && ids.includes(replyTo.id)) setReplyTo(null);
    // Shown straight away; if the server refuses, the reload below puts it back.
    setMessages((prev) => {
      if (!prev) return prev;
      if (!forEveryone) return prev.filter((m) => !ids.includes(m.id));
      return prev.map((m) =>
        ids.includes(m.id)
          ? { ...m, messageType: 'DELETED', content: DELETED_TEXT, audioUrl: null, replyToId: null, replyToSenderId: null, replyToText: null, deleteForEveryoneSeconds: 0 }
          : m,
      );
    });
    try {
      await api.post('/chats/messages/delete', { ids, forEveryone });
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
    load();
  };

  const showInfo = (m: Message) => {
    setSelected([]);
    setInfo(m);
    setInfoOpen(true);
  };

  const unblock = async () => {
    try {
      await api.delete(`/blocks/${otherId}`);
      setBlocked(false);
      refresh();
      toast(`${profile?.firstName ?? 'They'} can message you again`, 'info');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const state = interestState(otherId);
  const call = (video: boolean) => {
    if (blocked) toast(`Unblock ${profile?.firstName ?? 'them'} to call`, 'info');
    else if (state === 'SEND_INTEREST') toast(`Send ${profile?.firstName ?? 'them'} an interest first — then you can call`, 'info');
    else startCall(otherId, video);
  };
  const name = profile ? fullName(profile) : 'Chat';
  const seen = lastSeen(profile?.user.lastActiveAt);
  const online = seen === 'Online now';
  const rows = messages ? buildRows(messages) : [];
  const nameOf = (senderId?: number | null) => (senderId === myId ? 'You' : profile?.firstName ?? 'Them');

  // The quoted message may be far up the chat: go there and flash it.
  const jumpTo = (id?: number | null) => {
    const index = rows.findIndex((r) => r.kind === 'message' && r.message.id === id);
    if (!id || index < 0) {
      toast('That message is no longer in this chat', 'info');
      return;
    }
    list.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
    setFlashed(id);
    setTimeout(() => setFlashed((current) => (current === id ? null : current)), FLASH_MS);
  };

  const deleteActions: SheetAction[] = [
    ...(canDeleteForEveryone ? [{ label: 'Delete for everyone', icon: 'people-outline' as const, destructive: true, onPress: () => remove(true) }] : []),
    { label: 'Delete for me', icon: 'person-outline', destructive: true, onPress: () => remove(false) },
  ];

  return (
    <KeyboardScreen style={styles.root}>
      <Wallpaper />

      {selecting ? (
        <Animated.View entering={motion.fade()} style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <IconButton icon="close" accessibilityLabel="Clear selection" onPress={() => setSelected([])} background={chatTheme.accentSoft} color={chatTheme.accent} size={40} />
          <Text style={styles.selectedCount}>{selected.length}</Text>
          {canReply && only ? <SelectionAction icon="arrow-undo" label="Reply" onPress={() => startReply(only)} /> : null}
          {canCopy ? <SelectionAction icon="copy-outline" label="Copy" onPress={copy} /> : null}
          {only ? <SelectionAction icon="information-circle-outline" label="Info" onPress={() => showInfo(only)} /> : null}
          <SelectionAction icon="trash-outline" label="Delete" onPress={() => setDeleteOpen(true)} />
        </Animated.View>
      ) : (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={() => router.back()} background={chatTheme.accentSoft} color={chatTheme.accent} size={40} />
        <PressableScale onPress={() => router.push(`/profile/${otherId}`)} scaleTo={0.97} style={{ flex: 1 }} accessibilityLabel={`Open ${name}'s profile`}>
          <View style={styles.headerPerson}>
            <Avatar uri={photo} name={name} size={42} online={isOnline(profile?.user.lastActiveAt)} ring={chatTheme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName} numberOfLines={1}>
                {name}
              </Text>
              {typing ? (
                <Text style={styles.headerTyping}>typing…</Text>
              ) : seen ? (
                <View style={styles.statusRow}>
                  {online ? <OnlinePulse /> : null}
                  <Text style={[styles.headerSeen, online && { color: colors.success }]}>{seen}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </PressableScale>
        <IconButton
          icon="videocam"
          accessibilityLabel={`Video call ${name}`}
          color={chatTheme.accent}
          background={chatTheme.accentSoft}
          size={40}
          onPress={() => call(true)}
        />
        <IconButton icon="call" accessibilityLabel={`Voice call ${name}`} color={colors.white} background={chatTheme.accent} size={40} onPress={() => call(false)} />
      </View>
      )}

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {!blocked && state === 'SEND_INTEREST' && messages?.length === 0 ? (
        <Animated.View entering={motion.enter()} style={styles.gate}>
          <Ionicons name="heart-circle" size={44} color={colors.primary} />
          <Text style={styles.gateTitle}>Send an interest to start chatting</Text>
          <Text style={styles.gateText}>Messaging opens once there is an interest between you and {profile?.firstName ?? 'this member'}.</Text>
          <ConnectButton userId={otherId} style={{ alignSelf: 'stretch', marginTop: 14 }} />
        </Animated.View>
      ) : null}

      {messages === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={chatTheme.accent} />
        </View>
      ) : (
        <View style={styles.listArea}>
        <Animated.FlatList
          ref={list as never}
          inverted
          data={rows}
          extraData={[selected, flashed, blocked]}
          keyExtractor={(r) => (r.kind === 'day' ? r.key : String(r.message.id))}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          itemLayoutAnimation={motion.layout}
          scrollEventThrottle={64}
          onScroll={(e) => {
            const up = e.nativeEvent.contentOffset.y > 320;
            setScrolledUp(up);
            if (!up) setUnseen(0);
          }}
          onScrollToIndexFailed={(failed) => {
            // That part of the list hasn't been drawn yet: move close to it, then aim again.
            list.current?.scrollToOffset({ offset: failed.averageItemLength * failed.index, animated: true });
            setTimeout(() => list.current?.scrollToIndex({ index: failed.index, viewPosition: 0.5, animated: true }), 350);
          }}
          renderItem={({ item, index }) => {
            if (item.kind === 'day') {
              return (
                <View style={styles.dayChip}>
                  <Text style={styles.dayText}>{item.label}</Text>
                </View>
              );
            }
            const m = item.message;
            const isNew = firstLoadMaxId.current !== null && m.id > firstLoadMaxId.current;
            // On first open the latest few messages rise in one after another.
            const intro = !isNew && index < 12 ? motion.enter(index * 35) : undefined;
            const rowProps = {
              selected: selected.includes(m.id),
              flashed: flashed === m.id,
              selecting,
              onToggle: () => toggle(m.id),
            };
            if (isCallLog(m)) {
              return (
                <MessageRow {...rowProps} entering={isNew ? motion.fade() : intro}>
                  <CallLog message={m} mine={m.sender.id === myId} />
                </MessageRow>
              );
            }
            const mine = m.sender.id === myId;
            // The list is inverted: rows[index - 1] is the message below this one, rows[index + 1] the one above.
            const groupStart = !sameGroup(item, rows[index + 1]);
            return (
              <MessageRow
                {...rowProps}
                groupStart={groupStart}
                entering={isNew ? (mine ? enterMine : enterTheirs) : intro}
                onSwipeReply={blocked || isDeleted(m) ? undefined : () => startReply(m)}>
                <Bubble
                  message={m}
                  mine={mine}
                  tail={!sameGroup(item, rows[index - 1])}
                  groupStart={groupStart}
                  quotedName={nameOf(m.replyToSenderId)}
                  onQuote={() => (selecting ? toggle(m.id) : jumpTo(m.replyToId))}
                />
              </MessageRow>
            );
          }}
          ListFooterComponent={
            messages.length === 0 && state !== 'SEND_INTEREST' ? (
              <EmptyChat
                name={profile?.firstName ?? 'your match'}
                onPick={(t) => {
                  setText(t);
                  input.current?.focus();
                }}
              />
            ) : undefined
          }
        />
        {scrolledUp ? (
          <Animated.View entering={motion.fade()} exiting={motion.fadeOut} style={styles.toBottom}>
            <IconButton icon="chevron-down" accessibilityLabel="Go to the latest message" onPress={toBottom} color={chatTheme.accent} background={colors.white} size={42} />
            {unseen > 0 ? (
              <View style={styles.toBottomBadge}>
                <Text style={styles.toBottomBadgeText}>{unseen}</Text>
              </View>
            ) : null}
          </Animated.View>
        ) : null}
        </View>
      )}

      {blocked ? (
        <View style={[styles.composerWrap, styles.blockedBar, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.blockedText}>You blocked {profile?.firstName ?? 'this member'}.</Text>
          <Button title="Unblock" variant="secondary" size="sm" onPress={unblock} />
        </View>
      ) : (
        <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 10 }]}>
          {replyTo ? (
            <Animated.View entering={motion.enterUp()} style={styles.replyBar}>
              <View style={styles.replyAccent} />
              <View style={styles.replyBody}>
                <Text style={styles.replyName} numberOfLines={1}>
                  {replyTo.sender.id === myId ? 'You' : profile?.firstName ?? 'Them'}
                </Text>
                <Text style={styles.replyText} numberOfLines={2}>
                  {previewOf(replyTo)}
                </Text>
              </View>
              <IconButton icon="close" accessibilityLabel="Cancel reply" onPress={() => setReplyTo(null)} color={colors.textMuted} background="transparent" size={32} />
            </Animated.View>
          ) : null}
          <View style={styles.composer}>
            <View style={styles.inputWrap}>
              <TextInput
                ref={input}
                value={text}
                onChangeText={onChangeText}
                placeholder="Write something nice…"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                multiline
                maxLength={1000}
              />
            </View>
            <SendButton active={!!text.trim()} sending={sending} onPress={send} />
          </View>
        </View>
      )}

      <ActionSheet
        visible={deleteOpen}
        title={selected.length > 1 ? `Delete ${selected.length} messages?` : 'Delete message?'}
        message={tooLate ? `Messages can only be deleted for everyone within ${DELETE_FOR_EVERYONE_HOURS} hours of sending.` : undefined}
        actions={deleteActions}
        onClose={() => setDeleteOpen(false)}
      />

      <BottomSheet visible={infoOpen} onClose={() => setInfoOpen(false)} title="Message info">
        {info ? <MessageInfo message={info} mine={info.sender.id === myId} /> : null}
      </BottomSheet>
    </KeyboardScreen>
  );
}

/** One row of the chat: long-press to select, tap to add to a selection, swipe right to reply. */
function MessageRow({
  selected,
  flashed,
  selecting,
  groupStart,
  entering,
  onToggle,
  onSwipeReply,
  children,
}: {
  selected: boolean;
  flashed: boolean;
  selecting: boolean;
  groupStart?: boolean;
  entering?: Entering;
  onToggle: () => void;
  onSwipeReply?: () => void;
  children: ReactNode;
}) {
  const x = useSharedValue(0);
  const armed = useSharedValue(false);
  const buzz = () => {
    Haptics.selectionAsync().catch(() => {});
  };
  const reply = () => onSwipeReply?.();

  const swipe = usePanGesture({
    enabled: !!onSwipeReply && !selecting,
    // Rightward only, and a mostly vertical drag stays a scroll of the list.
    activeOffsetX: 14,
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      'worklet';
      const next = Math.max(0, Math.min(e.translationX, 84));
      x.set(next);
      const reached = next >= SWIPE_TO_REPLY;
      if (reached !== armed.value) {
        armed.set(reached);
        if (reached) scheduleOnRN(buzz);
      }
    },
    onDeactivate: () => {
      'worklet';
      if (armed.value) scheduleOnRN(reply);
      armed.set(false);
      x.set(withTiming(0, timing));
    },
  });

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const icon = useAnimatedStyle(() => ({
    opacity: Math.min(1, x.value / SWIPE_TO_REPLY),
    transform: [{ scale: 0.6 + 0.4 * Math.min(1, x.value / SWIPE_TO_REPLY) }],
  }));

  return (
    <Animated.View entering={entering} style={groupStart && styles.groupStart}>
      <Pressable
        onLongPress={onToggle}
        onPress={selecting ? onToggle : undefined}
        delayLongPress={280}
        style={[styles.row, flashed && styles.rowFlashed, selected && styles.rowSelected]}
        accessibilityState={{ selected }}>
        {onSwipeReply ? (
          <Animated.View style={[styles.swipeIcon, icon]} pointerEvents="none">
            <Ionicons name="arrow-undo" size={18} color={chatTheme.accent} />
          </Animated.View>
        ) : null}
        <GestureDetector gesture={swipe}>
          <Animated.View style={slide}>{children}</Animated.View>
        </GestureDetector>
      </Pressable>
    </Animated.View>
  );
}

function Bubble({
  message,
  mine,
  tail,
  groupStart,
  quotedName,
  onQuote,
}: {
  message: Message;
  mine: boolean;
  tail: boolean;
  groupStart: boolean;
  quotedName: string;
  onQuote: () => void;
}) {
  const deleted = isDeleted(message);
  const ticks = mine && !deleted;
  const delivered = message.read || !!message.deliveredAt;
  const body = (
    <>
      {message.replyToText && !deleted ? (
        <Pressable onPress={onQuote} style={[styles.quote, mine ? styles.quoteMine : styles.quoteTheirs]} accessibilityRole="button" accessibilityLabel="Go to the original message">
          <View style={[styles.quoteAccent, mine && styles.quoteAccentMine]} />
          <View style={styles.quoteBody}>
            <Text style={[styles.quoteName, mine && styles.quoteNameMine]} numberOfLines={1}>
              {quotedName}
            </Text>
            <Text style={[styles.quoteText, mine && styles.quoteTextMine]} numberOfLines={3}>
              {message.replyToText}
            </Text>
          </View>
        </Pressable>
      ) : null}
      <View style={styles.bubbleContent}>
        {deleted ? (
          <Text style={[styles.textFits, styles.deletedText, mine && styles.deletedTextMine]}>
            <Ionicons name="ban-outline" size={14} color={mine ? 'rgba(255,255,255,0.8)' : colors.textMuted} />
            {mine ? ' You deleted this message' : ` ${DELETED_TEXT}`}
          </Text>
        ) : (
          <Text style={[styles.textFits, styles.bubbleText, mine && styles.bubbleTextMine]}>
            {isVoice(message) ? '🎤 Voice message (play it on the website)' : message.content}
          </Text>
        )}
        <View style={styles.meta}>
          <Text style={[styles.time, mine && styles.timeMine]}>{clockTime(message.createdAt)}</Text>
          {ticks ? (
            <Ionicons
              name={delivered ? 'checkmark-done' : 'checkmark'}
              size={15}
              color={message.read ? chatTheme.read : 'rgba(255,255,255,0.75)'}
              accessibilityLabel={message.read ? 'Read' : delivered ? 'Delivered' : 'Sent'}
            />
          ) : null}
        </View>
      </View>
    </>
  );
  const corners = mine
    ? [styles.bubbleMine, !tail && styles.mineJoined, !groupStart && styles.mineJoinedTop]
    : [styles.bubbleTheirs, !tail && styles.theirsJoined, !groupStart && styles.theirsJoinedTop];
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
      {mine ? (
        <LinearGradient colors={chatTheme.sent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, ...corners]}>
          {body}
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, ...corners]}>{body}</View>
      )}
    </View>
  );
}

function SelectionAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return <IconButton icon={icon} accessibilityLabel={label} onPress={onPress} color={chatTheme.accent} background={chatTheme.accentSoft} size={40} />;
}

function InfoLine({ icon, tint, label, value }: { icon: IconName; tint?: string; label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={20} color={tint ?? colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MessageInfo({ message, mine }: { message: Message; mine: boolean }) {
  const secondsLeft = message.deleteForEveryoneSeconds ?? 0;
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoPreview} numberOfLines={4}>
        {isDeleted(message) ? DELETED_TEXT : previewOf(message).replace(/^📞\s*/, '')}
      </Text>
      <InfoLine icon="time-outline" label={mine ? 'Sent' : 'Received'} value={dateTime(message.createdAt)} />
      {mine ? (
        <>
          <InfoLine icon="checkmark-done" label="Delivered" value={message.deliveredAt ? dateTime(message.deliveredAt) : message.read ? 'Yes' : 'Not yet'} />
          <InfoLine icon="checkmark-done" tint="#0EA5E9" label="Read" value={message.readAt ? dateTime(message.readAt) : message.read ? 'Yes' : 'Not yet'} />
          {secondsLeft > 0 ? <Text style={styles.infoHint}>You can delete this for everyone for another {timeLeft(secondsLeft)}.</Text> : null}
        </>
      ) : null}
    </View>
  );
}

function CallLog({ message, mine }: { message: Message; mine: boolean }) {
  const missed = /missed/i.test(message.content);
  const video = /video/i.test(message.content);
  const label = message.content.replace(/^📞\s*/, '');
  return (
    <View style={styles.callLog}>
      <View style={[styles.callIcon, { backgroundColor: missed ? '#FFE4E6' : '#DCFCE7' }]}>
        <Ionicons name={mine ? 'arrow-up' : 'arrow-down'} size={11} color={missed ? '#E11D48' : colors.success} style={styles.callArrow} />
        <Ionicons name={video ? 'videocam' : 'call'} size={13} color={missed ? '#E11D48' : colors.success} />
      </View>
      <Text style={styles.callText}>{label}</Text>
      <Text style={styles.callTime}>{clockTime(message.createdAt)}</Text>
    </View>
  );
}

function EmptyChat({ name, onPick }: { name: string; onPick: (text: string) => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [t]);
  const glow = useAnimatedStyle(() => ({ transform: [{ scale: 1 + t.value * 0.08 }], opacity: 0.35 + t.value * 0.25 }));

  return (
    <Animated.View entering={motion.enter()} style={styles.empty}>
      <View style={styles.emptyArt}>
        <Animated.View style={[styles.emptyGlow, glow]} />
        <LinearGradient colors={chatTheme.sent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyIcon}>
          <Ionicons name="chatbubbles" size={34} color={colors.white} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Start a conversation with {name}</Text>
      <Text style={styles.emptyText}>Not sure what to say? Pick a message to begin.</Text>
      <View style={styles.chips}>
        {ICEBREAKERS.map((line, i) => (
          <Animated.View key={line} entering={motion.enter(150 + i * 70)}>
            <Pressable onPress={() => onPick(line)} style={({ pressed }) => [styles.chip, pressed && { backgroundColor: chatTheme.accentSoft }]}>
              <Text style={styles.chipText}>{line}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

/** Grey until there is text; then the violet gradient fades in and the arrow turns to point forward. */
function SendButton({ active, sending, onPress }: { active: boolean; sending: boolean; onPress: () => void }) {
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.set(withTiming(active ? 1 : 0, timing));
  }, [active, p]);
  const fill = useAnimatedStyle(() => ({ opacity: p.value }));
  const icon = useAnimatedStyle(() => ({ transform: [{ rotate: `${(1 - p.value) * -40}deg` }, { scale: 0.88 + p.value * 0.12 }] }));

  return (
    <Pressable onPress={onPress} disabled={!active || sending} accessibilityLabel="Send message" style={styles.send}>
      <Animated.View style={[StyleSheet.absoluteFill, fill]}>
        <LinearGradient colors={chatTheme.sent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {sending ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Animated.View style={icon}>
          <Ionicons name="send" size={19} color={active ? colors.white : colors.textFaint} />
        </Animated.View>
      )}
    </Pressable>
  );
}

function OnlinePulse() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1));
  }, [t]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - t.value), transform: [{ scale: 1 + t.value * 1.4 }] }));
  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, ring]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

const DECOR: { icon: IconName; top: string; left: string; size: number; delay: number }[] = [
  { icon: 'heart', top: '14%', left: '8%', size: 22, delay: 0 },
  { icon: 'sparkles', top: '26%', left: '78%', size: 20, delay: 900 },
  { icon: 'chatbubble-ellipses', top: '44%', left: '14%', size: 24, delay: 400 },
  { icon: 'heart', top: '58%', left: '84%', size: 18, delay: 1500 },
  { icon: 'flower', top: '72%', left: '40%', size: 22, delay: 700 },
  { icon: 'star', top: '86%', left: '12%', size: 16, delay: 1200 },
];

/** Soft gradient background with a few faint symbols that drift slowly up and down. */
function Wallpaper() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={chatTheme.wallpaper} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {DECOR.map((d) => (
        <Drifting key={`${d.icon}-${d.top}`} {...d} />
      ))}
    </View>
  );
}

function Drifting({ icon, top, left, size, delay }: { icon: IconName; top: string; left: string; size: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true)));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -14 * t.value }, { rotate: `${-8 + 16 * t.value}deg` }] }));
  return (
    <Animated.View style={[styles.decor, { top: top as `${number}%`, left: left as `${number}%` }, style]}>
      <Ionicons name={icon} size={size} color={chatTheme.decor} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: chatTheme.wallpaper[0] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    ...shadow.card,
  },
  headerPerson: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { fontSize: 16, fontWeight: '800', color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  headerSeen: { fontSize: 12, color: colors.textMuted },
  headerTyping: { fontSize: 12, fontWeight: '700', color: chatTheme.accent, marginTop: 1 },
  selectedCount: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, marginLeft: 4 },
  pulseWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.online },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.online },
  gate: {
    alignItems: 'center',
    margin: 16,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  gateTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 8, textAlign: 'center' },
  gateText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listArea: { flex: 1 },
  list: { paddingVertical: 14, flexGrow: 1 },
  row: { paddingHorizontal: 12, paddingVertical: 1 },
  rowSelected: { backgroundColor: 'rgba(124,58,237,0.18)' },
  rowFlashed: { backgroundColor: 'rgba(124,58,237,0.26)' },
  swipeIcon: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toBottom: { position: 'absolute', right: 14, bottom: 12, borderRadius: 21, ...shadow.raised },
  toBottomBadge: {
    position: 'absolute',
    top: -5,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chatTheme.accent,
  },
  toBottomBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  dayChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginVertical: 12,
  },
  dayText: { fontSize: 11, fontWeight: '800', color: chatTheme.accent, letterSpacing: 0.3 },
  bubbleRow: { maxWidth: '82%' },
  groupStart: { marginTop: 10 },
  rowMine: { alignSelf: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, minWidth: 72 },
  bubbleMine: { borderBottomRightRadius: 6, ...shadow.card },
  mineJoined: { borderBottomRightRadius: 18 },
  mineJoinedTop: { borderTopRightRadius: 8 },
  bubbleTheirs: { backgroundColor: chatTheme.received, borderBottomLeftRadius: 6, ...shadow.card },
  theirsJoined: { borderBottomLeftRadius: 18 },
  theirsJoinedTop: { borderTopLeftRadius: 8 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: chatTheme.receivedText },
  bubbleTextMine: { color: colors.white },
  // The time follows short text and wraps to its own line under long text, always at the right edge.
  bubbleContent: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 8 },
  // Lets a long address with no spaces break inside the bubble instead of running out of it.
  textFits: { flexShrink: 1, minWidth: 0 },
  meta: { marginLeft: 'auto', minHeight: 16, flexDirection: 'row', alignItems: 'center', gap: 3 },
  deletedText: { fontSize: 14, lineHeight: 21, fontStyle: 'italic', color: colors.textMuted },
  deletedTextMine: { color: 'rgba(255,255,255,0.85)' },
  quote: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  quoteMine: { backgroundColor: 'rgba(255,255,255,0.18)' },
  quoteTheirs: { backgroundColor: chatTheme.accentSoft },
  quoteAccent: { width: 4, backgroundColor: chatTheme.accent },
  quoteAccentMine: { backgroundColor: colors.white },
  quoteBody: { flexShrink: 1, paddingHorizontal: 9, paddingVertical: 6 },
  quoteName: { fontSize: 12, fontWeight: '800', color: chatTheme.accent },
  quoteNameMine: { color: colors.white },
  quoteText: { fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 1 },
  quoteTextMine: { color: 'rgba(255,255,255,0.88)' },
  infoBox: { paddingBottom: 8 },
  infoPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    backgroundColor: chatTheme.accentSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 13, color: colors.textMuted },
  infoHint: { fontSize: 12, lineHeight: 18, color: colors.textMuted, marginTop: 8 },
  time: { fontSize: 11, color: colors.textFaint },
  timeMine: { color: 'rgba(255,255,255,0.8)' },
  callLog: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    marginVertical: 8,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    ...shadow.card,
  },
  callIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  callArrow: { position: 'absolute', top: 2, right: 2 },
  callText: { fontSize: 13, fontWeight: '700', color: colors.text },
  callTime: { fontSize: 11, color: colors.textFaint },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 12 },
  emptyArt: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  emptyGlow: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#C4B5FD' },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 14, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  chips: { marginTop: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: chatTheme.accentSoft,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: chatTheme.accent },
  composerWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...shadow.raised,
  },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  blockedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  blockedText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textMuted },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: chatTheme.accentSoft,
    marginBottom: 8,
  },
  replyAccent: { alignSelf: 'stretch', width: 4, backgroundColor: chatTheme.accent },
  replyBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 7 },
  replyName: { fontSize: 12, fontWeight: '800', color: chatTheme.accent },
  replyText: { fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 1 },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    maxHeight: 124,
    justifyContent: 'center',
    backgroundColor: '#F6F3FF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: chatTheme.accentSoft,
  },
  input: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: colors.text, maxHeight: 120 },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#ECEAF4',
  },
  decor: { position: 'absolute', opacity: 0.08 },
});
