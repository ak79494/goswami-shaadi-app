import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { api } from './api';
import { useAuth } from './auth';
import type { InterestRequest, InterestState, RequestStatus, Shortlist } from './types';

/**
 * Interests, shortlist and unread counts, shared by every screen so a card, the profile
 * page and the tab badges always agree. Refreshed every 30 seconds while the app is open.
 */
type ActivityContextValue = {
  incoming: InterestRequest[];
  outgoing: InterestRequest[];
  shortlistIds: Set<number>;
  unreadChats: number;
  unreadNotifications: number;
  pendingIncoming: number;
  interestState: (userId: number) => InterestState;
  requestFrom: (userId: number) => InterestRequest | undefined;
  acceptedWith: (userId: number) => InterestRequest | undefined;
  sendInterest: (userId: number) => Promise<void>;
  respond: (requestId: number, status: RequestStatus) => Promise<void>;
  toggleShortlist: (userId: number) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { status, session } = useAuth();
  // Keyed by account so logging out (or switching accounts) starts from a clean slate.
  return (
    <ActivityState key={status === 'ready' ? session?.userId : 'none'} ready={status === 'ready'}>
      {children}
    </ActivityState>
  );
}

function ActivityState({ ready, children }: { ready: boolean; children: ReactNode }) {
  const [incoming, setIncoming] = useState<InterestRequest[]>([]);
  const [outgoing, setOutgoing] = useState<InterestRequest[]>([]);
  const [shortlistIds, setShortlistIds] = useState<Set<number>>(new Set());
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refresh = useCallback(async () => {
    if (!ready) return;
    const [inc, out, sl, chats, notes] = await Promise.all([
      api.get<InterestRequest[]>('/requests/incoming').catch(() => null),
      api.get<InterestRequest[]>('/requests/outgoing').catch(() => null),
      api.get<Shortlist[]>('/shortlists').catch(() => null),
      api.get<number>('/chats/unread-count').catch(() => null),
      api.get<number>('/notifications/unread-count').catch(() => null),
    ]);
    if (inc) setIncoming(inc);
    if (out) setOutgoing(out);
    if (sl) setShortlistIds(new Set(sl.map((s) => s.targetUser.id)));
    if (typeof chats === 'number') setUnreadChats(chats);
    if (typeof notes === 'number') setUnreadNotifications(notes);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch: state is only set once the requests resolve
    refresh();
    const timer = setInterval(() => AppState.currentState === 'active' && refresh(), 30_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [ready, refresh]);

  const latest = (list: InterestRequest[], pick: (r: InterestRequest) => number, userId: number) =>
    list
      .filter((r) => pick(r) === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

  const requestFrom = (userId: number) => latest(incoming, (r) => r.sender.id, userId);
  const requestTo = (userId: number) => latest(outgoing, (r) => r.receiver.id, userId);

  const acceptedWith = (userId: number) => {
    const inc = requestFrom(userId);
    if (inc?.status === 'ACCEPTED') return inc;
    const out = requestTo(userId);
    if (out?.status === 'ACCEPTED') return out;
    return undefined;
  };

  // Mirrors InteractionService.interestStatus on the backend.
  const interestState = (userId: number): InterestState => {
    if (acceptedWith(userId)) return 'INTEREST_ACCEPTED';
    if (requestTo(userId)?.status === 'PENDING') return 'INTEREST_SENT';
    if (requestFrom(userId)?.status === 'PENDING') return 'INTEREST_RECEIVED';
    return 'SEND_INTEREST';
  };

  const sendInterest = async (userId: number) => {
    const req = await api.post<InterestRequest>(`/requests/${userId}`);
    setOutgoing((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
  };

  const respond = async (requestId: number, next: RequestStatus) => {
    const updated = await api.patch<InterestRequest>(`/requests/${requestId}?status=${next}`);
    const swap = (list: InterestRequest[]) => list.map((r) => (r.id === requestId ? updated : r));
    setIncoming(swap);
    setOutgoing(swap);
  };

  const toggleShortlist = async (userId: number) => {
    const isListed = shortlistIds.has(userId);
    const next = new Set(shortlistIds);
    if (isListed) next.delete(userId);
    else next.add(userId);
    setShortlistIds(next);
    try {
      if (isListed) await api.delete(`/shortlists/${userId}`);
      else await api.post(`/shortlists/${userId}`);
      return !isListed;
    } catch (e) {
      setShortlistIds(shortlistIds);
      throw e;
    }
  };

  const value: ActivityContextValue = {
    incoming,
    outgoing,
    shortlistIds,
    unreadChats,
    unreadNotifications,
    pendingIncoming: incoming.filter((r) => r.status === 'PENDING').length,
    interestState,
    requestFrom,
    acceptedWith,
    sendInterest,
    respond,
    toggleShortlist,
    refresh,
  };

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used inside ActivityProvider');
  return ctx;
}
