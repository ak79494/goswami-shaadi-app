import { requireOptionalNativeModule } from 'expo';

type CallAudioModule = {
  /** Routes call audio to the loudspeaker (true) or the earpiece (false); resolves false if it couldn't. */
  setSpeaker(on: boolean): Promise<boolean>;
  /** Back to normal audio once the call is over. */
  reset(): Promise<boolean>;
};

// Android only (see android/…/CallAudioModule.kt); null on iOS and the web.
const native = requireOptionalNativeModule<CallAudioModule>('CallAudio');

export const callAudio = {
  available: native !== null,
  setSpeaker: (on: boolean) => (native ? native.setSpeaker(on).catch(() => false) : Promise.resolve(false)),
  reset: () => (native ? native.reset().catch(() => {}) : Promise.resolve()),
};
