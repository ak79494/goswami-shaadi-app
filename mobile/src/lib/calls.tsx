import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { api } from './api';
import { useAuth } from './auth';
import { registerForPush } from './push';
import { usePublish, useRealtime, useRealtimeConnected } from './realtime';

export type SignalType =
  | 'invite'
  | 'ringing'
  | 'accept'
  | 'decline'
  | 'busy'
  | 'cancel'
  | 'end'
  | 'offer'
  | 'answer'
  | 'ice'
  /** Switch to server-relayed audio when the phones can't connect directly. */
  | 'relay'
  /** The sender's mic/camera changed: data {muted, video}. */
  | 'media';

/**
 * A call set-up message relayed by the server on /topic/call/{me} (see CallService). `seq` numbers
 * each member's signals, so ones missed while the websocket was down can be fetched and duplicates dropped.
 */
export type CallSignal = { seq?: number; fromUserId: number; fromName: string; callId: string; type: SignalType; data?: unknown };

/** The call on screen right now. */
export type ActiveCall = { callId: string; peerId: number; video: boolean };

type CallContextValue = {
  startCall: (userId: number, video?: boolean) => void;
  /** Sends a signal; delivered says whether the other member's app is connected (their phone rings). */
  send: (toUserId: number, callId: string, type: SignalType, data?: unknown) => Promise<{ delivered: boolean }>;
  /** Listens to the signals of one call; returns the unsubscribe function. */
  listen: (callId: string, fn: (s: CallSignal) => void) => () => void;
  /** Relay mode: voice frames for one call, and sending ours. */
  listenAudio: (callId: string, fn: (frame: string) => void) => () => void;
  sendAudio: (callId: string, frame: string) => void;
  active: ActiveCall | null;
  /** Set by the call screen, so a second incoming call gets an automatic "busy". */
  setActive: (call: ActiveCall) => void;
  /** The call screen for `callId` has closed (ignored if another call has taken its place). */
  release: (callId: string) => void;
};

const CallContext = createContext<CallContextValue | null>(null);

const CALL_CHANNEL = 'calls';
/** While a call is on screen and the websocket is down, fetch its signals this often instead. */
const CATCH_UP_MS = 1500;
const FINAL_SIGNALS = new Set<SignalType>(['cancel', 'end', 'decline', 'busy']);

export const newCallId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const isVideo = (s: CallSignal) => !!(s.data && typeof s.data === 'object' && (s.data as { video?: boolean }).video);

async function setUpNotifications() {
  if (Platform.OS === 'web') return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CALL_CHANNEL, {
        name: 'Calls',
        description: 'Incoming voice and video calls',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 900, 700, 900, 700, 900],
        lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted && current.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {
    // Notifications are a nice-to-have: calls still ring while the app is open.
  }
}

/** Shown when a call arrives while the app is in the background, so the member notices it. */
async function notify(title: string, body: string, data: Record<string, unknown>): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default', priority: Notifications.AndroidNotificationPriority.MAX },
      trigger: Platform.OS === 'android' ? { channelId: CALL_CHANNEL } : null,
    });
  } catch {
    return null;
  }
}

/**
 * Routes call signals. An incoming "invite" opens the call screen from anywhere in the app (and
 * shows a notification when the app is in the background); everything else goes to the call screen
 * listening for that call. A call that rang while the websocket was down is picked up from the
 * server when the app reconnects or comes back to the foreground, and the signals of a call in
 * progress keep arriving (by polling) while the websocket reconnects.
 */
