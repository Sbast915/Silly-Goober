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
  var muteBtn = document.getElementById('mute-btn');
  var callBtn = document.getElementById('call-btn');
  var endBtn = document.getElementById('end-btn');
  var cameraBtn = document.getElementById('camera-btn');

  var ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
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

  var socket = io({ auth: { token: window.__UNLOCK_TOKEN } });
  var localStream = null;
  var pc = null;
  var pendingCandidates = [];
  var callState = 'idle'; // idle | calling | ringing | in-call

  function setStatus(text) { statusEl.textContent = text; }

  function setCallState(state) {
    callState = state;
    incomingCall.hidden = state !== 'ringing';
    callBtn.hidden = state !== 'idle';
    endBtn.hidden = state === 'idle';
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
      await populateMicList();
    } catch (err) {
      setStatus('Camera/mic permission needed');
    }
  }

  async function populateMicList() {
    var devices = await navigator.mediaDevices.enumerateDevices();
    var mics = devices.filter(function (d) { return d.kind === 'audioinput'; });
    micSelect.innerHTML = '';
    mics.forEach(function (d, i) {
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || ('Microphone ' + (i + 1));
      micSelect.appendChild(opt);
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
      setStatus('Could not switch microphone');
    }
  });

  function createPeerConnection() {
    var conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStream.getTracks().forEach(function (track) {
      conn.addTrack(track, localStream);
    });

    conn.ontrack = function (e) {
      remoteVideo.srcObject = e.streams[0];
    };

    conn.onicecandidate = function (e) {
      if (e.candidate) {
        socket.emit('signal', { type: 'candidate', candidate: e.candidate });
      }
    };

    conn.onconnectionstatechange = function () {
      if (conn.connectionState === 'connected') {
        setStatus('Connected');
      } else if (conn.connectionState === 'disconnected' || conn.connectionState === 'failed') {
        setStatus('Connection lost');
      }
    };

    return conn;
  }

  async function flushPendingCandidates() {
    while (pendingCandidates.length) {
      var c = pendingCandidates.shift();
      try { await pc.addIceCandidate(c); } catch (e) { /* ignore */ }
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
    if (!localStream) await initMedia();
    socket.emit('call-accept');
    pc = createPeerConnection();
    setCallState('in-call');
    setStatus('Connecting...');
  });

  declineBtn.addEventListener('click', function () {
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

  socket.on('call-request', function () {
    if (callState !== 'idle') return; // already busy
    setCallState('ringing');
    setStatus('Incoming call');
  });

  socket.on('call-accept', async function () {
    if (!localStream) await initMedia();
    pc = createPeerConnection();
    setCallState('in-call');
    setStatus('Connecting...');
    var offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('signal', { type: 'offer', sdp: pc.localDescription });
  });

  socket.on('call-decline', function () {
    setCallState('idle');
    setStatus('Call declined');
  });

  socket.on('call-end', function () { endCall(false); });
  socket.on('peer-left', function () { endCall(false); setStatus('Ready'); });

  socket.on('room-full', function () {
    setStatus('Another session is already connected');
  });

  socket.on('signal', async function (payload) {
    if (!payload) return;

    if (payload.type === 'offer') {
      if (!pc) pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      await flushPendingCandidates();
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
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
        try { await pc.addIceCandidate(candidate); } catch (e) { /* ignore */ }
      } else {
        pendingCandidates.push(candidate);
      }
    }
  });

  setCallState('idle');
  initMedia();
})();
