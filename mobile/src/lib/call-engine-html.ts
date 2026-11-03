/**
 * The media half of a call. It runs inside a WebView (an iframe on the web) because the browser
 * engine already ships WebRTC: microphone and camera capture, echo cancellation and peer-to-peer
 * audio/video. The page stays hidden for voice calls and fills the screen behind the call controls
 * once video is on.
 *
 * Commands from the app (JSON):
 *   tone {name: ringback|ringtone|busy|end|null} · init {iceServers, caller} · start (caller: create the offer) ·
 *   offer {sdp} · answer {sdp} · ice {candidate} · mute {muted} · video {on} · flip ·
 *   remoteVideo {on} · layout {top, minTop, bottom} · relay · pcm {d} · hangup
 * Events to the app (JSON):
 *   loaded · ready · offer {sdp} · answer {sdp} · ice {candidate} · state {state} ·
 *   video {on, error?} · quality {level} · relay · pcm {d} · error {message}
 *
 * Earpiece/loudspeaker switching is done natively by the app (modules/call-audio), not here.
 *
 * Relay mode is the fallback when the two phones can't reach each other directly (strict carrier
 * networks): the microphone is compressed to 8 kHz μ-law and sent through the app and the server
 * instead of peer to peer.
 */
export const CALL_ENGINE_HTML = `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
<style>
  html, body { margin: 0; height: 100%; background: transparent; overflow: hidden; }
  video { position: fixed; display: none; object-fit: cover; background: #0b0b14; }
  #rv { inset: 0; width: 100%; height: 100%; }
  #lv { top: var(--top, 96px); right: 16px; width: 30vw; height: 40vw; border-radius: 16px; box-shadow: 0 6px 24px rgba(0,0,0,.45);
        touch-action: none; transform: translate(var(--x, 0px), var(--y, 0px)) scaleX(var(--mirror, 1)); transition: transform .22s ease-out; }
  #lv.front { --mirror: -1; }
  #lv.dragging { transition: none; }
  .remote-on #rv { display: block; }
  .local-on #lv { display: block; }
  .local-on:not(.remote-on) #lv { top: 0; right: 0; width: 100%; height: 100%; border-radius: 0; box-shadow: none; transform: scaleX(var(--mirror, 1)); transition: none; }
</style></head>
<body>
<audio id="ra" autoplay playsinline></audio>
<video id="rv" autoplay playsinline muted></video>
<video id="lv" class="front" autoplay playsinline muted></video>
<script>
(function () {
  var RELAY_RATE = 8000;
  var MIC_TIMEOUT_MS = 20000;
  var pc = null, mic = null, cam = null, caller = false, muted = false, facing = 'user';
  var audioSender = null, videoSender = null, remoteSet = false, pendingIce = [];
  var ctx = null, toneOut = null, toneTimer = null, relay = null, statsTimer = null, lastIn = null;
  var ra = document.getElementById('ra'), rv = document.getElementById('rv'), lv = document.getElementById('lv');

  function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else window.parent.postMessage({ __callEvent: s }, '*');
  }
  function fail(message) { send({ type: 'error', message: message }); }
  function plain(desc) { return { type: desc.type, sdp: desc.sdp }; }
  function stopAll(stream) { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); }

  function audioCtx() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(function () {});
    return ctx;
  }

  // ---------- Self-view: drag it anywhere above the controls; on release it settles against the nearer side ----------
  var homeTop = 96, minTop = 16, bottomSpace = 16, pipX = 0, pipY = 0, drag = null;
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function pipLimits() {
    return {
      minX: Math.min(0, 32 + lv.offsetWidth - window.innerWidth), maxX: 0,
      minY: minTop - homeTop, maxY: Math.max(minTop - homeTop, window.innerHeight - bottomSpace - lv.offsetHeight - homeTop)
    };
  }
  function placePip(x, y) {
    var b = pipLimits();
    pipX = clamp(x, b.minX, b.maxX);
    pipY = clamp(y, b.minY, b.maxY);
    lv.style.setProperty('--x', pipX + 'px');
    lv.style.setProperty('--y', pipY + 'px');
  }
  function layout(cmd) {
    homeTop = cmd.top || homeTop;
    minTop = cmd.minTop || minTop;
    bottomSpace = cmd.bottom || bottomSpace;
    document.documentElement.style.setProperty('--top', homeTop + 'px');
    if (document.body.classList.contains('remote-on')) placePip(pipX, pipY);
  }
  lv.addEventListener('pointerdown', function (e) {
    if (!document.body.classList.contains('remote-on')) return;
    drag = { id: e.pointerId, dx: e.clientX - pipX, dy: e.clientY - pipY };
    lv.setPointerCapture(e.pointerId);
    lv.classList.add('dragging');
  });
  lv.addEventListener('pointermove', function (e) {
    if (drag && e.pointerId === drag.id) placePip(e.clientX - drag.dx, e.clientY - drag.dy);
  });
  function dropPip(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    lv.classList.remove('dragging');
    var b = pipLimits();
    placePip(pipX < (b.minX + b.maxX) / 2 ? b.minX : b.maxX, pipY);
  }
  lv.addEventListener('pointerup', dropPip);
  lv.addEventListener('pointercancel', dropPip);

  // ---------- Tones (ring-back for the caller, ringtone for the person being called) ----------
  function beep(freqs, at, length, volume) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(volume, at + 0.02);
    g.gain.setValueAtTime(volume, at + length - 0.03);
    g.gain.linearRampToValueAtTime(0, at + length);
    g.connect(toneOut);
    freqs.forEach(function (f) {
      var o = ctx.createOscillator();
      o.frequency.value = f;
      o.connect(g);
      o.start(at);
      o.stop(at + length + 0.05);
    });
  }
  function chime(freq, at, volume) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(volume, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
    o.connect(g);
    g.connect(toneOut);
    o.start(at);
    o.stop(at + 0.85);
  }
  var TONES = {
    ringback: { period: 3, play: function (t) { beep([400, 450], t, 0.4, 0.09); beep([400, 450], t + 0.6, 0.4, 0.09); } },
    ringtone: { period: 2.2, play: function (t) { [659, 831, 988, 831, 659, 988].forEach(function (f, i) { chime(f, t + i * 0.15, 0.22); }); } },
    busy: { period: 0.75, times: 4, play: function (t) { beep([400], t, 0.37, 0.09); } },
    end: { period: 1, times: 1, play: function (t) { beep([520], t, 0.16, 0.08); beep([390], t + 0.2, 0.26, 0.08); } }
  };
  function stopTone() {
    if (toneTimer) clearInterval(toneTimer);
    toneTimer = null;
    if (toneOut) { try { toneOut.disconnect(); } catch (e) {} }
    toneOut = null;
  }
  function playTone(name) {
    stopTone();
    var def = TONES[name];
    if (!def || !audioCtx()) return;
    toneOut = ctx.createGain();
    toneOut.connect(ctx.destination);
    var next = ctx.currentTime + 0.05, count = 0;
    function tick() {
      while (toneOut && next < ctx.currentTime + 0.4) {
        if (def.times && count >= def.times) { toneTimer && clearInterval(toneTimer); toneTimer = null; return; }
        def.play(next);
        next += def.period;
        count++;
      }
    }
    toneTimer = setInterval(tick, 150);
    tick();
  }

  // ---------- Microphone, camera and the peer connection ----------
  function micConstraints() {
    return { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false };
  }

  // A stuck audio system must end the call with a clear message, not leave it on "Connecting..." for ever.
  function micInTime() {
    return new Promise(function (resolve, reject) {
      var late = false;
      var timer = setTimeout(function () { late = true; reject(new Error('mic-timeout')); }, MIC_TIMEOUT_MS);
      navigator.mediaDevices.getUserMedia(micConstraints()).then(function (stream) {
        clearTimeout(timer);
        if (late) stopAll(stream);
        else resolve(stream);
      }, function (e) {
        clearTimeout(timer);
        reject(e);
      });
    });
  }

  async function init(cmd) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) { fail('unsupported'); return; }
    caller = !!cmd.caller;
    try {
      mic = await micInTime();
    } catch (e) {
      fail(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'mic-denied' : 'mic-unavailable');
      return;
    }
    pc = new RTCPeerConnection({ iceServers: cmd.iceServers || [] });
    if (caller) {
      // The caller offers an audio and a video slot up front, so the camera can be switched on later
      // without renegotiating. The other phone answers into these same slots (see 'offer').
      audioSender = pc.addTransceiver(mic.getAudioTracks()[0], { direction: 'sendrecv', streams: [mic] }).sender;
      videoSender = pc.addTransceiver('video', { direction: 'sendrecv' }).sender;
      if (cam) await videoSender.replaceTrack(cam.getVideoTracks()[0]);
    }
    pc.onicecandidate = function (e) { if (e.candidate) send({ type: 'ice', candidate: e.candidate.toJSON() }); };
    pc.ontrack = function (e) {
      var stream = new MediaStream([e.track]);
      var el = e.track.kind === 'video' ? rv : ra;
      el.srcObject = stream;
      var p = el.play();
      if (p && p.catch) p.catch(function () {});
    };
    pc.onconnectionstatechange = function () {
      if (!pc) return;
      send({ type: 'state', state: pc.connectionState });
      if (pc.connectionState === 'connected') watchQuality();
    };
    send({ type: 'ready' });
  }

  async function answerOffer(sdp) {
    await pc.setRemoteDescription(sdp);
    remoteSet = true;
    pc.getTransceivers().forEach(function (t) {
      var kind = t.receiver.track && t.receiver.track.kind;
      if (kind === 'audio' && !audioSender) {
        t.sender.replaceTrack(mic.getAudioTracks()[0]);
        t.direction = 'sendrecv';
        audioSender = t.sender;
      } else if (kind === 'video' && !videoSender) {
        t.direction = 'sendrecv';
        videoSender = t.sender;
        if (cam) t.sender.replaceTrack(cam.getVideoTracks()[0]);
      }
    });
    flushIce();
    var answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    send({ type: 'answer', sdp: plain(pc.localDescription) });
  }

  function flushIce() {
    pendingIce.splice(0).forEach(function (c) { pc.addIceCandidate(c).catch(function () {}); });
  }

  async function setVideo(on) {
    if (on) {
      var stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } }
        });
      } catch (e) {
        send({ type: 'video', on: false, error: e && e.name === 'NotAllowedError' ? 'camera-denied' : 'camera-unavailable' });
        return;
      }
      stopAll(cam);
      cam = stream;
      lv.srcObject = cam;
      lv.classList.toggle('front', facing === 'user');
      var p = lv.play();
      if (p && p.catch) p.catch(function () {});
      if (videoSender) await videoSender.replaceTrack(cam.getVideoTracks()[0]);
      document.body.classList.add('local-on');
    } else {
      if (videoSender) await videoSender.replaceTrack(null);
      stopAll(cam);
      cam = null;
      lv.srcObject = null;
      document.body.classList.remove('local-on');
    }
    send({ type: 'video', on: on });
  }

  // ---------- Connection quality ----------
  function watchQuality() {
    if (statsTimer) return;
    statsTimer = setInterval(async function () {
      if (!pc) return;
      try {
        var stats = await pc.getStats(), rtt = null, lost = 0, got = 0;
        stats.forEach(function (r) {
          if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded' && r.currentRoundTripTime != null) rtt = r.currentRoundTripTime;
          if (r.type === 'inbound-rtp' && r.kind === 'audio') { lost = r.packetsLost || 0; got = r.packetsReceived || 0; }
        });
        var loss = 0;
        if (lastIn) {
          var dl = lost - lastIn.lost, dg = got - lastIn.got;
          loss = dl + dg > 0 ? dl / (dl + dg) : 0;
        }
        lastIn = { lost: lost, got: got };
        var level = (rtt != null && rtt > 0.7) || loss > 0.1 ? 'poor' : (rtt != null && rtt > 0.35) || loss > 0.03 ? 'fair' : 'good';
        send({ type: 'quality', level: level });
      } catch (e) {}
    }, 2500);
  }

  // ---------- Relay mode ----------
  function muLaw(x) {
    var sign = x < 0 ? 0x80 : 0;
    var v = Math.min(1, Math.abs(x));
    return sign | Math.round((Math.log(1 + 255 * v) / Math.log(256)) * 127);
  }
  function unMuLaw(b) {
    var v = (Math.pow(256, (b & 0x7f) / 127) - 1) / 255;
    return b & 0x80 ? -v : v;
  }
  function toBase64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function relayFrom(stream) {
    if (relay.src) { try { relay.src.disconnect(); } catch (e) {} }
    relay.src = ctx.createMediaStreamSource(stream);
    relay.src.connect(relay.proc);
  }

  function startRelay() {
    if (relay || !mic || !audioCtx()) return;
    stopTone();
    if (pc) { try { pc.close(); } catch (e) {} pc = null; }
    if (statsTimer) { clearInterval(statsTimer); statsTimer = null; }
    ra.srcObject = null;
    var proc = ctx.createScriptProcessor(2048, 1, 1);
    var sink = ctx.createGain();
    sink.gain.value = 0;
    var step = ctx.sampleRate / RELAY_RATE, pos = 0;
    proc.onaudioprocess = function (e) {
      var input = e.inputBuffer.getChannelData(0), out = [];
      while (pos + step <= input.length) {
        var from = Math.max(0, Math.floor(pos)), to = Math.floor(pos + step), sum = 0;
        for (var j = from; j < to; j++) sum += input[j];
        out.push(muLaw(to > from ? sum / (to - from) : 0));
        pos += step;
      }
      pos -= input.length;
      if (!muted && out.length) send({ type: 'pcm', d: toBase64(out) });
    };
    proc.connect(sink);
    sink.connect(ctx.destination);
    relay = { proc: proc, sink: sink, src: null, next: 0 };
    relayFrom(mic);
    send({ type: 'relay' });
  }

  function playPcm(d) {
    if (!relay || !audioCtx()) return;
    var raw = atob(d), buffer = ctx.createBuffer(1, raw.length, RELAY_RATE), ch = buffer.getChannelData(0);
    for (var i = 0; i < raw.length; i++) ch[i] = unMuLaw(raw.charCodeAt(i));
    var node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(ctx.destination);
    var now = ctx.currentTime;
    // A small jitter buffer; if we fall behind or drift too far ahead, start again close to "now".
    if (relay.next < now + 0.03 || relay.next > now + 0.6) relay.next = now + 0.12;
    node.start(relay.next);
    relay.next += buffer.duration;
  }

  function hangup() {
    stopTone();
    if (statsTimer) clearInterval(statsTimer);
    statsTimer = null;
    if (relay) { try { relay.proc.disconnect(); relay.src && relay.src.disconnect(); } catch (e) {} relay = null; }
    if (pc) { try { pc.close(); } catch (e) {} pc = null; }
    stopAll(mic);
    stopAll(cam);
    mic = cam = null;
    ra.srcObject = rv.srcObject = lv.srcObject = null;
    document.body.className = '';
  }

  async function handle(cmd) {
    try {
      switch (cmd.type) {
        case 'tone': return cmd.name ? playTone(cmd.name) : stopTone();
        case 'init': return await init(cmd);
        case 'layout': return layout(cmd);
        case 'remoteVideo': return document.body.classList.toggle('remote-on', !!cmd.on);
        case 'video': return await setVideo(!!cmd.on);
        case 'flip':
          facing = facing === 'user' ? 'environment' : 'user';
          return cam ? await setVideo(true) : undefined;
        case 'pcm': return playPcm(cmd.d);
        case 'hangup': return hangup();
      }
      if (cmd.type === 'mute') {
        muted = !!cmd.muted;
        if (mic) mic.getAudioTracks().forEach(function (t) { t.enabled = !muted; });
        return;
      }
      if (cmd.type === 'relay') return startRelay();
      if (!pc) return;
      if (cmd.type === 'start') {
        var offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ type: 'offer', sdp: plain(pc.localDescription) });
      } else if (cmd.type === 'offer') {
        await answerOffer(cmd.sdp);
      } else if (cmd.type === 'answer') {
        await pc.setRemoteDescription(cmd.sdp);
        remoteSet = true;
        flushIce();
      } else if (cmd.type === 'ice') {
        if (remoteSet) pc.addIceCandidate(cmd.candidate).catch(function () {});
        else pendingIce.push(cmd.candidate);
      }
    } catch (e) {
      fail(String((e && e.message) || e));
    }
  }

  function onMessage(e) {
    var d = e.data;
    if (d && typeof d === 'object') d = d.__callCommand;
    if (typeof d !== 'string') return;
    try { handle(JSON.parse(d)); } catch (err) {}
  }
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage);
  send({ type: 'loaded' });
})();
</script>
</body></html>`;
