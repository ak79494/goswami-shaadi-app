import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The login token lives in the phone's encrypted keystore. SecureStore has no web
// implementation, so browser previews (npx expo start --web) fall back to localStorage.
const web = Platform.OS === 'web';

export const storage = {
  get: (key: string): Promise<string | null> =>
    web ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> =>
    web ? Promise.resolve(globalThis.localStorage?.setItem(key, value)) : SecureStore.setItemAsync(key, value),
  remove: (key: string): Promise<void> =>
    web ? Promise.resolve(globalThis.localStorage?.removeItem(key)) : SecureStore.deleteItemAsync(key),
};
