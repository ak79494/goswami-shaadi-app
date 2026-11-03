import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { api, ApiError, errorMessage, setAuthToken, setSessionExpiredHandler } from './api';
import { loadServerOverride } from './config';
import { storage } from './storage';
import type { AuthResponse, Gender, Photo, PremiumStatus, Profile } from './types';

type Status = 'loading' | 'signedOut' | 'needsProfile' | 'ready' | 'offline';
type Session = { userId: number; email: string; role?: string };

type SignUpInput = { email: string; password: string; phone: string; gender: Gender };

type AuthContextValue = {
  status: Status;
  session: Session | null;
  profile: Profile | null;
  photos: Photo[];
  /** Premium membership of the signed-in member; null until loaded. */
  premium: PremiumStatus | null;
  isAdmin: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
  setProfile: (p: Profile) => void;
  setPhotos: (p: Photo[]) => void;
  refreshPremium: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'gs.token';
const SESSION_KEY = 'gs.session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setSession(null);
    setProfile(null);
    setPhotos([]);
    setPremium(null);
    setStatus('signedOut');
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(SESSION_KEY)]);
  }, []);

  const refreshPremium = useCallback(async () => {
    const s = await api.get<PremiumStatus>('/premium/status').catch(() => null);
    if (s) setPremium(s);
  }, []);

  const loadAccount = useCallback(async () => {
    setError(null);
    try {
      const me = await api.get<Profile>('/profiles/me');
      const myPhotos = await api.get<Photo[]>('/photos').catch(() => [] as Photo[]);
      setProfile(me);
      setPhotos(myPhotos);
      setStatus('ready');
      refreshPremium();
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        // "Profile not created" — the account exists but onboarding isn't finished.
        setProfile(null);
        setStatus('needsProfile');
      } else if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        await clearSession();
      } else {
        setError(errorMessage(e));
        setStatus('offline');
      }
    }
  }, [clearSession, refreshPremium]);

  const startSession = useCallback(
    async (res: AuthResponse) => {
      const s = { userId: res.userId, email: res.email, role: res.role };
      await storage.set(TOKEN_KEY, res.token);
      await storage.set(SESSION_KEY, JSON.stringify(s));
      setAuthToken(res.token);
      setSession(s);
      await loadAccount();
    },
    [loadAccount],
  );

  // Restore the server address and a saved login when the app starts.
  useEffect(() => {
    (async () => {
      await loadServerOverride();
      const [token, saved] = await Promise.all([storage.get(TOKEN_KEY), storage.get(SESSION_KEY)]);
      if (!token || !saved) {
        setStatus('signedOut');
        return;
      }
      setAuthToken(token);
      setSession(JSON.parse(saved) as Session);
      await loadAccount();
    })();
  }, [loadAccount]);

  useEffect(() => {
    setSessionExpiredHandler(() => void clearSession());
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  // Keep "Online now" accurate for other members while the app is open.
  useEffect(() => {
    if (status !== 'ready') return;
    const beat = () => {
      if (AppState.currentState === 'active') api.post('/auth/heartbeat').catch(() => {});
    };
    beat();
    const timer = setInterval(beat, 60_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && beat());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [status]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>('/auth/login', { email: email.trim().toLowerCase(), password });
      await startSession(res);
    },
    [startSession],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const res = await api.post<AuthResponse>('/auth/register', {
        ...input,
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
      });
      await startSession(res);
    },
    [startSession],
  );

  const value: AuthContextValue = {
    status,
    session,
    profile,
    photos,
    premium,
    isAdmin: session?.role === 'ADMIN',
    error,
    signIn,
    signUp,
    signOut: clearSession,
    reload: loadAccount,
    setProfile,
    setPhotos,
    refreshPremium,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
