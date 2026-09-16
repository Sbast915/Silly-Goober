(function () {
  'use strict';

  var callView = document.getElementById('call-view');

  // Inline SVG icon set (mic on/off, cam on/off, hangup, settings, phone-in)
  var ICONS = {
    mic: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>',
    micOff: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.1.9-3.28zM4.27 3L3 4.27l6 6V11a3 3 0 0 0 4.53 2.58l1.09 1.09c-.5.29-1.05.5-1.62.6V19h2v-3.72c.53-.09 1.05-.24 1.53-.44l3.7 3.71 1.27-1.27L4.27 3zM12 3a3 3 0 0 0-3 3v.18l6 6V6a3 3 0 0 0-3-3z"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
    camOff: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z"/></svg>',
    hangup: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.55-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',
    call: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'
  };

  callView.innerHTML =
    '<audio id="remote-audio" autoplay playsinline></audio>' +
    '<audio id="silent-keepalive" loop></audio>' +
    '<div class="dc-header">' +
    '  <div class="dc-channel">' +
    '    <span class="dc-channel-hash">#</span>' +
    '    <span class="dc-channel-name">private-voice</span>' +
    '  </div>' +
    '  <button class="dc-icon-btn" id="settings-btn" title="Devices">' + ICONS.settings + '</button>' +
    '</div>' +

    '<div class="dc-stage">' +
    '  <div class="dc-tile dc-tile-remote" id="tile-remote">' +
    '    <video id="remote-video" autoplay playsinline></video>' +
    '    <div class="dc-avatar dc-avatar-remote">P</div>' +
    '    <div class="dc-tile-label">Peer</div>' +
    '  </div>' +
    '  <div class="dc-tile dc-tile-local" id="tile-local">' +
    '    <video id="local-video" autoplay playsinline muted></video>' +
    '    <div class="dc-avatar dc-avatar-local">Y</div>' +
    '    <div class="dc-tile-label">You</div>' +
    '  </div>' +
    '</div>' +

    '<div class="dc-status-bar">' +
    '  <span class="dc-status-dot" id="status-dot"></span>' +
    '  <span class="dc-status-text" id="call-status">Ready</span>' +
    '</div>' +

    '<div class="dc-settings" id="settings-panel" hidden>' +
    '  <div class="dc-setting-row">' +
    '    <label for="mic-select">Microphone</label>' +
    '    <select id="mic-select"></select>' +
    '  </div>' +
    '  <div class="dc-setting-row">' +
    '    <label for="camera-select">Camera</label>' +
    '    <select id="camera-select"></select>' +
    '  </div>' +
    '  <div class="dc-setting-row" id="speaker-row" hidden>' +
    '    <label for="speaker-select">Speaker</label>' +
    '    <select id="speaker-select"></select>' +
    '  </div>' +
    '</div>' +

    '<div class="dc-controls">' +
    '  <button class="dc-ctrl-btn" id="mute-btn" title="Mute">' + ICONS.mic + '</button>' +
    '  <button class="dc-ctrl-btn" id="camera-btn" title="Camera off">' + ICONS.cam + '</button>' +
    '  <button class="dc-ctrl-btn dc-ctrl-primary" id="call-btn" title="Call">' + ICONS.call + '</button>' +
    '  <button class="dc-ctrl-btn dc-ctrl-danger" id="end-btn" title="Hang up" hidden>' + ICONS.hangup + '</button>' +
    '</div>' +

    '<div class="dc-incoming" id="incoming-call" hidden>' +
    '  <div class="dc-incoming-card">' +
    '    <div class="dc-incoming-avatar">P</div>' +
    '    <div class="dc-incoming-name">Incoming call</div>' +
    '    <div class="dc-incoming-actions">' +
    '      <button class="dc-ctrl-btn dc-ctrl-danger" id="decline-btn" title="Decline">' + ICONS.hangup + '</button>' +
    '      <button class="dc-ctrl-btn dc-ctrl-accept" id="accept-btn" title="Accept">' + ICONS.call + '</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  var remoteVideo = document.getElementById('remote-video');
  var remoteAudio = document.getElementById('remote-audio');
  var localVideo = document.getElementById('local-video');
  var statusEl = document.getElementById('call-status');
  var statusDot = document.getElementById('status-dot');
  var incomingCall = document.getElementById('incoming-call');
  var acceptBtn = document.getElementById('accept-btn');
  var declineBtn = document.getElementById('decline-btn');
  var micSelect = document.getElementById('mic-select');
  var cameraSelect = document.getElementById('camera-select');
  var speakerSelect = document.getElementById('speaker-select');
  var speakerRow = document.getElementById('speaker-row');
  var muteBtn = document.getElementById('mute-btn');
  var callBtn = document.getElementById('call-btn');
  var endBtn = document.getElementById('end-btn');
  var cameraBtn = document.getElementById('camera-btn');
  var settingsBtn = document.getElementById('settings-btn');
  var settingsPanel = document.getElementById('settings-panel');
  var tileLocal = document.getElementById('tile-local');
  var tileRemote = document.getElementById('tile-remote');
  var silentAudio = document.getElementById('silent-keepalive');

  var FALLBACK_ICE = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];
  var iceServers = FALLBACK_ICE;

  var socket = io({ auth: { token: window.__UNLOCK_TOKEN } });
  var localStream = null;
  var pc = null;
  var pendingCandidates = [];
  var callState = 'idle';           // idle | calling | ringing | in-call
  var role = 'none';                // 'caller' | 'callee' | 'none'
  var iAmCalling = false;           // true after we emit call-request, until state leaves 'calling'
  var t0 = Date.now();
  var localCandCount = 0;
  var remoteCandCount = 0;
  var wakeLock = null;
  var silentCtx = null;
  var silentOsc = null;
  var wasInCallBeforeHidden = false;

  function log() {
    var args = Array.prototype.slice.call(arguments);
    var elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    args.unshift('[call ' + role + ' t+' + elapsed + 's]');
    console.log.apply(console, args);
  }

  function summarizeSdp(sdp) {
    if (!sdp || !sdp.sdp) return '(empty)';
    var lines = sdp.sdp.split(/\r?\n/);
    var mlines = lines.filter(function (l) { return l.indexOf('m=') === 0; }).map(function (l) { return l.slice(0, 30); });
    return sdp.type + ' bytes=' + sdp.sdp.length + ' m=' + JSON.stringify(mlines);
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusDot.className = 'dc-status-dot ' + (kind ? 'dc-status-' + kind : '');
  }

  function setCallState(state) {
    log('state ->', state);
    callState = state;
    incomingCall.hidden = state !== 'ringing';
    callBtn.hidden = state !== 'idle';
    endBtn.hidden = state === 'idle';

    // tiles
    tileRemote.classList.toggle('dc-tile-active', state === 'in-call');
    tileLocal.classList.toggle('dc-tile-active', state === 'in-call');
    callView.classList.toggle('dc-in-call', state === 'in-call');

    if (state === 'in-call') {
      acquireWakeLock();
      startSilentKeepalive();
    } else if (state === 'idle') {
      releaseWakeLock();
      stopSilentKeepalive();
      iAmCalling = false;
    }
  }

  async function fetchIceConfig() {
    try {
      var r = await fetch('/api/ice-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (window.__UNLOCK_TOKEN || '')
        },
        body: '{}'
      });
      if (!r.ok) { log('ice-config non-ok', r.status); return; }
      var data = await r.json();
      if (data && data.ok && Array.isArray(data.iceServers) && data.iceServers.length) {
        iceServers = data.iceServers;
        log('ice-config loaded source=', data.source, 'servers=', iceServers.length);
      }
    } catch (err) {
      log('ice-config error', err && err.message);
    }
  }

  async function initMedia() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: true
      });
      localVideo.srcObject = localStream;
      setStatus('Ready', 'ready');
      await populateDeviceLists();
    } catch (err) {
      log('getUserMedia error', err && err.name, err && err.message);
      setStatus('Camera/mic permission needed', 'error');
    }
  }

  async function populateDeviceLists() {
    var devices = await navigator.mediaDevices.enumerateDevices();
    var mics = devices.filter(function (d) { return d.kind === 'audioinput'; });
    var cams = devices.filter(function (d) { return d.kind === 'videoinput'; });
    var speakers = devices.filter(function (d) { return d.kind === 'audiooutput'; });

    var currentAudio = localStream && localStream.getAudioTracks()[0];
    var currentVideo = localStream && localStream.getVideoTracks()[0];
    var currentAudioId = currentAudio ? (currentAudio.getSettings().deviceId || '') : '';
    var currentVideoId = currentVideo ? (currentVideo.getSettings().deviceId || '') : '';

    micSelect.innerHTML = '';
    mics.forEach(function (d, i) {
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || ('Microphone ' + (i + 1));
      micSelect.appendChild(opt);
    });
    if (currentAudioId) micSelect.value = currentAudioId;

    cameraSelect.innerHTML = '';
    cams.forEach(function (d, i) {
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || ('Camera ' + (i + 1));
      cameraSelect.appendChild(opt);
    });
    if (currentVideoId) cameraSelect.value = currentVideoId;

    // Speaker select only shown if the platform actually supports setSinkId
    var canSetSink = typeof remoteAudio.setSinkId === 'function' && speakers.length > 0;
    if (canSetSink) {
      speakerRow.hidden = false;
      speakerSelect.innerHTML = '';
      speakers.forEach(function (d, i) {
        var opt = document.createElement('option');
        opt.value = d.deviceId;
        opt.textContent = d.label || ('Output ' + (i + 1));
        speakerSelect.appendChild(opt);
      });
    } else {
      speakerRow.hidden = true;
    }
  }

  // ---------- Device change (AirPods plugged in mid-call, etc.) ----------
  if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
    navigator.mediaDevices.addEventListener('devicechange', function () {
      log('EVENT devicechange - repopulating device lists');
      populateDeviceLists().catch(function (err) { log('devicechange repop error', err && err.message); });
    });
  }

  micSelect.addEventListener('change', async function () {
    var deviceId = micSelect.value;
    if (!deviceId) return;
    try {
      var newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      var newTrack = newStream.getAudioTracks()[0];
      var oldTrack = localStream.getAudioTracks()[0];
      if (oldTrack) { localStream.removeTrack(oldTrack); oldTrack.stop(); }
      localStream.addTrack(newTrack);
      if (pc) {
        var sender = pc.getSenders().find(function (s) { return s.track && s.track.kind === 'audio'; });
        if (sender) sender.replaceTrack(newTrack);
      }
    } catch (err) {
      log('mic switch error', err && err.message);
      setStatus('Could not switch microphone', 'error');
    }
  });

  cameraSelect.addEventListener('change', async function () {
    var deviceId = cameraSelect.value;
    if (!deviceId) return;
    try {
      var newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      var newTrack = newStream.getVideoTracks()[0];
      var oldTrack = localStream.getVideoTracks()[0];
      if (oldTrack) { localStream.removeTrack(oldTrack); oldTrack.stop(); }
      localStream.addTrack(newTrack);
      localVideo.srcObject = localStream;
      if (pc) {
        var sender = pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
        if (sender) sender.replaceTrack(newTrack);
      }
    } catch (err) {
      log('camera switch error', err && err.message);
      setStatus('Could not switch camera', 'error');
    }
  });

  speakerSelect.addEventListener('change', async function () {
    if (typeof remoteAudio.setSinkId !== 'function') return;
    try {
      await remoteAudio.setSinkId(speakerSelect.value);
      if (typeof remoteVideo.setSinkId === 'function') {
        await remoteVideo.setSinkId(speakerSelect.value);
      }
      log('setSinkId ->', speakerSelect.value);
    } catch (err) { log('setSinkId error', err && err.message); }
  });

  // ---------- Wake Lock (real: only helps if phone screen would sleep) ----------
  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) { log('wakeLock API not available'); return; }
    if (wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      log('wakeLock acquired');
      wakeLock.addEventListener('release', function () {
        log('wakeLock released by system');
        wakeLock = null;
      });
    } catch (err) { log('wakeLock request failed', err && err.message); }
  }
  async function releaseWakeLock() {
    if (!wakeLock) return;
    try { await wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }

  // ---------- Silent keepalive audio (marginal: reduces suspension odds) ----------
  function startSilentKeepalive() {
    if (silentCtx) return;
    try {
      silentCtx = new (window.AudioContext || window.webkitAudioContext)();
      silentOsc = silentCtx.createOscillator();
      var gain = silentCtx.createGain();
      gain.gain.value = 0.0001; // effectively silent, but not zero (some browsers cull zero-gain)
      silentOsc.connect(gain);
      gain.connect(silentCtx.destination);
      silentOsc.start();
      log('silent keepalive started');
    } catch (err) { log('silent keepalive failed', err && err.message); silentCtx = null; }
  }
  function stopSilentKeepalive() {
    try { if (silentOsc) silentOsc.stop(); } catch (e) {}
    try { if (silentCtx) silentCtx.close(); } catch (e) {}
    silentOsc = null;
    silentCtx = null;
  }

  // ---------- Visibility API (real: try to recover when returning to tab) ----------
  document.addEventListener('visibilitychange', function () {
    log('EVENT visibilitychange ->', document.visibilityState);
    if (document.visibilityState === 'hidden') {
      wasInCallBeforeHidden = (callState === 'in-call');
    } else if (document.visibilityState === 'visible') {
      // Re-acquire wake lock if it got dropped while hidden
      if (callState === 'in-call') acquireWakeLock();
      // If we were in a call and it seems to have died, try to recover
      if (wasInCallBeforeHidden && pc) {
        var s = pc.connectionState;
        if (s === 'disconnected' || s === 'failed' || s === 'closed') {
          log('post-visibility check: connection is', s, ', attempting ICE restart');
          tryIceRestart();
        }
      }
      wasInCallBeforeHidden = false;
    }
  });

  async function tryIceRestart() {
    if (!pc || role !== 'caller') return; // only caller can create restart offers cleanly
    try {
      log('creating ICE-restart offer');
      var offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      socket.emit('signal', { type: 'offer', sdp: pc.localDescription });
    } catch (err) { log('ICE restart error', err && err.message); }
  }

  // ---------- PC ----------
  function createPeerConnection() {
    var summary = iceServers.map(function (s) {
      return { urls: s.urls, hasAuth: !!(s.username && s.credential) };
    });
    log('createPeerConnection iceServers=', JSON.stringify(summary));
    var conn = new RTCPeerConnection({ iceServers: iceServers });
    localCandCount = 0;
    remoteCandCount = 0;

    var trackCount = 0;
    localStream.getTracks().forEach(function (track) {
      conn.addTrack(track, localStream);
      trackCount++;
      log('addTrack kind=', track.kind, 'label=', track.label, 'enabled=', track.enabled);
    });
    log('added tracks total=', trackCount);

    conn.ontrack = function (e) {
      log('EVENT ontrack kind=', e.track && e.track.kind, 'streams=', e.streams && e.streams.length);
      if (e.streams && e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
        remoteAudio.srcObject = e.streams[0];
      }
    };

    conn.onicecandidate = function (e) {
      if (e.candidate) {
        localCandCount++;
        log('EVENT icecandidate LOCAL #' + localCandCount, 'type=' + e.candidate.type, 'proto=' + e.candidate.protocol);
        socket.emit('signal', { type: 'candidate', candidate: e.candidate });
      } else {
        log('EVENT icecandidate LOCAL null (gathering complete). Total=', localCandCount);
      }
    };
    conn.onicecandidateerror = function (e) {
      log('EVENT icecandidateerror url=', e.url, 'code=', e.errorCode, 'text=', e.errorText);
    };
    conn.oniceconnectionstatechange = function () {
      log('EVENT iceconnectionstatechange ->', conn.iceConnectionState);
      if (conn.iceConnectionState === 'checking') setStatus('Connecting...', 'connecting');
      else if (conn.iceConnectionState === 'connected' || conn.iceConnectionState === 'completed') setStatus('Connected', 'connected');
      else if (conn.iceConnectionState === 'failed') setStatus('Connection failed', 'error');
      else if (conn.iceConnectionState === 'disconnected') setStatus('Reconnecting...', 'connecting');
    };
    conn.onicegatheringstatechange = function () { log('EVENT icegatheringstatechange ->', conn.iceGatheringState); };
    conn.onsignalingstatechange = function () { log('EVENT signalingstatechange ->', conn.signalingState); };
    conn.onconnectionstatechange = function () {
      log('EVENT connectionstatechange ->', conn.connectionState);
      if (conn.connectionState === 'connected') setStatus('Connected', 'connected');
      else if (conn.connectionState === 'failed') setStatus('Connection failed', 'error');
      else if (conn.connectionState === 'disconnected') setStatus('Disconnected', 'error');
    };
    conn.onnegotiationneeded = function () { log('EVENT negotiationneeded'); };

    return conn;
  }

  async function flushPendingCandidates() {
    if (pendingCandidates.length) log('flushing', pendingCandidates.length, 'queued ICE candidates');
    while (pendingCandidates.length) {
      var c = pendingCandidates.shift();
      try { await pc.addIceCandidate(c); } catch (e) { log('flush addIceCandidate error', e && e.message); }
    }
  }

  async function startCall() {
    if (!localStream) await initMedia();
    t0 = Date.now();
    role = 'caller';
    iAmCalling = true;
    log('startCall clicked, becoming CALLER, sending call-request');
    setCallState('calling');
    setStatus('Calling...', 'connecting');
    socket.emit('call-request');
  }

  async function endCall(notifyPeer) {
    if (notifyPeer) socket.emit('call-end');
    if (pc) { try { pc.close(); } catch (e) {} pc = null; }
    remoteVideo.srcObject = null;
    remoteAudio.srcObject = null;
    pendingCandidates = [];
    role = 'none';
    iAmCalling = false;
    setCallState('idle');
    setStatus('Ready', 'ready');
  }

  callBtn.addEventListener('click', startCall);
  endBtn.addEventListener('click', function () { endCall(true); });
  settingsBtn.addEventListener('click', function () { settingsPanel.hidden = !settingsPanel.hidden; });

  acceptBtn.addEventListener('click', async function () {
    t0 = Date.now();
    role = 'callee';
    log('accept clicked, becoming CALLEE');
    incomingCall.hidden = true;
    if (!localStream) await initMedia();
    await fetchIceConfig();
    log('emitting call-accept');
    socket.emit('call-accept');
    log('creating PC as callee (waiting for offer from caller)');
    pc = createPeerConnection();
    setCallState('in-call');
    setStatus('Connecting...', 'connecting');
  });

  declineBtn.addEventListener('click', function () {
    log('decline clicked');
    incomingCall.hidden = true;
    socket.emit('call-decline');
    role = 'none';
    setCallState('idle');
    setStatus('Ready', 'ready');
  });

  muteBtn.addEventListener('click', function () {
    if (!localStream) return;
    var track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    muteBtn.classList.toggle('dc-ctrl-off', !track.enabled);
    muteBtn.innerHTML = track.enabled ? ICONS.mic : ICONS.micOff;
    muteBtn.title = track.enabled ? 'Mute' : 'Unmute';
  });

  cameraBtn.addEventListener('click', function () {
    if (!localStream) return;
    var track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    cameraBtn.classList.toggle('dc-ctrl-off', !track.enabled);
    cameraBtn.innerHTML = track.enabled ? ICONS.cam : ICONS.camOff;
    cameraBtn.title = track.enabled ? 'Camera off' : 'Camera on';
    tileLocal.classList.toggle('dc-cam-off', !track.enabled);
  });

  // ---------- Signaling ----------
  socket.on('connect', function () { log('socket connected id=', socket.id); });
  socket.on('connect_error', function (err) { log('socket connect_error', err && err.message); });
  socket.on('disconnect', function (r) { log('socket disconnect reason=', r); });

  socket.on('call-request', function (msg) {
    var fromId = msg && msg.fromId;
    var myId = socket.id;
    log('<- call-request from=', fromId, 'myId=', myId, 'state=', callState);

    if (callState === 'in-call') { log('ignoring call-request, already in-call'); return; }

    if (callState === 'calling') {
      // GLARE: both peers clicked Call within the same window.
      // Deterministic tie-break: lexicographically SMALLER socket.id wins as caller.
      // Both peers do the same comparison on the same pair of ids, so they reach the same conclusion.
      log('GLARE detected. tie-break: myId < fromId ->', (myId && fromId) ? (myId < fromId) : '(missing id)');
      if (myId && fromId && myId < fromId) {
        log('GLARE: I win as caller, ignoring peer request; peer should transition to callee');
        return;
      }
      log('GLARE: I lose, cancelling my caller state and transitioning to callee/ringing');
      role = 'callee';
      iAmCalling = false;
      setCallState('ringing');
      setStatus('Incoming call', 'connecting');
      return;
    }

    if (callState === 'ringing') { log('ignoring duplicate call-request while already ringing'); return; }

    // idle -> normal incoming call
    role = 'callee';
    setCallState('ringing');
    setStatus('Incoming call', 'connecting');
  });

  socket.on('call-accept', async function () {
    log('<- call-accept received (I am caller, my peer accepted)');
    if (!localStream) await initMedia();
    await fetchIceConfig();
    log('creating PC as caller');
    pc = createPeerConnection();
    setCallState('in-call');
    setStatus('Connecting...', 'connecting');

    log('SDP: createOffer() begin');
    var offer = await pc.createOffer();
    log('SDP: createOffer() done ->', summarizeSdp(offer));
    log('SDP: setLocalDescription(offer) begin');
    await pc.setLocalDescription(offer);
    log('SDP: setLocalDescription(offer) DONE. signaling=', pc.signalingState);
    log('-> emit signal offer');
    socket.emit('signal', { type: 'offer', sdp: pc.localDescription });
  });

  socket.on('call-decline', function () {
    log('<- call-decline');
    role = 'none';
    setCallState('idle');
    setStatus('Call declined', 'error');
  });

  socket.on('call-end', function () { log('<- call-end'); endCall(false); });
  socket.on('peer-left', function () { log('<- peer-left'); endCall(false); setStatus('Peer left', 'error'); });
  socket.on('room-full', function () { log('<- room-full'); setStatus('Another session is already connected', 'error'); });

  socket.on('signal', async function (payload) {
    if (!payload) return;
    if (payload.type === 'offer') {
      log('<- signal OFFER', summarizeSdp(payload.sdp));
      if (!pc) { log('no PC yet on offer, creating one'); await fetchIceConfig(); pc = createPeerConnection(); }
      log('SDP: setRemoteDescription(offer) begin');
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      log('SDP: setRemoteDescription(offer) DONE. signaling=', pc.signalingState);
      await flushPendingCandidates();
      log('SDP: createAnswer() begin');
      var answer = await pc.createAnswer();
      log('SDP: createAnswer() done ->', summarizeSdp(answer));
      log('SDP: setLocalDescription(answer) begin');
      await pc.setLocalDescription(answer);
      log('SDP: setLocalDescription(answer) DONE. signaling=', pc.signalingState);
      log('-> emit signal answer');
      socket.emit('signal', { type: 'answer', sdp: pc.localDescription });
      setCallState('in-call');
    } else if (payload.type === 'answer') {
      log('<- signal ANSWER', summarizeSdp(payload.sdp));
      if (pc) {
        log('SDP: setRemoteDescription(answer) begin');
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        log('SDP: setRemoteDescription(answer) DONE. signaling=', pc.signalingState);
        await flushPendingCandidates();
      }
    } else if (payload.type === 'candidate') {
      var candidate = new RTCIceCandidate(payload.candidate);
      remoteCandCount++;
      if (pc && pc.remoteDescription) {
        try { await pc.addIceCandidate(candidate); log('<- ICE REMOTE #' + remoteCandCount, 'ADDED'); }
        catch (e) { log('<- ICE REMOTE #' + remoteCandCount, 'addIceCandidate error', e && e.message); }
      } else {
        pendingCandidates.push(candidate);
        log('<- ICE REMOTE #' + remoteCandCount, 'QUEUED, queue=', pendingCandidates.length);
      }
    }
  });

  setCallState('idle');
  initMedia();
})();
