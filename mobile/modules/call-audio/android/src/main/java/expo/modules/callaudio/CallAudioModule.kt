package expo.modules.callaudio

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Sends call audio to the earpiece or the loudspeaker. The call itself runs in a WebView, whose
 * browser engine picks a speaker on its own; this puts the phone in call mode and overrides that pick.
 */
class CallAudioModule : Module() {
  private val audio: AudioManager?
    get() = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

  override fun definition() = ModuleDefinition {
    Name("CallAudio")

    AsyncFunction("setSpeaker") { on: Boolean ->
      val manager = audio ?: return@AsyncFunction false
      manager.mode = AudioManager.MODE_IN_COMMUNICATION
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val wanted = if (on) AudioDeviceInfo.TYPE_BUILTIN_SPEAKER else AudioDeviceInfo.TYPE_BUILTIN_EARPIECE
        val device = manager.availableCommunicationDevices.firstOrNull { it.type == wanted }
          ?: return@AsyncFunction false
        return@AsyncFunction manager.setCommunicationDevice(device)
      }
      @Suppress("DEPRECATION")
      manager.isSpeakerphoneOn = on
      return@AsyncFunction true
    }

    AsyncFunction("reset") {
      val manager = audio ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        manager.clearCommunicationDevice()
      } else {
        @Suppress("DEPRECATION")
        manager.isSpeakerphoneOn = false
      }
      manager.mode = AudioManager.MODE_NORMAL
      return@AsyncFunction true
    }
  }
}
