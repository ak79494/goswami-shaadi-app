import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import type { IconName } from '@/components/button';
import { CallEngine, type CallEngineHandle, type EngineEvent } from '@/components/call-engine';
import { ActionSheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { motion } from '@/constants/motion';
import { colors } from '@/constants/theme';
import { api, errorMessage, imageSource } from '@/lib/api';
import { newCallId, useCalls, type CallSignal, type SignalType } from '@/lib/calls';
import { fullName } from '@/lib/format';
import { usePrimaryPhoto, useUserProfile } from '@/lib/profiles';
import { callAudio } from '../../../modules/call-audio';

type Phase = 'calling' | 'ringing' | 'incoming' | 'connecting' | 'active' | 'reconnecting' | 'ended';
type Quality = 'good' | 'fair' | 'poor';
type Tone = 'ringback' | 'ringtone' | 'busy' | 'end';

const RING_TIMEOUT_MS = 45_000;
/** How long the phones get to connect directly before the call switches to the server relay. */
const DIRECT_TIMEOUT_MS = 10_000;
/** A connected call that drops for this long switches to the relay instead of hanging up. */
const DROP_GRACE_MS = 5_000;
const QUICK_REPLIES = [
  "Can't talk right now. I'll call you back soon.",
  "I'm busy at the moment — let's chat here.",
  'Please call me a little later 🙏',
];
const END_RED = '#EF4444';
const ACCEPT_GREEN = '#22C55E';

const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

async function allowed(what: 'mic' | 'camera'): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const result = await PermissionsAndroid.request(
    what === 'mic' ? PermissionsAndroid.PERMISSIONS.RECORD_AUDIO : PermissionsAndroid.PERMISSIONS.CAMERA,
    what === 'mic'
      ? { title: 'Microphone for calls', message: 'GoswamiJodi needs your microphone so the other person can hear you.', buttonPositive: 'Allow' }
      : { title: 'Camera for video calls', message: 'GoswamiJodi needs your camera so the other person can see you.', buttonPositive: 'Allow' },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Full-screen voice/video call. Media goes directly between the two phones (WebRTC in CallEngine);
 * this screen relays the set-up messages through the server and shows the call. If the phones can't
 * connect directly, both switch to "relay" mode, where the voice goes through the server instead.
 */
export default function CallScreen() {
  const params = useLocalSearchParams<{ userId: string; callId: string; incoming?: string; video?: string }>();
  const peerId = Number(params.userId);
  const callId = params.callId;
  const isCaller = params.incoming !== '1';
  const videoCall = params.video === '1';
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const profile = useUserProfile(peerId);
  const photo = usePrimaryPhoto(peerId);
  const { send, listen, listenAudio, sendAudio, setActive, release } = useCalls();
  const name = profile ? fullName(profile) : 'Member';
  const firstName = profile?.firstName ?? 'They';

  const [phase, setPhase] = useState<Phase>(isCaller ? 'calling' : 'incoming');
  const [endText, setEndText] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const [offline, setOffline] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const canRoute = callAudio.available;
  const [video, setVideo] = useState(false);
  const [remoteVideo, setRemoteVideo] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [relay, setRelay] = useState(false);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [replyOpen, setReplyOpen] = useState(false);

  const engine = useRef<CallEngineHandle>(null);
  const loaded = useRef(false);
  const ready = useRef(false);
  const loadedQueue = useRef<object[]>([]);
  const readyQueue = useRef<object[]>([]);
  const config = useRef<Promise<{ iceServers: unknown[] }> | null>(null);
  const ended = useRef(false);
  const accepted = useRef(false);
  const relayMode = useRef(false);
  const connectedAt = useRef<number | null>(null);
  const timers = useRef<{ direct?: ReturnType<typeof setTimeout>; drop?: ReturnType<typeof setTimeout>; close?: ReturnType<typeof setTimeout> }>({});
  // Current values for the engine's event handlers.
  const live = useRef({ muted: false, video: false, speaker: false });
  const controlsHeight = useRef(240);

  /** Sends a command to the engine once it has loaded ("loaded") or has the microphone ("ready"). */
  const post = (command: object, need: 'loaded' | 'ready' = 'ready') => {
    if (need === 'loaded' ? loaded.current : ready.current) engine.current?.send(command);
    else (need === 'loaded' ? loadedQueue : readyQueue).current.push(command);
  };
  const tone = (name: Tone | null) => post({ type: 'tone', name }, 'loaded');
  /** Where the self-view rests, and how far it can be dragged: below the status bar, above the controls. */
  const sendLayout = () =>
    engine.current?.send({ type: 'layout', top: insets.top + 72, minTop: insets.top + 12, bottom: controlsHeight.current + insets.bottom + 36 });
  const clearTimer = (key: 'direct' | 'drop' | 'close') => {
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = undefined;
  };
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  /** Earpiece or loudspeaker (Android). Called again once connected, as the browser engine picks its own. */
  const route = async (speakerOn: boolean, asked = false) => {
    live.current.speaker = speakerOn;
    setSpeaker(speakerOn);
    if (!canRoute) return;
    if (!(await callAudio.setSpeaker(speakerOn)) && asked) toast("Couldn't switch the speaker on this phone", 'error');
  };

  /** Ends the call once: tells the other phone (unless they ended it), logs it in chat, closes the screen. */
  const finish = (text: string, notify: SignalType | null, opts: { log?: boolean; retry?: boolean; tone?: Tone } = {}) => {
    if (ended.current) return;
    ended.current = true;
    Vibration.cancel();
    clearTimer('direct');
    clearTimer('drop');
    if (notify) send(peerId, callId, notify).catch(() => {});
    if (loaded.current) {
      engine.current?.send({ type: 'hangup' });
      engine.current?.send({ type: 'tone', name: opts.tone ?? 'end' });
    }
    setTimeout(() => callAudio.reset(), 900);
    const talked = connectedAt.current ? Math.round((Date.now() - connectedAt.current) / 1000) : 0;
    setPhase('ended');
    setEndText(talked > 0 ? `${text} · ${duration(talked)}` : text);
    setVideo(false);
    setRemoteVideo(false);
    if (isCaller && opts.log) {
      const kind = videoCall ? 'video' : 'voice';
      const content = talked > 0 ? `📞 ${videoCall ? 'Video' : 'Voice'} call · ${duration(talked)}` : `📞 Missed ${kind} call`;
      api.post('/chats/messages', { toUserId: peerId, content }).catch(() => {});
    }
    const retry = isCaller && !!opts.retry && talked === 0;
    setCanRetry(retry);
    timers.current.close = setTimeout(close, retry ? 20_000 : 1_800);
  };

  const hangUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (phase === 'incoming') finish('Call declined', 'decline');
    else if (!accepted.current) finish('Call cancelled', 'cancel', { log: true });
    else finish('Call ended', 'end', { log: true });
  };

  const shareMedia = () => send(peerId, callId, 'media', { muted: live.current.muted, video: live.current.video }).catch(() => {});

  const onConnected = () => {
    clearTimer('direct');
    clearTimer('drop');
    const first = !connectedAt.current;
    if (first) connectedAt.current = Date.now();
    setPhase('active');
    if (first) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      shareMedia();
      // The call's audio output starts now; make sure it plays where the member expects.
      route(live.current.speaker);
      setTimeout(() => route(live.current.speaker), 1500);
    }
  };

  /** Falls back to sending the voice through the server (and tells the other phone, unless it asked). */
  const toRelay = (notify: boolean) => {
    if (relayMode.current || ended.current) return;
    relayMode.current = true;
    setRelay(true);
    clearTimer('drop');
    if (notify) send(peerId, callId, 'relay').catch(() => {});
    if (live.current.video) {
      post({ type: 'video', on: false });
      toast('Video is paused — the connection is too weak for video', 'info');
    }
    setRemoteVideo(false);
    post({ type: 'remoteVideo', on: false }, 'loaded');
    post({ type: 'relay' });
  };

  const waitForDirect = () => {
    clearTimer('direct');
    timers.current.direct = setTimeout(() => {
      if (!connectedAt.current && !ended.current) toRelay(true);
    }, DIRECT_TIMEOUT_MS);
  };

  const onEngine = (e: EngineEvent) => {
    switch (e.type) {
      case 'loaded':
        loaded.current = true;
        sendLayout();
        loadedQueue.current.splice(0).forEach((c) => engine.current?.send(c));
        break;
      case 'ready':
        ready.current = true;
        readyQueue.current.splice(0).forEach((c) => engine.current?.send(c));
        // Voice calls start on the earpiece like a phone call; video calls on the loudspeaker.
        route(live.current.video || videoCall);
        if (!isCaller) {
          send(peerId, callId, 'accept')
            .then(waitForDirect)
            .catch((err) => finish(errorMessage(err), null));
        }
        break;
      case 'video':
        live.current.video = !!e.on;
        setVideo(!!e.on);
        if (e.error === 'camera-denied') toast('Allow camera access to turn on video', 'error');
        else if (e.error) toast("Couldn't start the camera", 'error');
        if (e.on && !live.current.speaker) route(true);
        if (accepted.current) shareMedia();
        break;
      case 'offer':
      case 'answer':
        send(peerId, callId, e.type, e.sdp).catch(() => {});
        break;
      case 'ice':
        send(peerId, callId, 'ice', e.candidate).catch(() => {});
        break;
      case 'state':
        if (relayMode.current) break;
        if (e.state === 'connected') onConnected();
        else if (e.state === 'failed' && accepted.current) toRelay(true);
        else if (e.state === 'disconnected' && connectedAt.current) {
          setPhase('reconnecting');
          clearTimer('drop');
          timers.current.drop = setTimeout(() => toRelay(true), DROP_GRACE_MS);
        }
        break;
      case 'relay':
        onConnected();
        break;
      case 'pcm':
        sendAudio(callId, String(e.d));
        break;
      case 'quality':
        setQuality(e.level as Quality);
        break;
      case 'error':
        if (e.message === 'mic-denied') finish('Allow microphone access to make calls', isCaller ? 'cancel' : 'decline');
        else if (e.message === 'unsupported') finish('Calls are not supported on this phone', isCaller ? 'cancel' : 'decline');
        else if (e.message === 'mic-unavailable') finish('Your microphone is busy or unavailable', accepted.current ? 'end' : isCaller ? 'cancel' : 'decline');
        else if (!connectedAt.current) toRelay(true);
        break;
    }
  };

  const onSignal = (s: CallSignal) => {
    switch (s.type) {
      case 'ringing':
        setOffline(false);
        // The ring-back tone is already playing (it starts with the call); just update the status.
        if (!accepted.current) setPhase((p) => (p === 'calling' ? 'ringing' : p));
        break;
      case 'accept':
        accepted.current = true;
        setPhase('connecting');
        tone(null);
        post({ type: 'start' });
        waitForDirect();
        break;
      case 'decline':
        finish(`${firstName} is busy right now`, null, { log: true, retry: true, tone: 'busy' });
        break;
      case 'busy':
        finish(`${firstName} is on another call`, null, { retry: true, tone: 'busy' });
        break;
      case 'cancel':
        finish('Missed call', null);
        break;
      case 'end':
        finish('Call ended', null, { log: true });
        break;
      case 'offer':
        post({ type: 'offer', sdp: s.data });
        break;
      case 'answer':
        post({ type: 'answer', sdp: s.data });
        break;
      case 'ice':
        post({ type: 'ice', candidate: s.data });
        break;
      case 'relay':
        toRelay(false);
        break;
      case 'media': {
        const d = (s.data ?? {}) as { muted?: boolean; video?: boolean };
        const showVideo = !!d.video && !relayMode.current;
        setRemoteMuted(!!d.muted);
        setRemoteVideo(showVideo);
        post({ type: 'remoteVideo', on: showVideo }, 'loaded');
        break;
      }
    }
  };

  // Latest handlers for the long-lived subscriptions below.
  const handlers = useRef({ onSignal, finish, post, toast });
  useEffect(() => {
    handlers.current = { onSignal, finish, post, toast };
  });

  // Keep the screen on during the call. Releasing a lock that hadn't switched on yet throws, so ignore that.
  useEffect(() => {
    const tag = `call-${callId}`;
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [callId]);

  useEffect(() => {
    setActive({ callId, peerId, video: videoCall });
    config.current = api.get<{ iceServers: unknown[] }>('/calls/config');
    const unlisten = listen(callId, (s) => handlers.current.onSignal(s));
    const unlistenAudio = listenAudio(callId, (d) => {
      if (ready.current) engine.current?.send({ type: 'pcm', d });
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    const pending = timers.current;
    return () => {
      unlisten();
      unlistenAudio();
      back.remove();
      release(callId);
      callAudio.reset();
      Vibration.cancel();
      Object.values(pending).forEach((t) => t && clearTimeout(t));
      // Leaving the screen any other way still hangs up properly.
      if (!ended.current) {
        ended.current = true;
        send(peerId, callId, isCaller && !accepted.current ? 'cancel' : accepted.current ? 'end' : 'decline').catch(() => {});
      }
    };
  }, [callId, peerId, isCaller, videoCall, listen, listenAudio, send, setActive, release]);

  // Caller: get the microphone (and camera), start the engine and ring the other phone.
  useEffect(() => {
    if (!isCaller) return;
    let alive = true;
    (async () => {
      if (!(await allowed('mic'))) {
        if (alive) handlers.current.finish('Allow microphone access to make calls', null);
        return;
      }
      if (videoCall) {
        if (await allowed('camera')) handlers.current.post({ type: 'video', on: true }, 'loaded');
        else handlers.current.toast('Allow camera access to turn on video', 'error');
      }
      const cfg = await (config.current ?? Promise.resolve({ iceServers: [] })).catch(() => ({ iceServers: [] }));
      if (!alive) return;
      handlers.current.post({ type: 'init', iceServers: cfg.iceServers, caller: true }, 'loaded');
      // Ring-back starts straight away, like a phone call, rather than after the other phone answers "ringing".
      handlers.current.post({ type: 'tone', name: 'ringback' }, 'loaded');
      try {
        const { delivered } = await send(peerId, callId, 'invite', { video: videoCall });
        if (alive && !delivered) setOffline(true);
      } catch (e) {
        if (alive) handlers.current.finish(errorMessage(e), null);
      }
    })();
    const timeout = setTimeout(() => {
      if (!accepted.current) handlers.current.finish('No answer', 'cancel', { log: true, retry: true });
    }, RING_TIMEOUT_MS);
    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [isCaller, videoCall, peerId, callId, send]);

  // Callee: ring and vibrate until answered, and give up if the caller vanished.
  useEffect(() => {
    if (phase !== 'incoming') return;
    handlers.current.post({ type: 'tone', name: 'ringtone' }, 'loaded');
    Vibration.vibrate([0, 900, 1100], true);
    const timeout = setTimeout(() => handlers.current.finish('Missed call', null), RING_TIMEOUT_MS + 5000);
    return () => {
      Vibration.cancel();
      clearTimeout(timeout);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active' && phase !== 'reconnecting') return;
    const timer = setInterval(() => {
      if (connectedAt.current) setSeconds(Math.round((Date.now() - connectedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const answer = async (withVideo: boolean) => {
    Vibration.cancel();
    tone(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (!(await allowed('mic'))) {
      finish('Allow microphone access to answer calls', 'decline');
      return;
    }
    const camera = withVideo && (await allowed('camera'));
    accepted.current = true;
    setPhase('connecting');
    const cfg = await (config.current ?? Promise.resolve({ iceServers: [] })).catch(() => ({ iceServers: [] }));
    post({ type: 'init', iceServers: cfg.iceServers, caller: false }, 'loaded');
    if (camera) post({ type: 'video', on: true }, 'loaded');
  };

  const declineWith = (text: string) => {
    api.post('/chats/messages', { toUserId: peerId, content: text }).catch(() => {});
    finish('Call declined', 'decline');
  };

  const toggleMute = () => {
    const next = !muted;
    live.current.muted = next;
    setMuted(next);
    post({ type: 'mute', muted: next });
    if (accepted.current) shareMedia();
  };

  const toggleSpeaker = () => route(!speaker, true);

  const toggleVideo = async () => {
    if (video) {
      post({ type: 'video', on: false }, 'loaded');
      return;
    }
    if (relayMode.current) {
      toast('Video needs a stronger connection — voice only for now', 'info');
      return;
    }
    if (!(await allowed('camera'))) {
      toast('Allow camera access to turn on video', 'error');
      return;
    }
    post({ type: 'video', on: true }, 'loaded');
  };

  const callAgain = () => {
    clearTimer('close');
    router.replace({ pathname: '/call/[userId]', params: { userId: String(peerId), callId: newCallId(), video: videoCall ? '1' : '0' } });
  };

  const openChat = () => {
    clearTimer('close');
    router.replace(`/chat/${peerId}`);
  };

  const status = {
    calling: offline ? `Calling… ${firstName} isn't online right now` : 'Calling…',
    ringing: 'Ringing…',
    incoming: videoCall ? 'Incoming video call' : 'Incoming voice call',
    connecting: 'Connecting…',
    active: duration(seconds),
    reconnecting: 'Reconnecting…',
    ended: endText,
  }[phase];
  const ringing = phase === 'calling' || phase === 'ringing' || phase === 'incoming';
  const inCall = phase === 'connecting' || phase === 'active' || phase === 'reconnecting';
  const showVideo = phase !== 'ended' && (video || (remoteVideo && inCall));
  const fullVideo = showVideo && remoteVideo && inCall;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {photo ? <Image source={imageSource(photo)} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={40} /> : null}
      <LinearGradient colors={['rgba(18,12,46,0.72)', 'rgba(43,24,86,0.82)', 'rgba(12,8,30,0.97)']} style={StyleSheet.absoluteFill} />

      <CallEngine ref={engine} onEvent={onEngine} visible={showVideo} />
      {showVideo ? (
        <>
          <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent']} style={styles.videoTopFade} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.videoBottomFade} pointerEvents="none" />
        </>
      ) : null}

      <View style={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 }]} pointerEvents="box-none">
        {/* These two pass touches through, so the self-view can be dragged under them. */}
        <View style={styles.topRow} pointerEvents="none">
          <View style={styles.chip}>
            <Ionicons name={relay ? 'git-network-outline' : 'lock-closed'} size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.chipText}>{relay ? 'Connected through GoswamiJodi' : 'Encrypted call'}</Text>
          </View>
          {inCall && quality ? <QualityBars level={quality} /> : null}
        </View>

        {fullVideo ? (
          <View style={styles.videoHeader} pointerEvents="none">
            <Text style={styles.videoName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.videoStatus}>{status}</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <View style={styles.avatarWrap}>
              {ringing ? <Pulse delay={0} /> : null}
              {ringing ? <Pulse delay={900} /> : null}
              <Avatar uri={photo} name={name} size={136} ring="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {profile ? (
              <Text style={styles.meta} numberOfLines={1}>
                {[profile.user.goswamiId, profile.city].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <Text style={[styles.status, phase === 'active' && styles.statusActive, phase === 'reconnecting' && styles.statusWarn]}>{status}</Text>
          </View>
        )}

        <View
          onLayout={(e) => {
            controlsHeight.current = e.nativeEvent.layout.height;
            if (loaded.current) sendLayout();
          }}>
          {remoteMuted && inCall ? (
            <Animated.View entering={motion.fade()} style={styles.notice}>
              <Ionicons name="mic-off" size={14} color={colors.white} />
              <Text style={styles.noticeText}>{firstName} muted their microphone</Text>
            </Animated.View>
          ) : null}

          {phase === 'incoming' ? (
            <Animated.View entering={motion.enterUp()} style={styles.incoming}>
              <RoundButton icon="close" label="Decline" color={END_RED} onPress={hangUp} size={70} />
              <RoundButton icon="chatbubble-ellipses" label="Message" onPress={() => setReplyOpen(true)} size={54} />
              <AcceptButton video={videoCall} onPress={() => answer(videoCall)} />
            </Animated.View>
          ) : phase === 'ended' ? (
            canRetry ? (
              <Animated.View entering={motion.enterUp()} style={styles.incoming}>
                <RoundButton icon="close" label="Close" onPress={close} size={60} />
                <RoundButton icon="chatbubble-ellipses" label="Message" onPress={openChat} size={60} />
                <RoundButton icon={videoCall ? 'videocam' : 'call'} label="Call again" color={ACCEPT_GREEN} onPress={callAgain} size={60} />
              </Animated.View>
            ) : (
              <View style={styles.panelSpacer} />
            )
          ) : (
            <Animated.View entering={motion.enterUp()} style={styles.panel}>
              <View style={styles.controls}>
                {canRoute ? (
                  <RoundButton icon={speaker ? 'volume-high' : 'volume-medium-outline'} label="Speaker" active={speaker} onPress={toggleSpeaker} />
                ) : null}
                <RoundButton icon={video ? 'videocam' : 'videocam-off-outline'} label={video ? 'Camera on' : 'Camera'} active={video} onPress={toggleVideo} />
                <RoundButton icon={muted ? 'mic-off' : 'mic-outline'} label={muted ? 'Unmute' : 'Mute'} active={muted} onPress={toggleMute} />
                {video ? <RoundButton icon="camera-reverse-outline" label="Flip" onPress={() => post({ type: 'flip' }, 'loaded')} /> : null}
              </View>
              <Pressable onPress={hangUp} style={({ pressed }) => [styles.end, pressed && { opacity: 0.85 }]} accessibilityRole="button" accessibilityLabel="End call">
                <Ionicons name="call" size={32} color={colors.white} style={styles.rotated} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>

      <ActionSheet
        visible={replyOpen}
        title="Reply with a message"
        message={`${firstName} will get your message in chat.`}
        actions={QUICK_REPLIES.map((text) => ({ label: text, icon: 'chatbubble-outline' as const, onPress: () => declineWith(text) }))}
        onClose={() => setReplyOpen(false)}
      />
    </View>
  );
}

function QualityBars({ level }: { level: Quality }) {
  const lit = level === 'good' ? 3 : level === 'fair' ? 2 : 1;
  const tint = level === 'good' ? '#4ADE80' : level === 'fair' ? '#FBBF24' : '#F87171';
  return (
    <View style={styles.bars} accessibilityLabel={`Connection ${level}`}>
      {[6, 9, 12].map((h, i) => (
        <View key={h} style={[styles.bar, { height: h, backgroundColor: i < lit ? tint : 'rgba(255,255,255,0.25)' }]} />
      ))}
      {level === 'poor' ? <Text style={styles.barsText}>Weak network</Text> : null}
    </View>
  );
}

function Pulse({ delay }: { delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    const id = setTimeout(() => t.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1)), delay);
    return () => clearTimeout(id);
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.4 * (1 - t.value), transform: [{ scale: 1 + t.value * 0.75 }] }));
  return <Animated.View style={[styles.pulse, style]} />;
}

/** Green answer button that gently lifts and settles, like a phone's incoming-call screen. */
function AcceptButton({ video, onPress }: { video: boolean; onPress: () => void }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 420, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 600 }),
        ),
        -1,
      ),
    );
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={styles.roundWrap}>
      <Animated.View style={style}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.round, { width: 70, height: 70, borderRadius: 35, backgroundColor: ACCEPT_GREEN, opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Accept call">
          <Ionicons name={video ? 'videocam' : 'call'} size={30} color={colors.white} />
        </Pressable>
      </Animated.View>
      <Text style={styles.roundLabel}>Accept</Text>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
  color,
  active,
  size = 62,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  active?: boolean;
  size?: number;
}) {
  const background = color ?? (active ? colors.white : 'rgba(255,255,255,0.14)');
  return (
    <View style={styles.roundWrap}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        style={({ pressed }) => [styles.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: background, opacity: pressed ? 0.8 : 1 }]}
        accessibilityRole="button"
        accessibilityState={{ selected: !!active }}
        accessibilityLabel={label}>
        <Ionicons name={icon} size={size * 0.42} color={active && !color ? '#2B1856' : colors.white} />
      </Pressable>
      <Text style={styles.roundLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0B1F' },
  content: { flex: 1, justifyContent: 'space-between' },
  videoTopFade: { position: 'absolute', left: 0, right: 0, top: 0, height: 180 },
  videoBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chipText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 4, borderRadius: 2 },
  barsText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700', marginLeft: 4 },
  center: { alignItems: 'center', paddingHorizontal: 24 },
  avatarWrap: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 146, height: 146, borderRadius: 73, backgroundColor: 'rgba(196,181,253,0.55)' },
  name: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: 8, maxWidth: 330, textAlign: 'center' },
  meta: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  status: { color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 10, textAlign: 'center', paddingHorizontal: 12 },
  statusActive: { fontVariant: ['tabular-nums'], color: colors.white, fontWeight: '700', fontSize: 18 },
  statusWarn: { color: '#FCD34D', fontWeight: '700' },
  videoHeader: { alignItems: 'center', marginTop: 8 },
  videoName: { color: colors.white, fontSize: 20, fontWeight: '800', maxWidth: 300 },
  videoStatus: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2, fontVariant: ['tabular-nums'] },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginBottom: 14,
  },
  noticeText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  incoming: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingHorizontal: 24, minHeight: 120 },
  panel: {
    marginHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 22,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 22,
  },
  panelSpacer: { minHeight: 120 },
  controls: { flexDirection: 'row', justifyContent: 'space-evenly', alignSelf: 'stretch' },
  end: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: END_RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: END_RED,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  roundWrap: { alignItems: 'center', gap: 8, minWidth: 72 },
  round: { alignItems: 'center', justifyContent: 'center' },
  roundLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  rotated: { transform: [{ rotate: '135deg' }] },
});
