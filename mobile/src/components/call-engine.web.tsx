import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';

import { CALL_ENGINE_HTML } from '@/lib/call-engine-html';
import type { CallEngineHandle, EngineEvent } from './call-engine';

/** Web version of the call engine: the same page in an iframe, talking over postMessage. */
export function CallEngine({ ref, onEvent, visible }: { ref: Ref<CallEngineHandle>; onEvent: (e: EngineEvent) => void; visible: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(onEvent);
  useEffect(() => {
    latest.current = onEvent;
  }, [onEvent]);

  useImperativeHandle(ref, () => ({
    send: (command: object) => frame.current?.contentWindow?.postMessage({ __callCommand: JSON.stringify(command) }, '*'),
  }));

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const raw = e.data && typeof e.data === 'object' ? (e.data as { __callEvent?: string }).__callEvent : undefined;
      if (!raw) return;
      try {
        latest.current(JSON.parse(raw) as EngineEvent);
      } catch {
        // Ignore anything that isn't one of our events.
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <iframe
      ref={frame}
      title="call"
      srcDoc={CALL_ENGINE_HTML}
      allow="microphone; camera; autoplay"
      style={
        visible
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#0b0b14' }
          : { position: 'absolute', width: 1, height: 1, opacity: 0, border: 0 }
      }
    />
  );
}
