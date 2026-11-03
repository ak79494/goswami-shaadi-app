import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Button } from '@/components/button';
import { IntroSplash, NATIVE_SPLASH_FADE_MS } from '@/components/intro-splash';
import { ServerSheet } from '@/components/server-sheet';
import { ToastProvider } from '@/components/toast';
import { colors } from '@/constants/theme';
import { ActivityProvider } from '@/lib/activity';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CallProvider } from '@/lib/calls';
import { getApiUrl } from '@/lib/config';
import { RealtimeProvider } from '@/lib/realtime';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: NATIVE_SPLASH_FADE_MS, fade: true });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <AuthProvider>
        <ActivityProvider>
          <RealtimeProvider>
            <CallProvider>
              <ToastProvider>
                <StatusBar style="dark" />
                <Screens />
              </ToastProvider>
            </CallProvider>
          </RealtimeProvider>
        </ActivityProvider>
        {/* Must stay outside ActivityProvider, which restarts everything inside it on login and logout. */}
        <Opening />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

/** Shown instead of a blank screen if any screen throws while rendering. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <View style={styles.center}>
      <StatusBar style="dark" />
      <View style={styles.icon}>
        <Ionicons name="sad-outline" size={44} color={colors.primary} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.text}>Sorry about that. Please try again — your data is safe.</Text>
      {__DEV__ ? <Text style={styles.hint}>{error.message}</Text> : null}
      <Button title="Try again" icon="refresh" onPress={retry} style={styles.wide} />
    </View>
  );
}

/** Android can rebuild the screen while the app stays in memory; the opening still plays once per launch. */
let openingPlayed = false;

function Opening() {
  const { status } = useAuth();
  const [done, setDone] = useState(openingPlayed);
  const ready = status !== 'loading';

  // When the opening is skipped, nothing else takes over from the native splash.
  useEffect(() => {
    if (done && ready) SplashScreen.hideAsync().catch(() => {});
  }, [done, ready]);

  const finish = () => {
    openingPlayed = true;
    setDone(true);
  };
  return done ? null : <IntroSplash ready={ready} onDone={finish} />;
}

function Screens() {
  const { status, error, reload, signOut } = useAuth();

  if (status === 'loading') return null;
  if (status === 'offline') return <Offline message={error} onRetry={reload} onSignOut={signOut} />;

  // Where any screen that isn't allowed right now should send the user.
  const home = status === 'signedOut' ? '/welcome' : status === 'needsProfile' ? '/create-profile' : '/';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Protected guard={status === 'signedOut'} redirectTo={home}>
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsProfile'} redirectTo={home}>
        <Stack.Screen name="create-profile" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'ready'} redirectTo={home}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile/[userId]" />
        <Stack.Screen name="chat/[userId]" />
        <Stack.Screen name="edit/[section]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="photos" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="premium" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="blocked" />
        <Stack.Screen name="astro" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="call/[userId]" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
      </Stack.Protected>
      {/* Open to everyone, signed in or not. */}
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
    </Stack>
  );
}

function Offline({ message, onRetry, onSignOut }: { message: string | null; onRetry: () => void; onSignOut: () => void }) {
  const [serverOpen, setServerOpen] = useState(false);
  return (
    <View style={styles.center}>
      <View style={styles.icon}>
        <Ionicons name="cloud-offline-outline" size={44} color={colors.primary} />
      </View>
      <Text style={styles.title}>Can’t connect</Text>
      <Text style={styles.text}>{message}</Text>
      <Text style={styles.hint}>Server: {getApiUrl()}</Text>
      <Button title="Try again" icon="refresh" onPress={onRetry} style={[styles.wide, { marginTop: 24 }]} />
      <Button
        title="Change server address"
        icon="server-outline"
        variant="secondary"
        onPress={() => setServerOpen(true)}
        style={[styles.wide, { marginTop: 10 }]}
      />
      <Button title="Log out" variant="ghost" onPress={onSignOut} style={[styles.wide, { marginTop: 4 }]} />
      <ServerSheet visible={serverOpen} onClose={() => setServerOpen(false)} onSaved={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.bg },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  text: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  hint: { fontSize: 12, color: colors.textFaint, marginTop: 12, textAlign: 'center' },
  wide: { alignSelf: 'stretch', marginTop: 24 },
});
