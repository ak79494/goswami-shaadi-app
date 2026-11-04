import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api } from './api';

let registeredToken: string | null = null;
let lastOpened: string | null = null;

/** Tells the server where to send notifications while the app is closed. Does nothing in a build without Firebase. */
export async function registerForPush() {
  if (Platform.OS !== 'android') return;
  try {
    // The server sends to this channel and to the calls channel (see PushService).
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages and interests',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;
    const { data } = await Notifications.getDevicePushTokenAsync();
    await api.post('/devices/token', { token: data });
    registeredToken = data;
  } catch {
    // Without notifications the app still works; messages and calls arrive while it is open.
  }
}

/** So the next member to sign in on this phone doesn't get the last one's notifications. */
export function forgetPushToken() {
  if (registeredToken) api.post('/devices/token/remove', { token: registeredToken }).catch(() => {});
  registeredToken = null;
}

/** Opens the right screen when a notification is tapped. A call needs nothing here: CallProvider picks up a ringing call. */
export function useOpenFromNotification(ready: boolean) {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!ready || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const { identifier, content } = response.notification.request;
    if (identifier === lastOpened) return;
    lastOpened = identifier;
    const data = content.data as { type?: string; userId?: string };
    if (data.type === 'chat' && data.userId) router.push({ pathname: '/chat/[userId]', params: { userId: data.userId } });
    else if (data.type === 'notification') router.push('/notifications');
  }, [ready, response]);
}
