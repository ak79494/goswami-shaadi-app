import { useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { CALL_ENGINE_HTML } from '@/lib/call-engine-html';

export type EngineEvent = { type: string; [key: string]: unknown };
export type CallEngineHandle = { send: (command: object) => void };

/**
 * WebView that runs the call's media (see call-engine-html.ts): hidden for voice, full screen behind
 * the call controls when `visible` (video on). The https base URL gives the page a secure origin,
 * which browsers require before they allow microphone and camera access.
 */
export function CallEngine({ ref, onEvent, visible }: { ref: Ref<CallEngineHandle>; onEvent: (e: EngineEvent) => void; visible: boolean }) {
  // react-native-webview types the component as a function component, so describe the ref by hand.
  const webview = useRef<{ postMessage: (data: string) => void } | null>(null);
  useImperativeHandle(ref, () => ({
    send: (command: object) => webview.current?.postMessage(JSON.stringify(command)),
  }));

  return (
    <WebView
      ref={webview as never}
      source={{ html: CALL_ENGINE_HTML, baseUrl: 'https://call.goswamishaadi.app' }}
      originWhitelist={['*']}
      javaScriptEnabled
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      mediaCapturePermissionGrantType="grant"
      scrollEnabled={false}
      overScrollMode="never"
      onMessage={(e: WebViewMessageEvent): void => {
        try {
          onEvent(JSON.parse(e.nativeEvent.data) as EngineEvent);
        } catch {
          // Ignore anything that isn't one of our events.
        }
      }}
      style={visible ? styles.full : styles.hidden}
      containerStyle={visible ? StyleSheet.absoluteFill : styles.hidden}
    />
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, backgroundColor: 'transparent' },
  full: { flex: 1, backgroundColor: '#0b0b14' },
});
