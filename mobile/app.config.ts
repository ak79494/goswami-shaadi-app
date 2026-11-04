import type { ConfigContext, ExpoConfig } from 'expo/config';

// Test builds (Expo Go and the "preview" APK) talk to a backend on the local Wi-Fi over plain
// HTTP, which Android blocks unless it is allowed. Production builds must use an HTTPS server.
const allowHttp = process.env.APP_VARIANT !== 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [...(config.plugins ?? []), ['expo-build-properties', { android: { usesCleartextTraffic: allowHttp } }]],
});
