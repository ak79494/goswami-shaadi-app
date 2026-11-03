import Constants from 'expo-constants';

/**
 * Where the Spring Boot backend lives:
 * 1. EXPO_PUBLIC_API_URL, baked in at build time (eas.json sets it for each build profile).
 * 2. In Expo Go: the computer that is serving the app, on port 8080.
 */
function defaultApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:8080` : 'http://localhost:8080';
}

const API_URL = defaultApiUrl();

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const WEBSITE_URL = (process.env.EXPO_PUBLIC_WEBSITE_URL ?? 'https://goswamijodi.com').replace(/\/+$/, '');

export const getApiUrl = () => API_URL;
export const getWsUrl = () => API_URL.replace(/^http/, 'ws') + '/ws';
