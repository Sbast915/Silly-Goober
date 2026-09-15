(function () {
  'use strict';

  var callView = document.getElementById('call-view');

  callView.innerHTML =
    '<div class="call-videos">' +
    '  <video id="remote-video" autoplay playsinline></video>' +
    '  <video id="local-video" autoplay playsinline muted></video>' +
    '  <div class="call-status" id="call-status">Connecting...</div>' +
    '  <div class="incoming-call" id="incoming-call" hidden>' +
    '    <p>Incoming call</p>' +
    '    <div class="incoming-actions">' +
    '      <button class="btn-call" id="accept-btn">Accept</button>' +
    '      <button class="btn-end" id="decline-btn">Decline</button>' +
    '    </div>' +
    '  </div>' +
    '</div>' +
    '<div class="device-picker">' +
    '  <label for="mic-select">Mic</label>' +
    '  <select id="mic-select"></select>' +
    '  <label for="camera-select">Cam</label>' +
    '  <select id="camera-select"></select>' +
    '</div>' +
    '<div class="call-controls">' +
    '  <button class="btn-toggle" id="mute-btn" title="Mute">Mute</button>' +
    '  <button class="btn-call" id="call-btn" title="Call">Call</button>' +
    '  <button class="btn-end" id="end-btn" title="End call" hidden>End</button>' +
    '  <button class="btn-toggle" id="camera-btn" title="Camera off">Cam</button>' +
    '</div>';

  var remoteVideo = document.getElementById('remote-video');
  var localVideo = document.getElementById('local-video');
  var statusEl = document.getElementById('call-status');
  var incomingCall = document.getElementById('incoming-call');
  var acceptBtn = document.getElementById('accept-btn');
  var declineBtn = document.getElementById('decline-btn');
  var micSelect = document.getElementById('mic-select');
  var cameraSelect = document.getElementById('camera-select');
  var muteBtn = document.getElementById('mute-btn');
  var callBtn = document.getElementById('call-btn');
  var endBtn = document.getElementById('end-btn');
  var cameraBtn = document.getElementById('camera-btn');

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
  var callState = 'idle'; // idle | calling | ringing | in-call

  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[call]');
    console.log.apply(console, args);
  }

  function setStatus(text) { statusEl.textContent = text; }

  function setCallState(state) {
    log('state ->', state);
    callState = state;
    incomingCall.hidden = state !== 'ringing';
    callBtn.hidden = state !== 'idle';
    endBtn.hidden = state === 'idle';
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
      setStatus('Ready');
      await populateDeviceLists();
    } catch (err) {
      log('getUserMedia error', err && err.name, err && err.message);
      setStatus('Camera/mic permission needed');
    }
  }

  async function populateDeviceLists() {
    var devices = await navigator.mediaDevices.enumerateDevices();
    var mics = devices.filter(function (d) { return d.kind === 'audioinput'; });
    var cams = devices.filter(function (d) { return d.kind === 'videoinput'; });

    micSelect.innerHTML = '';
    mics.forEach(function (d, i) {
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || ('Microphone ' + (i + 1));
      micSelect.appendChild(opt);
    });

    cameraSelect.innerHTML = '';
    cams.forEach(function (d, i) {
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || ('Camera ' + (i + 1));
      cameraSelect.appendChild(opt);
    });

    var currentAudio = localStream && localStream.getAudioTracks()[0];
    var currentVideo = localStream && localStream.getVideoTracks()[0];
    if (currentAudio) {
      var aid = currentAudio.getSettings().deviceId;
      if (aid) micSelect.value = aid;
    }
    if (currentVideo) {
      var vid = currentVideo.getSettings().deviceId;
      if (vid) cameraSelect.value = vid;
    }
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
      if (oldTrack) {
        localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStream.addTrack(newTrack);

      if (pc) {
        var sender = pc.getSenders().find(function (s) { return s.track && s.track.kind === 'audio'; });
        if (sender) sender.replaceTrack(newTrack);
      }
    } catch (err) {
      log('mic switch error', err && err.message);
      setStatus('Could not switch microphone');
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
      if (oldTrack) {
        localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStream.addTrack(newTrack);
      localVideo.srcObject = localStream;

      if (pc) {
        var sender = pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
        if (sender) sender.replaceTrack(newTrack);
      }
    } catch (err) {
      log('camera switch error', err && err.message);
      setStatus('Could not switch camera');
    }
  });

  function createPeerConnection() {
    log('createPeerConnection iceServers=', JSON.stringify(iceServers.map(function (s) { return s.urls; })));
    var conn = new RTCPeerConnection({ iceServers: iceServers });

    localStream.getTracks().forEach(function (track) {
      conn.addTrack(track, localStream);
    });

    conn.ontrack = function (e) {
      log('ontrack kind=', e.track && e.track.kind);
      remoteVideo.srcObject = e.streams[0];
    };

    conn.onicecandidate = function (e) {
      if (e.candidate) {
        log('local ICE candidate type=', e.candidate.type, 'proto=', e.candidate.protocol);
        socket.emit('signal', { type: 'candidate', candidate: e.candidate });
      } else {
        log('local ICE gathering complete');
      }
    };

    conn.onicecandidateerror = function (e) {
      log('ICE candidate error url=', e.url, 'code=', e.errorCode, 'text=', e.errorText);
    };

    conn.oniceconnectionstatechange = function () {
      log('ICE connection state=', conn.iceConnectionState);
      if (conn.iceConnectionState === 'failed') {
        setStatus('Connection failed (NAT/TURN)');
      } else if (conn.iceConnectionState === 'disconnected') {
        setStatus('Reconnecting...');
      } else if (conn.iceConnectionState === 'checking') {
        setStatus('Checking...');
      }
    };

    conn.onicegatheringstatechange = function () {
      log('ICE gathering state=', conn.iceGatheringState);
    };

    conn.onsignalingstatechange = function () {
      log('signaling state=', conn.signalingState);
    };

    conn.onconnectionstatechange = function () {
      log('connection state=', conn.connectionState);
      if (conn.connectionState === 'connected') {
        setStatus('Connected');
      } else if (conn.connectionState === 'failed') {
        setStatus('Connection failed');
      } else if (conn.connectionState === 'disconnected') {
        setStatus('Disconnected');
      }
    };

    return conn;
  }

  async function flushPendingCandidates() {
    while (pendingCandidates.length) {
      var c = pendingCandidates.shift();
      try { await pc.addIceCandidate(c); } catch (e) { log('addIceCandidate error', e && e.message); }
    }
  }

  async function startCall() {
    if (!localStream) await initMedia();
    setCallState('calling');
    setStatus('Calling...');
    socket.emit('call-request');
  }

  async function endCall(notifyPeer) {
    if (notifyPeer) socket.emit('call-end');
    if (pc) {
      pc.close();
      pc = null;
    }
    remoteVideo.srcObject = null;
    pendingCandidates = [];
    setCallState('idle');
    setStatus('Ready');
  }

  callBtn.addEventListener('click', startCall);
  endBtn.addEventListener('click', function () { endCall(true); });

  acceptBtn.addEventListener('click', async function () {
    log('accept clicked');
    incomingCall.hidden = true; // immediate feedback, don't wait for setCallState
    if (!localStream) await initMedia();
    await fetchIceConfig();
    socket.emit('call-accept');
    pc = createPeerConnection();
    setCallState('in-call');
    setStatus('Connecting...');
  });

  declineBtn.addEventListener('click', function () {
    log('decline clicked');
    incomingCall.hidden = true;
    socket.emit('call-decline');
    setCallState('idle');
    setStatus('Ready');
  });

  muteBtn.addEventListener('click', function () {
    if (!localStream) return;
    var track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    muteBtn.classList.toggle('off', !track.enabled);
    muteBtn.textContent = track.enabled ? 'Mute' : 'Unmute';
  });

  cameraBtn.addEventListener('click', function () {
    if (!localStream) return;
    var track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    cameraBtn.classList.toggle('off', !track.enabled);
    cameraBtn.textContent = track.enabled ? 'Cam' : 'Cam off';
  });

  // --- Signaling handlers ---

  socket.on('connect', function () { log('socket connected id=', socket.id); });
  socket.on('connect_error', function (err) { log('socket connect_error', err && err.message); });
  socket.on('disconnect', function (r) { log('socket disconnect reason=', r); });

  socket.on('call-request', function () {
    log('<- call-request');
    if (callState !== 'idle') return; // already busy
    setCallState('ringing');
    setStatus('Incoming call');
  });

  socket.on('call-accept', async function () {
    log('<- call-accept');
    if (!localStream) await initMedia();
    await fetchIceConfig();
    pc = createPeerConnection();
    setCallState('in-call');
    setStatus('Connecting...');
    var offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    log('-> signal offer');
    socket.emit('signal', { type: 'offer', sdp: pc.localDescription });
  });

  socket.on('call-decline', function () {
    log('<- call-decline');
    setCallState('idle');
    setStatus('Call declined');
  });

  socket.on('call-end', function () { log('<- call-end'); endCall(false); });
  socket.on('peer-left', function () { log('<- peer-left'); endCall(false); setStatus('Ready'); });

  socket.on('room-full', function () {
    log('<- room-full');
    setStatus('Another session is already connected');
  });

  socket.on('signal', async function (payload) {
    if (!payload) return;
    log('<- signal type=', payload.type);

    if (payload.type === 'offer') {
      if (!pc) {
        await fetchIceConfig();
        pc = createPeerConnection();
      }
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      await flushPendingCandidates();
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      log('-> signal answer');
      socket.emit('signal', { type: 'answer', sdp: pc.localDescription });
      setCallState('in-call');
    } else if (payload.type === 'answer') {
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingCandidates();
      }
    } else if (payload.type === 'candidate') {
      var candidate = new RTCIceCandidate(payload.candidate);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(candidate);
          log('added remote ICE candidate');
        } catch (e) { log('addIceCandidate error', e && e.message); }
      } else {
        pendingCandidates.push(candidate);
        log('queued remote ICE candidate (no remoteDescription yet)');
      }
    }
  });

  setCallState('idle');
  initMedia();
})();
