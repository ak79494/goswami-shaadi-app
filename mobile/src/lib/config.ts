import Constants from 'expo-constants';

import { storage } from './storage';

/**
 * Where the Spring Boot backend lives, in order of preference:
 * 1. An address saved from the app's "Server address" sheet (handy when testing an APK on Wi-Fi).
 * 2. EXPO_PUBLIC_API_URL, baked in at build time (eas.json sets it for each build profile).
 * 3. In Expo Go: the computer that is serving the app, on port 8080.
 */
function defaultApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:8080` : 'http://localhost:8080';
}

export const DEFAULT_API_URL = defaultApiUrl();
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const SERVER_KEY = 'gs.server';
let apiUrl = DEFAULT_API_URL;

export const getApiUrl = () => apiUrl;
export const getWsUrl = () => apiUrl.replace(/^http/, 'ws') + '/ws';
export const isCustomServer = () => apiUrl !== DEFAULT_API_URL;

export async function loadServerOverride() {
  const saved = await storage.get(SERVER_KEY).catch(() => null);
  if (saved) apiUrl = saved;
}

/** Saves a new server address (e.g. "192.168.1.20:8080"); pass null to go back to the default. */
export async function setServerOverride(address: string | null): Promise<string> {
  const clean = address?.trim().replace(/\/+$/, '');
  if (clean) {
    apiUrl = /^https?:\/\//i.test(clean) ? clean : `http://${clean}`;
    await storage.set(SERVER_KEY, apiUrl);
  } else {
    apiUrl = DEFAULT_API_URL;
    await storage.remove(SERVER_KEY);
  }
  return apiUrl;
}
