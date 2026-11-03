import { Client } from '@stomp/stompjs';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getAuthToken } from './api';
import { useAuth } from './auth';
import { getWsUrl } from './config';

// stompjs creates a TextEncoder/TextDecoder up front. Hermes may not ship TextDecoder,
// and React Native only ever hands us text frames, so a minimal fallback is enough.
const g = globalThis as unknown as { TextDecoder?: unknown };
if (typeof g.TextDecoder === 'undefined') {
  g.TextDecoder = class {
    decode(input?: ArrayBuffer | Uint8Array) {
      if (!input) return '';
      const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
      let s = '';
      for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      try {
        return decodeURIComponent(escape(s));
      } catch {
        return s;
      }
    }
  };
}

/**
 * chat: new messages for me (see ChatController) · call: call signals (see CallService) ·
 * audio: relay-mode call audio · connect: fired each time the websocket (re)connects, with no body.
 */
export type Topic = 'chat' | 'call' | 'audio' | 'connect';
type Listener = (body: unknown) => void;
const SERVER_TOPICS = ['chat', 'call', 'audio'] as const;

type RealtimeValue = {
  subscribe: (topic: Topic, fn: Listener) => () => void;
  /** Sends a frame to one of the server's /app handlers; false while disconnected. */
  publish: (destination: string, body: string) => boolean;
  /** Whether the websocket is connected right now. */
  connected: boolean;
};

const RealtimeContext = createContext<RealtimeValue | null>(null);

/**
 * One websocket for the whole app, opened while a member is signed in. The server only accepts it
 * with the member's token and only lets them subscribe to their own topics. Reconnects automatically.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { status, session } = useAuth();
  const userId = status === 'ready' ? session?.userId : undefined;
  const listeners = useRef<Record<Topic, Set<Listener>>>({ chat: new Set(), call: new Set(), audio: new Set(), connect: new Set() });
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const client = new Client({
      brokerURL: getWsUrl(),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // A phone changing networks can leave the socket stuck opening or silently dead. Android never reports
      // either, and can't close a socket that is still opening, so give up on it and retry with a new one.
      connectionTimeout: 10000,
      discardWebsocketOnCommFailure: true,
      // Required for React Native's WebSocket implementation.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      beforeConnect: () => {
        client.connectHeaders = { Authorization: `Bearer ${getAuthToken() ?? ''}` };
      },
      onConnect: () => {
        for (const topic of SERVER_TOPICS) {
          client.subscribe(`/topic/${topic}/${userId}`, (frame) => {
            let body: unknown;
            try {
              body = JSON.parse(frame.body);
            } catch {
              return;
            }
            listeners.current[topic].forEach((fn) => fn(body));
          });
        }
        setConnected(true);
        listeners.current.connect.forEach((fn) => fn(null));
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });
    clientRef.current = client;
    client.activate();
    return () => {
      clientRef.current = null;
      setConnected(false);
      client.deactivate();
    };
  }, [userId]);

  const subscribe = useCallback((topic: Topic, fn: Listener) => {
    listeners.current[topic].add(fn);
    return () => {
      listeners.current[topic].delete(fn);
    };
  }, []);

  const publish = useCallback((destination: string, body: string) => {
    const client = clientRef.current;
    if (!client?.connected) return false;
    client.publish({ destination, body });
    return true;
  }, []);

  const value = useMemo(() => ({ subscribe, publish, connected }), [subscribe, publish, connected]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

/** Calls `handler` with every frame the server pushes on `topic` while the component is mounted. */
export function useRealtime<T>(topic: Topic, handler: (body: T) => void) {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used inside RealtimeProvider');
  const { subscribe } = ctx;
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  }, [handler]);
  useEffect(() => subscribe(topic, (body) => latest.current(body as T)), [subscribe, topic]);
}

/** Sends frames over the shared websocket (see RealtimeValue.publish). */
export function usePublish() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('usePublish must be used inside RealtimeProvider');
  return ctx.publish;
}

/** Whether the shared websocket is connected right now. */
export function useRealtimeConnected() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtimeConnected must be used inside RealtimeProvider');
  return ctx.connected;
}