export function CallProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const publish = usePublish();
  const connected = useRealtimeConnected();
  const [active, setActiveState] = useState<ActiveCall | null>(null);
  const activeRef = useRef<ActiveCall | null>(null);
  const seen = useRef(new Set<string>());
  const listeners = useRef(new Map<string, Set<(s: CallSignal) => void>>());
  const audioListeners = useRef(new Map<string, (frame: string) => void>());
  const notices = useRef(new Map<string, string>());
  const lastSeq = useRef<number | null>(null);
  const handled = useRef(new Set<number>());

  const send = useCallback(async (toUserId: number, callId: string, type: SignalType, data?: unknown) => {
    const res = await api.post<{ delivered?: boolean } | null>('/calls/signal', { toUserId, callId, type, data: data ?? null });
    return { delivered: res?.delivered !== false };
  }, []);

  const clearNotice = useCallback((callId: string) => {
    const id = notices.current.get(callId);
    if (!id) return;
    notices.current.delete(callId);
    Notifications.dismissNotificationAsync(id).catch(() => {});
  }, []);

  const setActive = useCallback((call: ActiveCall) => {
    activeRef.current = call;
    setActiveState(call);
  }, []);

  const release = useCallback(
    (callId: string) => {
      clearNotice(callId);
      if (activeRef.current?.callId !== callId) return;
      activeRef.current = null;
      setActiveState(null);
    },
    [clearNotice],
  );

  const ring = useCallback(
    (s: CallSignal) => {
      if (seen.current.has(s.callId)) return;
      seen.current.add(s.callId);
      if (activeRef.current) {
        send(s.fromUserId, s.callId, 'busy').catch(() => {});
        return;
      }
      const video = isVideo(s);
      setActive({ callId: s.callId, peerId: s.fromUserId, video });
      send(s.fromUserId, s.callId, 'ringing').catch(() => {});
      router.push({
        pathname: '/call/[userId]',
        params: { userId: String(s.fromUserId), callId: s.callId, incoming: '1', video: video ? '1' : '0' },
      });
      if (AppState.currentState !== 'active') {
        notify(`Incoming ${video ? 'video' : 'voice'} call`, `${s.fromName} is calling you on GoswamiJodi`, { callId: s.callId }).then(
          (id) => id && notices.current.set(s.callId, id),
        );
      }
    },
    [send, setActive],
  );

  /** Handles each signal once, whether it came over the websocket or from a catch-up fetch. */
  const dispatch = useCallback(
    (s: CallSignal, caughtUp: boolean) => {
      if (typeof s.seq === 'number') {
        if (handled.current.has(s.seq)) return;
        handled.current.add(s.seq);
        if (handled.current.size > 500) handled.current.delete(handled.current.values().next().value as number);
        if (lastSeq.current === null || s.seq > lastSeq.current) lastSeq.current = s.seq;
      }
      if (s.type === 'invite') {
        // A missed invite is only worth ringing if the call is still ringing: checkRinging asks the server.
        if (!caughtUp) ring(s);
        return;
      }
      if (FINAL_SIGNALS.has(s.type) && notices.current.has(s.callId)) {
        clearNotice(s.callId);
        if (s.type === 'cancel' && AppState.currentState !== 'active') {
          notify('Missed call', `You missed a call from ${s.fromName}`, {});
        }
      }
      listeners.current.get(s.callId)?.forEach((fn) => fn(s));
    },
    [ring, clearNotice],
  );

  useRealtime<CallSignal>('call', (s) => dispatch(s, false));

  const catchUp = useCallback(async () => {
    try {
      const inbox = await api.get<{ seq: number; signals: CallSignal[] }>(`/calls/signals?after=${lastSeq.current ?? 0}`);
      // The first fetch only learns where the numbering is; older signals are history.
      if (lastSeq.current === null) lastSeq.current = inbox.seq;
      else inbox.signals.forEach((s) => dispatch(s, true));
    } catch {
      // Try again on the next tick or reconnect.
    }
  }, [dispatch]);

  useRealtime<{ callId: string; d: string }>('audio', (f) => audioListeners.current.get(f.callId)?.(f.d));

  // A call that started ringing while this phone was briefly offline.
  const checkRinging = useCallback(() => {
    api
      .get<CallSignal | null>('/calls/ringing')
      .then((s) => s?.callId && ring(s))
      .catch(() => {});
  }, [ring]);
  useRealtime('connect', () => {
    catchUp();
    checkRinging();
  });

  useEffect(() => {
    if (!active || connected) return;
    const timer = setInterval(catchUp, CATCH_UP_MS);
    return () => clearInterval(timer);
  }, [active, connected, catchUp]);

  useEffect(() => {
    if (status !== 'ready') return;
    catchUp();
    setUpNotifications().then(registerForPush);
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      catchUp();
      checkRinging();
    });
    return () => sub.remove();
  }, [status, checkRinging, catchUp]);

  const listen = useCallback((callId: string, fn: (s: CallSignal) => void) => {
    const set = listeners.current.get(callId) ?? new Set();
    set.add(fn);
    listeners.current.set(callId, set);
    return () => {
      set.delete(fn);
      if (!set.size) listeners.current.delete(callId);
    };
  }, []);

  const listenAudio = useCallback((callId: string, fn: (frame: string) => void) => {
    audioListeners.current.set(callId, fn);
    return () => {
      if (audioListeners.current.get(callId) === fn) audioListeners.current.delete(callId);
    };
  }, []);

  const sendAudio = useCallback(
    (callId: string, frame: string) => {
      publish('/app/call.audio', JSON.stringify({ callId, d: frame }));
    },
    [publish],
  );

  const startCall = useCallback((userId: number, video = false) => {
    if (activeRef.current) return;
    router.push({ pathname: '/call/[userId]', params: { userId: String(userId), callId: newCallId(), video: video ? '1' : '0' } });
  }, []);

  // The functions stay the same for the app's lifetime: the call screen hangs up if they change.
  const value = useMemo<CallContextValue>(
    () => ({ startCall, send, listen, listenAudio, sendAudio, active, setActive, release }),
    [startCall, send, listen, listenAudio, sendAudio, active, setActive, release],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCalls() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCalls must be used inside CallProvider');
  return ctx;
}
