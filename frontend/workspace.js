(function () {
  'use strict';

  var callView = document.getElementById('workspace-view');

  // Inline SVG icon set (mic on/off, cam on/off, hangup, settings, phone-in)
  var ICONS = {
    mic: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>',
    micOff: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.1.9-3.28zM4.27 3L3 4.27l6 6V11a3 3 0 0 0 4.53 2.58l1.09 1.09c-.5.29-1.05.5-1.62.6V19h2v-3.72c.53-.09 1.05-.24 1.53-.44l3.7 3.71 1.27-1.27L4.27 3zM12 3a3 3 0 0 0-3 3v.18l6 6V6a3 3 0 0 0-3-3z"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
    camOff: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z"/></svg>',
    hangup: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.55-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',
    call: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    expand: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
    // Real fullscreen (whole display), distinct from the in-page expand above.
    fullscreen: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 3h8v2H5v6H3V3zm18 0v8h-2V5h-6V3h8zM3 13h2v6h6v2H3v-8zm16 0h2v8h-8v-2h6v-6z"/></svg>',
    exitFullscreen: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 3h2v6H5V7h4V3zm6 0h-2v6h6V7h-4V3zM9 21h2v-6H5v2h4v4zm6 0h-2v-6h6v2h-4v4z"/></svg>',
    leave: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 9h10v2H7V9zm6 5H7v-2h6v2zm4-6H7V6h10v2z"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/></svg>',
    micNote: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>',
    person: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4 0-9 2-9 5v3h18v-3c0-3-5-5-9-5z"/></svg>',
    screen: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6v2H8v2h8v-2h-2v-2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 13H4V5h16v11z"/></svg>'
  };

  callView.innerHTML =
    '<audio id="remote-audio" autoplay playsinline></audio>' +
    '<div class="dc-header">' +
    '  <div class="dc-channel">' +
    '    <span class="dc-channel-hash">#</span>' +
    '    <span class="dc-channel-name">private-voice</span>' +
    '  </div>' +
    '  <div class="dc-header-right">' +
    '    <div class="dc-presence" id="presence-pill" title="Who’s here">' +
    '      <span class="dc-presence-dot"></span>' +
    '      <span class="dc-presence-text" id="presence-text">1 online</span>' +
    '    </div>' +
    '    <button class="dc-icon-btn" id="chat-btn" title="Chat">' + ICONS.chat + '<span class="dc-unread-dot" id="unread-dot" hidden></span></button>' +
    '    <button class="dc-icon-btn" id="profile-btn" title="Switch profile">' + ICONS.person + '</button>' +
    '    <button class="dc-icon-btn" id="settings-btn" title="Devices">' + ICONS.settings + '</button>' +
    '    <button class="dc-icon-btn dc-icon-btn-leave" id="leave-btn" title="Leave call room" aria-label="Leave call room">' + ICONS.leave + '</button>' +
    '  </div>' +
    '</div>' +

    '<div class="dc-stage" id="stage">' +
    '  <div class="dc-empty-state" id="stage-empty">' +
    '    <div class="dc-empty-title" id="empty-title">Getting camera ready...</div>' +
    '  </div>' +
    '  <div class="dc-presence-list" id="presence-list" hidden>' +
    '    <div class="dc-presence-list-title">Who’s here</div>' +
    '    <ul class="dc-presence-list-items" id="presence-list-items"></ul>' +
    '  </div>' +
    '  <div class="dc-tile dc-tile-remote" id="tile-remote" hidden>' +
    '    <video id="remote-video" autoplay playsinline></video>' +
    '    <div class="dc-tile-avatar" id="remote-avatar-overlay"><div class="dc-avatar-circle" id="remote-avatar-circle">?</div></div>' +
    '    <div class="dc-tile-label" id="remote-tile-label">Peer</div>' +
    '    <button type="button" class="dc-tile-fs" id="fs-remote-btn" title="Fullscreen" aria-label="Fullscreen peer tile">' + ICONS.fullscreen + '</button>' +
    '    <button type="button" class="dc-tile-expand" id="expand-remote-btn" title="Expand" aria-label="Expand peer tile">' + ICONS.expand + '</button>' +
    '    <button type="button" class="dc-tile-shrink" id="shrink-remote-btn" title="Shrink" aria-label="Shrink peer tile" hidden>' + ICONS.shrink + '</button>' +
    '  </div>' +
    '  <div class="dc-tile dc-tile-local" id="tile-local" hidden>' +
    '    <video id="local-video" autoplay playsinline muted></video>' +
    '    <div class="dc-tile-avatar" id="local-avatar-overlay"><div class="dc-avatar-circle" id="local-avatar-circle">?</div></div>' +
    '    <div class="dc-tile-label" id="local-tile-label">You</div>' +
    '    <button type="button" class="dc-tile-fs" id="fs-local-btn" title="Fullscreen" aria-label="Fullscreen your tile">' + ICONS.fullscreen + '</button>' +
    '    <button type="button" class="dc-tile-expand" id="expand-local-btn" title="Expand" aria-label="Expand your tile">' + ICONS.expand + '</button>' +
    '    <button type="button" class="dc-tile-shrink" id="shrink-local-btn" title="Shrink" aria-label="Shrink your tile" hidden>' + ICONS.shrink + '</button>' +
    '  </div>' +
    // Screen share lives in its OWN tile rather than replacing a camera:
    // a share is an extra source, not a substitute for a face.
    '  <div class="dc-tile dc-tile-screen" id="tile-screen" hidden>' +
    '    <video id="screen-video" autoplay playsinline></video>' +
    '    <div class="dc-tile-label" id="screen-tile-label">Screen</div>' +
    '    <div class="dc-share-badge" id="share-badge" hidden>SHARING SCREEN</div>' +
    '    <button type="button" class="dc-tile-fs" id="fs-screen-btn" title="Fullscreen" aria-label="Fullscreen shared screen">' + ICONS.fullscreen + '</button>' +
    '    <button type="button" class="dc-tile-expand" id="expand-screen-btn" title="Expand" aria-label="Expand shared screen">' + ICONS.expand + '</button>' +
    '    <button type="button" class="dc-tile-shrink" id="shrink-screen-btn" title="Shrink" aria-label="Shrink shared screen" hidden>' + ICONS.shrink + '</button>' +
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
    '  <div class="dc-setting-row">' +
    '    <label for="fit-select">Video fit</label>' +
    '    <select id="fit-select">' +
    '      <option value="cover">Fill tile (crop edges)</option>' +
    '      <option value="contain">Fit entire video (black bars)</option>' +
    '      <option value="fill">Stretch to tile (distorts)</option>' +
    '    </select>' +
    '  </div>' +
    '  <div class="dc-setting-row" id="autopip-row" hidden>' +
    '    <label for="autopip-toggle">Float on tab switch</label>' +
    '    <input type="checkbox" id="autopip-toggle" />' +
    '  </div>' +
    '</div>' +

    '<div class="dc-controls">' +
    '  <button class="dc-ctrl-btn" id="mute-btn" title="Mute">' + ICONS.mic + '</button>' +
    '  <button class="dc-ctrl-btn" id="camera-btn" title="Camera off">' + ICONS.cam + '</button>' +
    '  <button class="dc-ctrl-btn" id="share-btn" title="Share screen">' + ICONS.screen + '</button>' +
    '  <button class="dc-ctrl-btn dc-ctrl-primary" id="call-btn" title="Call">' + ICONS.call + '</button>' +
    '  <button class="dc-ctrl-btn dc-ctrl-danger" id="end-btn" title="Hang up" hidden>' + ICONS.hangup + '</button>' +
    '</div>' +

    '<div class="dc-chat" id="chat-panel" hidden>' +
    '  <div class="dc-chat-header">' +
    '    <span>Chat</span>' +
    '    <button class="dc-icon-btn" id="chat-close" title="Close" aria-label="Close chat">&#10005;</button>' +
    '  </div>' +
    '  <div class="dc-chat-log" id="chat-log"></div>' +
    '  <div class="dc-typing" id="typing-indicator" hidden>' +
    '    <span class="dc-typing-who" id="typing-who">Peer</span>' +
    '    <span class="dc-typing-dots"><i></i><i></i><i></i></span>' +
    '  </div>' +
    '  <div class="dc-chat-compose">' +
    '    <button class="dc-chat-btn" id="chat-image-btn" title="Send image" aria-label="Send image">' + ICONS.image + '</button>' +
    '    <button class="dc-chat-btn" id="chat-audio-btn" title="Hold to record" aria-label="Record voice note">' + ICONS.micNote + '</button>' +
    '    <textarea class="dc-chat-input" id="chat-input" rows="1" placeholder="Message..." maxlength="4000"></textarea>' +
    '    <button class="dc-chat-btn dc-chat-send" id="chat-send" title="Send" aria-label="Send">' + ICONS.send + '</button>' +
    '    <input type="file" id="chat-file" accept="image/*" hidden />' +
    '  </div>' +
    '</div>' +
    '<div class="dc-lightbox" id="chat-lightbox" hidden><img id="lightbox-img" alt="" /></div>' +
    // Corner toast for messages that arrive while the chat panel is closed.
    '<div class="dc-toasts" id="chat-toasts"></div>' +
    '<div class="dc-ended" id="call-ended-toast" hidden>' +
    '  <div class="dc-ended-card">' +
    '    <div class="dc-ended-avatar" id="ended-avatar">?</div>' +
    '    <div class="dc-ended-text" id="ended-text">Call ended</div>' +
    '  </div>' +
    '</div>' +
    '<div class="dc-incoming" id="incoming-call" hidden>' +
    '  <div class="dc-incoming-card">' +
    '    <div class="dc-incoming-avatar" id="incoming-avatar">?</div>' +
    '    <div class="dc-incoming-name" id="incoming-name">Incoming call</div>' +
    '    <div class="dc-incoming-sub" id="incoming-sub"></div>' +
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
  var fitSelect = document.getElementById('fit-select');
  var endedToast = document.getElementById('call-ended-toast');
  var endedAvatar = document.getElementById('ended-avatar');
  var endedText = document.getElementById('ended-text');
  var stageEl = document.getElementById('stage');
  var stageEmpty = document.getElementById('stage-empty');
  var emptyTitle = document.getElementById('empty-title');
  var expandRemoteBtn = document.getElementById('expand-remote-btn');
  var expandLocalBtn = document.getElementById('expand-local-btn');
  var expandScreenBtn = document.getElementById('expand-screen-btn');
  var shrinkRemoteBtn = document.getElementById('shrink-remote-btn');
  var shrinkLocalBtn = document.getElementById('shrink-local-btn');
  var shrinkScreenBtn = document.getElementById('shrink-screen-btn');
  var fsLocalBtn = document.getElementById('fs-local-btn');
  var fsRemoteBtn = document.getElementById('fs-remote-btn');
  var fsScreenBtn = document.getElementById('fs-screen-btn');
  var tileScreen = document.getElementById('tile-screen');
  var screenVideo = document.getElementById('screen-video');
  var screenTileLabel = document.getElementById('screen-tile-label');
  var presenceText = document.getElementById('presence-text');
  var presencePill = document.getElementById('presence-pill');
  var localTileLabel = document.getElementById('local-tile-label');
  var remoteTileLabel = document.getElementById('remote-tile-label');
  var localAvatarCircle = document.getElementById('local-avatar-circle');
  var remoteAvatarCircle = document.getElementById('remote-avatar-circle');
  var shareBtn = document.getElementById('share-btn');
  var shareBadge = document.getElementById('share-badge');
  var presenceList = document.getElementById('presence-list');
  var presenceListItems = document.getElementById('presence-list-items');
  var incomingAvatar = document.getElementById('incoming-avatar');
  var incomingName = document.getElementById('incoming-name');
  var incomingSub = document.getElementById('incoming-sub');
  var leaveBtn = document.getElementById('leave-btn');

  // Touch detection: on touch devices there is no hover, so we force
  // affordances (expand button etc.) to be fully visible.
  var isTouch = (window.matchMedia && window.matchMedia('(hover: none)').matches) ||
                (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
                ('ontouchstart' in window);
  if (isTouch) document.body.classList.add('is-touch');

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
  var iceSourceLabel = 'fallback';

  var socket = io({ path: '/api/sync', auth: { token: window.__SESSION_KEY } });
  var localStream = null;
  var pc = null;
  var pendingCandidates = [];
  var callState = 'idle';           // idle | calling | ringing | in-call
  var role = 'none';                // 'caller' | 'callee' | 'none'

  // Perfect-negotiation state. Renegotiation only became necessary once a
  // screen share could add tracks mid-call; before that there was exactly
  // one offer/answer per call and glare was impossible.
  var makingOffer = false;
  var ignoreOffer = false;
  var canRenegotiate = false;
  // The callee is the polite peer: on a collision it yields. The roles are
  // already asymmetric here (one side rings, the other answers), so this
  // needs no extra negotiation of its own.
  function isPolite() { return role === 'callee'; }
  var t0 = Date.now();
  var localCandCount = 0;
  var remoteCandCount = 0;
  var wakeLock = null;
  var silentCtx = null;
  var silentOsc = null;
  var wasInCallBeforeHidden = false;
  var hasLocalMedia = false;
  var hasRemoteMedia = false;
  var hasScreenMedia = false;
  var focusMode = 'none'; // 'none' | 'local' | 'remote' | 'screen'

  // Voice-activity detection
  var vadCtx = null;
  var vadLocalSource = null, vadLocalAnalyser = null;
  var vadRemoteSource = null, vadRemoteAnalyser = null;
  var vadRafId = 0;
  var localSpeakingUntil = 0, remoteSpeakingUntil = 0;
  var VAD_THRESHOLD_RMS = 0.05;   // ~-26dB
  var VAD_HANG_MS = 250;          // keep ring on 250ms past last loud sample (hysteresis)

  // ---------- Name + avatar identity ----------
  var myProfile = window.__PROFILE || { id: 'seb', label: 'Seb' };
  var myId = myProfile.id;                 // 'seb' | 'hala' - what the server keys on
  var myName = myProfile.label || 'You';
  var peerName = 'Peer';

  function initialOf(name) {
    var n = (name || '').trim();
    return n ? n.charAt(0).toUpperCase() : '?';
  }
  function colorForName(name) {
    var h = 0;
    var s = String(name || '');
    for (var i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
    return 'hsl(' + (h % 360) + ', 55%, 42%)';
  }
  function applyIdentity() {
    localTileLabel.textContent = myName;
    localAvatarCircle.textContent = initialOf(myName);
    localAvatarCircle.style.background = colorForName(myName);

    remoteTileLabel.textContent = peerName;
    remoteAvatarCircle.textContent = initialOf(peerName);
    remoteAvatarCircle.style.background = colorForName(peerName);

    // Also refresh the incoming-call card with the peer's real identity so
    // it never shows a generic "P" or "Incoming call" placeholder.
    if (incomingAvatar) {
      incomingAvatar.textContent = initialOf(peerName);
      incomingAvatar.style.background = colorForName(peerName);
    }
    if (incomingName) incomingName.textContent = peerName + ' is calling';
    if (incomingSub) incomingSub.textContent = 'Tap to answer';
  }
  applyIdentity();

  // ---------- Role (participant vs observer) ----------
  var myRole = 'participant'; // updated when server sends 'role-assigned'

  // Silent unless explicitly enabled: localStorage.setItem('notes.diag','1')
  var DEBUG = false;
  try { DEBUG = localStorage.getItem('notes.diag') === '1'; } catch (e) {}
  function log() {
    if (!DEBUG) return;
    var args = Array.prototype.slice.call(arguments);
    var elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    args.unshift('[' + role + ' t+' + elapsed + 's]');
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
    callView.classList.toggle('dc-in-call', state === 'in-call');

    refreshStage();

    if (state === 'in-call') {
      acquireWakeLock();
      startSilentKeepalive();
      setupMediaSession();
      lockLandscape();
      armIceTimeout();
      // Make sure the remote audio element is explicitly playing - helps
      // browsers count this page as "playing audio" for background purposes.
      try { remoteAudio.play().catch(function () {}); } catch (e) {}
      emitMediaState();
    } else if (state === 'idle') {
      releaseWakeLock();
      stopSilentKeepalive();
      stopVoiceActivityDetection();
      tearDownMediaSession();
      unlockOrientation();
      resetFocus();
    }
  }

  function refreshStage() {
    tileLocal.hidden = !hasLocalMedia;
    tileRemote.hidden = !hasRemoteMedia;
    // The screen tile exists only while somebody is actually sharing.
    tileScreen.hidden = !hasScreenMedia;
    // Tile count drives the grid layout, so it has to be recomputed here
    // rather than only when a share starts.
    var shown = (hasLocalMedia ? 1 : 0) + (hasRemoteMedia ? 1 : 0) + (hasScreenMedia ? 1 : 0);
    stageEl.setAttribute('data-tiles', String(shown));
    // A focused tile that just disappeared would leave the stage stuck in a
    // focus mode with nothing focused.
    if (focusMode === 'screen' && !hasScreenMedia) setFocus('none');
    if (focusMode === 'remote' && !hasRemoteMedia) setFocus('none');

    var showPresenceList = (callState === 'idle');
    if (presenceList) presenceList.hidden = !showPresenceList;

    // The moment a real peer stream is present, no incoming/waiting/loading
    // text should show. This is the "hide status once connected" guarantee.
    if (hasRemoteMedia) {
      stageEmpty.hidden = true;
      return;
    }

    if (!hasLocalMedia && !hasRemoteMedia && callState === 'idle') {
      stageEmpty.hidden = !!(presenceList && !presenceList.hidden);
      emptyTitle.textContent = 'Getting camera ready...';
    } else if (hasLocalMedia && !hasRemoteMedia && callState !== 'idle') {
      stageEmpty.hidden = false;
      var whom = (peerName && peerName !== 'Peer') ? peerName : 'peer';
      emptyTitle.textContent = callState === 'calling' ? ('Calling ' + whom + '...') : ('Waiting for ' + whom + '...');
    } else {
      stageEmpty.hidden = true;
    }
  }

  function resetFocus() {
    focusMode = 'none';
    resetPipPosition();
    stageEl.classList.remove('dc-focus-local', 'dc-focus-remote');
    expandLocalBtn.hidden = false;
    expandRemoteBtn.hidden = false;
    shrinkLocalBtn.hidden = true;
    shrinkRemoteBtn.hidden = true;
  }

  async function fetchIceConfig() {
    try {
      var r = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (window.__SESSION_KEY || '')
        },
        body: '{}'
      });
      if (!r.ok) { log('ice-config non-ok', r.status); return; }
      var data = await r.json();
      if (data && data.ok && Array.isArray(data.iceServers) && data.iceServers.length) {
        iceServers = data.iceServers;
        iceSourceLabel = data.source || 'unknown';
        log('ice-config loaded source=', data.source, 'servers=', iceServers.length);
      }
    } catch (err) {
      log('ice-config error', err && err.message);
    }
  }

  async function initMedia() {
    setStatus('Loading camera...', 'connecting');
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
      // Mobile Safari/Chrome often will not start the preview from the
      // autoplay attribute alone even with muted+playsinline. Calling
      // play() explicitly (inside the user-gesture-descended async chain)
      // is what actually makes the local preview appear on a phone.
      try { await localVideo.play(); } catch (playErr) {
        log('localVideo.play() rejected:', playErr && playErr.name, playErr && playErr.message);
      }
      hasLocalMedia = true;
      // Reflect the CURRENT camera track state onto the tile (in case it's
      // disabled programmatically later) - starts on.
      tileLocal.classList.remove('dc-cam-off');
      setStatus('Ready to go!', 'ready');
      refreshStage();
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
    // Single choke point for teardown. Three call sites used to assign `pc`
    // and only endCall() closed the old one, so a reconnect mid-call left a
    // dead RTCPeerConnection alive: it kept its camera tracks and, worse,
    // its event handlers kept firing and overwriting the status of the new
    // connection. Close here and nowhere else has to remember.
    if (pc) {
      log('closing previous peer connection before creating a new one');
      try { pc.close(); } catch (e) {}
      pc = null;
    }
    clearIceTimeout();
    pcGeneration++;
    var myGeneration = pcGeneration;
    // Handlers from an older connection must not touch shared UI state.
    var isCurrent = function () { return myGeneration === pcGeneration; };

    var summary = iceServers.map(function (s) {
      return { urls: s.urls, hasAuth: !!(s.username && s.credential) };
    });
    log('createPeerConnection gen=' + myGeneration + ' iceServers=', JSON.stringify(summary));
    var conn = new RTCPeerConnection({ iceServers: iceServers });
    localCandCount = 0;
    remoteCandCount = 0;
    makingOffer = false;
    ignoreOffer = false;
    canRenegotiate = false;
    remoteStreams = Object.create(null);
    remoteScreenStreamId = null;

    var trackCount = 0;
    localStream.getTracks().forEach(function (track) {
      conn.addTrack(track, localStream);
      trackCount++;
      log('addTrack kind=', track.kind, 'label=', track.label, 'enabled=', track.enabled);
    });
    log('added tracks total=', trackCount);

    conn.ontrack = function (e) {
      log('EVENT ontrack kind=', e.track && e.track.kind, 'streams=', e.streams && e.streams.length);
      if (!e.streams || !e.streams[0]) return;
      var stream = e.streams[0];
      remoteStreams[stream.id] = stream;
      // A stream can end up here before OR after the socket message naming
      // it as the screen, so routing is recomputed from scratch either way
      // rather than being decided at arrival time.
      stream.addEventListener('removetrack', function () { routeRemoteStreams(); });
      routeRemoteStreams();
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
      if (!isCurrent()) return;
      log('EVENT iceconnectionstatechange ->', conn.iceConnectionState);
      if (conn.iceConnectionState === 'checking') setStatus('Connecting...', 'connecting');
      else if (conn.iceConnectionState === 'connected' || conn.iceConnectionState === 'completed') setStatus('Connected', 'connected');
      else if (conn.iceConnectionState === 'failed') setStatus('Connection failed', 'error');
      else if (conn.iceConnectionState === 'disconnected') setStatus('Reconnecting...', 'connecting');
    };
    conn.onicegatheringstatechange = function () { log('EVENT icegatheringstatechange ->', conn.iceGatheringState); };
    conn.onsignalingstatechange = function () { log('EVENT signalingstatechange ->', conn.signalingState); };
    conn.onconnectionstatechange = function () {
      if (!isCurrent()) { log('ignoring state from stale gen', myGeneration); return; }
      log('EVENT connectionstatechange ->', conn.connectionState);
      if (conn.connectionState === 'connected') {
        clearIceTimeout();
        iceRetried = false;
        setStatus('Connected', 'connected');
        reportSelectedPair(conn);
      } else if (conn.connectionState === 'failed') {
        clearIceTimeout();
        setStatus('Connection failed', 'error');
      } else if (conn.connectionState === 'disconnected') {
        setStatus('Disconnected', 'error');
      }
    };
    // ---- Renegotiation (perfect negotiation) ----
    // Needed from the moment a screen share adds a second video track: the
    // original flow only ever did one offer/answer at call setup.
    //
    // `canRenegotiate` stays false until the FIRST exchange has completed.
    // Without it, addTrack() during this very function fires
    // negotiationneeded and races the explicit createOffer() in the
    // call-accept handler, producing two offers for one call.
    conn.onnegotiationneeded = async function () {
      log('EVENT negotiationneeded (canRenegotiate=' + canRenegotiate + ')');
      if (!canRenegotiate) return;
      try {
        makingOffer = true;
        await conn.setLocalDescription();
        log('-> emit renegotiation offer');
        socket.emit('signal', { type: 'offer', sdp: conn.localDescription });
      } catch (err) {
        log('renegotiation failed:', err && err.message);
      } finally {
        makingOffer = false;
      }
    };

    return conn;
  }

  // Remote streams, keyed by the id the sender gave them. Which one is the
  // screen is told to us over the socket, because stream ids are the only
  // stable handle both sides agree on.
  var remoteStreams = Object.create(null);
  var remoteScreenStreamId = null;

  function routeRemoteStreams() {
    var ids = Object.keys(remoteStreams);
    var camera = null, screen = null;
    ids.forEach(function (id) {
      var s = remoteStreams[id];
      // A stream whose tracks have all gone is stale (peer stopped sharing).
      if (!s.getTracks().length) { delete remoteStreams[id]; return; }
      if (id === remoteScreenStreamId) screen = s; else camera = s;
    });

    if (camera) {
      if (remoteVideo.srcObject !== camera) {
        remoteVideo.srcObject = camera;
        remoteAudio.srcObject = camera;
        startVoiceActivityDetection(camera);
      }
      hasRemoteMedia = true;
    } else {
      remoteVideo.srcObject = null;
      remoteAudio.srcObject = null;
      hasRemoteMedia = false;
    }

    // The remote screen wins the screen tile over our own local preview:
    // if they are sharing, that is what you want to be looking at.
    if (screen) {
      if (screenVideo.srcObject !== screen) screenVideo.srcObject = screen;
      // Screen audio rides on the screen stream, so this element must not
      // be muted - unlike the local preview, which would echo.
      screenVideo.muted = false;
      screenTileLabel.textContent = peerName + "'s screen";
      hasScreenMedia = true;
      applyPeerVolume(peerVolume);
    } else if (!localScreenStream) {
      screenVideo.srcObject = null;
      hasScreenMedia = false;
    }

    log('routeRemoteStreams camera=' + !!camera + ' screen=' + !!screen);
    refreshStage();
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
    log('startCall clicked, becoming CALLER, sending call-request');
    setCallState('calling');
    var whom = (peerName && peerName !== 'Peer') ? peerName : 'peer';
    setStatus('Calling ' + whom + '...', 'connecting');
    socket.emit('call-request');
  }

  // Briefly show who ended the call before dropping back to the menu.
  var endedToastTimer = 0;
  function showEndedToast(whoName, isSelf) {
    if (!endedToast) return;
    var label = isSelf ? 'You ended the call' : (whoName + ' ended the call');
    endedAvatar.textContent = initialOf(isSelf ? myName : whoName);
    endedAvatar.style.background = colorForName(isSelf ? myName : whoName);
    endedText.textContent = label;
    endedToast.hidden = false;
    log('ended toast:', label);
    if (endedToastTimer) clearTimeout(endedToastTimer);
    endedToastTimer = setTimeout(function () {
      endedToast.hidden = true;
      endedToastTimer = 0;
    }, 2200);
  }

  // endedBy: omit for silent teardown, or pass { name, isSelf } to show the toast.
  async function endCall(notifyPeer, endedBy) {
    if (notifyPeer) socket.emit('call-end');
    if (pc) { try { pc.close(); } catch (e) {} pc = null; }
    remoteVideo.srcObject = null;
    remoteAudio.srcObject = null;
    hasRemoteMedia = false;
    remoteStreams = Object.create(null);
    remoteScreenStreamId = null;
    canRenegotiate = false;
    makingOffer = false;
    pendingCandidates = [];
    role = 'none';
    tileRemote.classList.remove('dc-speaking');
    tileLocal.classList.remove('dc-speaking');
    tileRemote.classList.remove('dc-peer-landscape');
    stopVoiceActivityDetection();
    closeFloatingWindow();
    setCallState('idle');
    setStatus('Ready', 'ready');
    if (endedBy) showEndedToast(endedBy.name, endedBy.isSelf);
  }

  callBtn.addEventListener('click', startCall);
  endBtn.addEventListener('click', function () {
    var wasConnected = (callState === 'in-call');
    endCall(true, wasConnected ? { name: myName, isSelf: true } : null);
  });
  settingsBtn.addEventListener('click', function () { settingsPanel.hidden = !settingsPanel.hidden; });

  leaveBtn.addEventListener('click', function () {
    log('LEAVE button clicked - returning to cover');
    // 1) End any active call cleanly first
    if (callState === 'in-call' || callState === 'calling' || callState === 'ringing') {
      endCall(true);
    }
    // 2) Release local media so the browser tab drops the camera indicator
    if (localStream) {
      try { localStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      localStream = null;
      hasLocalMedia = false;
    }
    if (localVideo) localVideo.srcObject = null;
    // 3) Disconnect socket so we don't stay in presence
    try { socket.disconnect(); } catch (e) {}
    // 4) Hide call view, show cover
    var callViewEl = document.getElementById('workspace-view');
    var notesViewEl = document.getElementById('notes-view');
    if (callViewEl) callViewEl.hidden = true;
    if (notesViewEl) notesViewEl.hidden = false;
    // Clear the unlock token so a re-entry requires the passphrase again
    try { delete window.__SESSION_KEY; } catch (e) { window.__SESSION_KEY = undefined; }
  });

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
    emitMediaState();
  });

  // ---------- MediaSession API ----------
  // Real browsers (Chrome / Safari) treat pages with an active MediaSession
  // more leniently for background audio. This is best-effort - see notes.
  function setupMediaSession() {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: peerName ? 'Call with ' + peerName : 'Private call',
        artist: myName,
        album: 'H Calls'
      });
      navigator.mediaSession.playbackState = 'playing';
      // Provide no-op handlers so the browser knows the app "owns" playback.
      ['play', 'pause', 'stop'].forEach(function (a) {
        try { navigator.mediaSession.setActionHandler(a, function () {}); } catch (e) {}
      });
      log('MediaSession registered');
    } catch (err) { log('MediaSession setup failed', err && err.message); }
  }
  function tearDownMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    } catch (e) {}
  }

  function emitMediaState() {
    var vid = localStream && localStream.getVideoTracks()[0];
    var aud = localStream && localStream.getAudioTracks()[0];
    var state = {
      camera: !!(vid && vid.enabled && vid.readyState === 'live'),
      mic: !!(aud && aud.enabled && aud.readyState === 'live'),
      // Orientation travels as data rather than being inferred from the
      // video's own dimensions: phone cameras often keep producing frames
      // in their native sensor orientation when the device rotates, so the
      // track size alone does not say which way up the person is.
      orientation: currentOrientation()
    };
    socket.emit('media-state', state);
    log('-> emit media-state', JSON.stringify(state));
  }

  function currentOrientation() {
    // Angle-based where available; the aspect of the viewport is a sound
    // fallback and is what desktop browsers report usefully anyway.
    var angle = (screen.orientation && typeof screen.orientation.angle === 'number')
      ? screen.orientation.angle
      : (typeof window.orientation === 'number' ? window.orientation : null);
    if (angle === 90 || angle === -90 || angle === 270) return 'landscape';
    if (angle === 0 || angle === 180) return 'portrait';
    return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
  }

  // Tell the peer as soon as the device turns, not only when a track
  // changes - rotating the phone is exactly the moment it matters.
  function announceOrientation() {
    if (callState === 'in-call') emitMediaState();
  }
  window.addEventListener('orientationchange', function () { setTimeout(announceOrientation, 300); });
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener('change', function () { setTimeout(announceOrientation, 300); });
  }
  window.addEventListener('resize', (function () {
    var t = 0, last = currentOrientation();
    return function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var now = currentOrientation();
        if (now !== last) { last = now; announceOrientation(); }
      }, 300);
    };
  })());

  function refreshPresenceUI(peers) {
    var others = peers.filter(function (p) { return p.id !== socket.id; });
    var otherParticipants = others.filter(function (p) { return p.isParticipant; });

    // Header pill (compact summary)
    if (otherParticipants.length > 0) {
      peerName = otherParticipants[0].name || 'Peer';
      applyIdentity();
      presenceText.textContent = peerName + ' online';
      presencePill.classList.add('dc-presence-online');
      if (callState === 'in-call') setupMediaSession();
    } else {
      presenceText.textContent = others.length ? (others.length + ' waiting') : 'Only you online';
      presencePill.classList.remove('dc-presence-online');
    }

    // Full centered presence list (pre-call)
    presenceListItems.innerHTML = '';
    // Sort: self first, then participants, then observers
    var sorted = peers.slice().sort(function (a, b) {
      if (a.id === socket.id) return -1;
      if (b.id === socket.id) return 1;
      if (a.isParticipant !== b.isParticipant) return a.isParticipant ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    sorted.forEach(function (p) {
      var isMe = p.id === socket.id;
      var li = document.createElement('li');
      li.className = 'dc-presence-item' +
        (p.isParticipant ? '' : ' dc-presence-item-observer') +
        (isMe ? ' dc-presence-item-me' : '');
      var av = document.createElement('span');
      av.className = 'dc-presence-item-avatar';
      av.textContent = initialOf(p.name);
      av.style.background = colorForName(p.name);
      var nm = document.createElement('span');
      nm.className = 'dc-presence-item-name';
      nm.textContent = p.name + (isMe ? ' (you)' : '');
      var badge = document.createElement('span');
      badge.className = 'dc-presence-item-badge';
      badge.textContent = p.isParticipant ? 'in call room' : 'observing';
      li.appendChild(av);
      li.appendChild(nm);
      li.appendChild(badge);

      // Safety net for a session the automatic takeover did not catch.
      if (!isMe) {
        var kick = document.createElement('button');
        kick.type = 'button';
        kick.className = 'dc-presence-item-kick';
        kick.textContent = '✕';
        kick.title = 'Disconnect this session';
        kick.setAttribute('aria-label', 'Disconnect ' + p.name);
        kick.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var ok = window.confirm('Disconnect the session "' + p.name +
            '"? Use this only if a stale session is stuck.');
          if (!ok) return;
          log('kick requested for', p.id, p.name);
          socket.emit('kick', { id: p.id });
        });
        li.appendChild(kick);
      }

      presenceListItems.appendChild(li);
    });

    refreshStage();
  }

  // ---------- ICE watchdog + reconnect teardown ----------
  // A call that signals perfectly but never connects used to sit on
  // "Connecting..." forever: nothing watched for ICE failing to establish.
  var ICE_TIMEOUT_MS = 15000;
  var iceTimer = 0;
  var iceRetried = false;
  var pcGeneration = 0;

  function clearIceTimeout() {
    if (iceTimer) { clearTimeout(iceTimer); iceTimer = 0; }
  }

  function armIceTimeout() {
    clearIceTimeout();
    var gen = pcGeneration;
    iceTimer = setTimeout(function () {
      iceTimer = 0;
      if (gen !== pcGeneration) return;                  // superseded
      if (!pc) return;
      var st = pc.connectionState;
      if (st === 'connected' || st === 'completed') return;

      if (!iceRetried && role === 'caller') {
        // One ICE restart before giving up. Only the caller does this, so
        // the two sides cannot both restart and collide.
        iceRetried = true;
        log('ICE watchdog: still ' + st + ' after ' + ICE_TIMEOUT_MS + 'ms - retrying with an ICE restart');
        setStatus('Reconnecting...', 'connecting');
        tryIceRestart();
        armIceTimeout();
      } else {
        log('ICE watchdog: still ' + st + ' after timeout - giving up');
        setStatus('Connection failed', 'error');
        reportIceOutcome('timeout', st);
      }
    }, ICE_TIMEOUT_MS);
  }

  // ---------- Report the selected candidate pair ----------
  // Tells us whether a call went direct (host/srflx) or through the relay,
  // which is the question we could not answer after the fact.
  async function reportSelectedPair(conn) {
    try {
      var stats = await conn.getStats();
      var pairs = [], locals = {}, remotes = {};
      stats.forEach(function (r) {
        if (r.type === 'candidate-pair') pairs.push(r);
        else if (r.type === 'local-candidate') locals[r.id] = r;
        else if (r.type === 'remote-candidate') remotes[r.id] = r;
      });
      var sel = pairs.find(function (p) { return p.nominated && p.state === 'succeeded'; }) ||
                pairs.find(function (p) { return p.state === 'succeeded'; });
      if (!sel) { log('no selected candidate pair in stats'); return; }

      var L = locals[sel.localCandidateId] || {};
      var R = remotes[sel.remoteCandidateId] || {};
      var info = {
        localType: L.candidateType || '?',
        remoteType: R.candidateType || '?',
        protocol: L.protocol || '?',
        relayProtocol: L.relayProtocol || null,
        localAddress: L.address || null,
        remoteAddress: R.address || null,
        rtt: sel.currentRoundTripTime || null,
        bytesSent: sel.bytesSent || 0,
        bytesReceived: sel.bytesReceived || 0
      };
      log('SELECTED PAIR', JSON.stringify(info));
      socket.emit('call-stats', {
        kind: 'selected-pair',
        role: role,
        iceSource: iceSourceLabel,
        pair: info
      });
    } catch (err) {
      log('reportSelectedPair failed:', err && err.message);
    }
  }

  function reportIceOutcome(outcome, state) {
    try {
      socket.emit('call-stats', {
        kind: 'ice-outcome',
        role: role,
        iceSource: iceSourceLabel,
        outcome: outcome,
        connectionState: state || (pc && pc.connectionState) || 'none'
      });
    } catch (e) {}
  }

  // ---------- Reconnect teardown ----------
  // The socket dropping mid-call almost always means the media path died
  // too. Tear the peer connection down here so the re-dial starts clean
  // instead of reusing or orphaning a dead one.
  socket.on('disconnect', function (reason) {
    log('socket disconnect reason=', reason, 'callState=', callState);
    clearIceTimeout();
    if (pc) {
      log('tearing down peer connection after socket drop');
      try { pc.close(); } catch (e) {}
      pc = null;
      pcGeneration++;          // invalidate the dead connection's handlers
    }
    pendingCandidates = [];
    hasRemoteMedia = false;
    if (callState === 'in-call' || callState === 'calling') {
      setStatus('Reconnecting...', 'connecting');
      refreshStage();
    }
  });

  // ---------- Signaling ----------
  socket.on('connect', function () {
    log('socket connected id=', socket.id);
    socket.emit('hello', { name: myName });
  });
  socket.on('connect_error', function (err) { log('socket connect_error', err && err.message); });

  socket.on('call-request', function (msg) {
    var fromId = msg && msg.fromId;
    var myId = socket.id;
    log('<- call-request from=', fromId, 'myId=', myId, 'state=', callState);

    if (callState === 'in-call') { log('ignoring call-request, already in-call'); return; }

    if (callState === 'calling') {
      log('GLARE detected. tie-break: myId < fromId ->', (myId && fromId) ? (myId < fromId) : '(missing id)');
      if (myId && fromId && myId < fromId) {
        log('GLARE: I win as caller, ignoring peer request; peer should transition to callee');
        return;
      }
      log('GLARE: I lose, cancelling my caller state and transitioning to callee/ringing');
      role = 'callee';
      applyIdentity(); // refresh incoming card in case peerName just became known
      setCallState('ringing');
      setStatus(peerName + ' is calling', 'connecting');
      return;
    }

    if (callState === 'ringing') { log('ignoring duplicate call-request while already ringing'); return; }

    role = 'callee';
    applyIdentity();
    setCallState('ringing');
    setStatus(peerName + ' is calling', 'connecting');
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

  socket.on('call-end', function (msg) {
    var who = (msg && msg.fromName) || peerName || 'Peer';
    log('<- call-end from', who);
    endCall(false, { name: who, isSelf: false });
  });

  socket.on('peer-left', function (msg) {
    // Prefer the server-supplied name (captured before presence was cleared),
    // fall back to the last known peerName rather than a generic label.
    var who = (msg && msg.fromName) || peerName || 'Peer';
    log('<- peer-left', who);
    var wasConnected = (callState === 'in-call');
    endCall(false, wasConnected ? { name: who, isSelf: false } : null);
    setStatus(who + ' left the call', 'error');
  });
  socket.on('room-full', function () { log('<- room-full'); setStatus('Another session is already connected', 'error'); });

  socket.on('presence', function (msg) {
    var peers = (msg && Array.isArray(msg.peers)) ? msg.peers : [];
    log('<- presence peers=', peers.map(function (p) { return p.name + '(' + (p.isParticipant ? 'P' : 'O') + ')'; }).join(', '));
    refreshPresenceUI(peers);
  });

  socket.on('role-assigned', function (msg) {
    var newRole = (msg && msg.role) || 'participant';
    log('<- role-assigned', newRole);
    myRole = newRole;
    callBtn.disabled = (newRole === 'observer');
    callBtn.title = (newRole === 'observer') ? 'Call slot full - you are observing' : 'Call';
    document.body.classList.toggle('is-observer', newRole === 'observer');
    if (newRole === 'observer') {
      setStatus('Observer mode - call slot full', 'connecting');
    } else if (hasLocalMedia) {
      setStatus('Ready to go!', 'ready');
    }
  });

  socket.on('media-state', function (msg) {
    var cameraOn = !!(msg && msg.camera);
    tileRemote.classList.toggle('dc-cam-off', !cameraOn);
    // When they rotate to landscape their frame is wide, so cropping it to
    // a portrait tile throws most of it away. Letterboxing that one tile
    // is the honest thing to do, and it is why the peer sends orientation.
    var peerLandscape = (msg && msg.orientation) === 'landscape';
    tileRemote.classList.toggle('dc-peer-landscape', peerLandscape);
    applyPeerOrientation(peerLandscape);
    log('<- media-state peer camera on =', cameraOn, 'orientation =', msg && msg.orientation);
  });

  // The peer's tile follows their device, independently of our own fit
  // setting. Inline, because applyFitMode also writes objectFit inline and
  // a stylesheet rule could never win against it (see style.css header).
  function applyPeerOrientation(peerLandscape) {
    if (peerLandscape) {
      remoteVideo.style.objectFit = 'contain';
    } else {
      var saved = 'cover';
      try { saved = localStorage.getItem(FIT_KEY) || 'cover'; } catch (e) {}
      remoteVideo.style.objectFit = saved;
    }
  }

  socket.on('signal', async function (payload) {
    if (!payload) return;
    if (payload.type === 'offer') {
      log('<- signal OFFER', summarizeSdp(payload.sdp));
      if (!pc) { log('no PC yet on offer, creating one'); await fetchIceConfig(); pc = createPeerConnection(); }

      // Glare: both sides offered at once. Only possible now that either
      // side can start a screen share and renegotiate unprompted.
      var collision = makingOffer || pc.signalingState !== 'stable';
      ignoreOffer = !isPolite() && collision;
      if (ignoreOffer) { log('OFFER ignored (impolite peer, collision)'); return; }
      if (collision) log('OFFER collision, polite peer rolling back');

      log('SDP: setRemoteDescription(offer) begin');
      // Implicit rollback: setRemoteDescription on a non-stable connection
      // rolls the local offer back for us, so no explicit rollback call.
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
      canRenegotiate = true;
      setCallState('in-call');
    } else if (payload.type === 'answer') {
      log('<- signal ANSWER', summarizeSdp(payload.sdp));
      if (pc) {
        log('SDP: setRemoteDescription(answer) begin');
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        log('SDP: setRemoteDescription(answer) DONE. signaling=', pc.signalingState);
        await flushPendingCandidates();
        canRenegotiate = true;
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

  // ---------- Voice-activity detection ----------
  function ensureVadContext() {
    if (vadCtx) return vadCtx;
    try {
      vadCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) { log('VAD AudioContext failed', err && err.message); vadCtx = null; }
    return vadCtx;
  }

  function attachAnalyser(stream) {
    var ctx = ensureVadContext();
    if (!ctx) return null;
    var audioTracks = stream && stream.getAudioTracks ? stream.getAudioTracks() : [];
    if (!audioTracks.length) return null;
    var src = ctx.createMediaStreamSource(stream);
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    src.connect(analyser); // analyser is a tap - no need to reach destination
    return { source: src, analyser: analyser, buffer: new Uint8Array(analyser.frequencyBinCount) };
  }

  function computeRms(handle) {
    handle.analyser.getByteTimeDomainData(handle.buffer);
    var sum = 0;
    for (var i = 0; i < handle.buffer.length; i++) {
      var v = (handle.buffer[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / handle.buffer.length);
  }

  function startVoiceActivityDetection(remoteStream) {
    // (Re-)attach local
    if (localStream && !vadLocalAnalyser) {
      var lh = attachAnalyser(localStream);
      if (lh) { vadLocalSource = lh.source; vadLocalAnalyser = lh; }
    }
    // Attach remote
    if (remoteStream && !vadRemoteAnalyser) {
      var rh = attachAnalyser(remoteStream);
      if (rh) { vadRemoteSource = rh.source; vadRemoteAnalyser = rh; }
    }
    if (vadRafId) return;
    log('VAD started');
    var tick = function () {
      var now = Date.now();
      if (vadLocalAnalyser) {
        var lRms = computeRms(vadLocalAnalyser);
        if (lRms > VAD_THRESHOLD_RMS) localSpeakingUntil = now + VAD_HANG_MS;
        tileLocal.classList.toggle('dc-speaking', now < localSpeakingUntil);
      }
      if (vadRemoteAnalyser) {
        var rRms = computeRms(vadRemoteAnalyser);
        if (rRms > VAD_THRESHOLD_RMS) remoteSpeakingUntil = now + VAD_HANG_MS;
        tileRemote.classList.toggle('dc-speaking', now < remoteSpeakingUntil);
      }
      vadRafId = requestAnimationFrame(tick);
    };
    vadRafId = requestAnimationFrame(tick);
  }

  function stopVoiceActivityDetection() {
    if (vadRafId) { cancelAnimationFrame(vadRafId); vadRafId = 0; }
    tileLocal.classList.remove('dc-speaking');
    tileRemote.classList.remove('dc-speaking');
    try { if (vadLocalSource) vadLocalSource.disconnect(); } catch (e) {}
    try { if (vadRemoteSource) vadRemoteSource.disconnect(); } catch (e) {}
    vadLocalSource = null; vadRemoteSource = null;
    vadLocalAnalyser = null; vadRemoteAnalyser = null;
    if (vadCtx) { try { vadCtx.close(); } catch (e) {} vadCtx = null; }
    localSpeakingUntil = 0; remoteSpeakingUntil = 0;
    log('VAD stopped');
  }

  // ---------- Focus mode (expand tile, others become PiP) ----------
  // Generalised from the original two-tile version: with a screen share now
  // getting its own tile there can be three, so focus is expressed as a
  // class on each tile rather than as ID-specific stage rules.
  var TILES = [
    { mode: 'local',  el: tileLocal,  expand: expandLocalBtn,  shrink: shrinkLocalBtn },
    { mode: 'remote', el: tileRemote, expand: expandRemoteBtn, shrink: shrinkRemoteBtn },
    { mode: 'screen', el: tileScreen, expand: expandScreenBtn, shrink: shrinkScreenBtn }
  ];

  function setFocus(mode) {
    focusMode = mode;
    // Clear any dragged PiP offset so the new small tile starts at its
    // CSS-anchored corner instead of inheriting the previous tile's position.
    resetPipPosition();
    var focused = (mode !== 'none');
    stageEl.classList.toggle('dc-has-focus', focused);
    // Kept for the few existing rules that still key off these.
    stageEl.classList.toggle('dc-focus-local', mode === 'local');
    stageEl.classList.toggle('dc-focus-remote', mode === 'remote');
    stageEl.classList.toggle('dc-focus-screen', mode === 'screen');
    TILES.forEach(function (t) {
      var isFocused = focused && t.mode === mode;
      t.el.classList.toggle('dc-focused', isFocused);
      t.el.classList.toggle('dc-pip', focused && !isFocused);
      t.expand.hidden = isFocused;
      t.shrink.hidden = !isFocused;
    });
    log('focus mode ->', mode, 'stageClass=', stageEl.className);
  }
  function wireFocusBtn(btn, mode, label) {
    var handler = function (e) {
      log('BUTTON CLICK', label, 'currentMode=', focusMode, 'newMode=', mode, 'target=', e.target && e.target.id);
      e.preventDefault();
      e.stopPropagation();
      setFocus(mode);
    };
    // Register both click and touchend for maximum reliability across
    // devices, particularly iOS Safari where ghost taps can suppress click.
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', function (e) {
      // Prevent the synthetic click that would follow on some browsers,
      // avoiding double-fire, while still handling the tap.
      e.preventDefault();
      handler(e);
    }, { passive: false });
  }
  wireFocusBtn(expandLocalBtn, 'local', 'expand-local');
  wireFocusBtn(expandRemoteBtn, 'remote', 'expand-remote');
  wireFocusBtn(expandScreenBtn, 'screen', 'expand-screen');
  wireFocusBtn(shrinkLocalBtn, 'none', 'shrink-local');
  wireFocusBtn(shrinkRemoteBtn, 'none', 'shrink-remote');
  wireFocusBtn(shrinkScreenBtn, 'none', 'shrink-screen');

  // ---------- Real fullscreen (the whole display, browser chrome included) ----------
  // Distinct from focus mode above, which only redistributes space inside
  // the page. This is the Fullscreen API: the tile element becomes the
  // whole screen, so the tile's label and buttons come with it.
  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  async function toggleFullscreen(tile) {
    if (fsElement()) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch (e) { log('exitFullscreen failed', e && e.message); }
      return;
    }
    try {
      if (tile.requestFullscreen) {
        // navigationUI:'hide' asks Android Chrome to drop its own bars too.
        await tile.requestFullscreen({ navigationUI: 'hide' });
      } else if (tile.webkitRequestFullscreen) {
        tile.webkitRequestFullscreen();
      } else {
        // iOS Safari refuses fullscreen on arbitrary elements but allows it
        // on a <video>. Losing the overlay is better than doing nothing.
        var v = tile.querySelector('video');
        if (v && v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
        setStatus('Fullscreen is not available in this browser', 'error');
        return;
      }
      // Landscape is what you want for a fullscreen video, and the lock is
      // only permitted once fullscreen is actually active - which is why
      // the earlier attempt at call start was refused on desktop.
      if (screen.orientation && screen.orientation.lock) {
        try { await screen.orientation.lock('landscape'); }
        catch (e) { log('fullscreen orientation lock refused:', e && e.name); }
      }
    } catch (err) {
      log('requestFullscreen failed:', err && err.name, err && err.message);
      setStatus('Fullscreen was refused by the browser', 'error');
    }
  }

  function wireFsBtn(btn, tile, label) {
    var handler = function (e) {
      e.preventDefault();
      e.stopPropagation();
      log('BUTTON CLICK', label);
      toggleFullscreen(tile);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', function (e) { e.preventDefault(); handler(e); }, { passive: false });
  }
  wireFsBtn(fsLocalBtn, tileLocal, 'fs-local');
  wireFsBtn(fsRemoteBtn, tileRemote, 'fs-remote');
  wireFsBtn(fsScreenBtn, tileScreen, 'fs-screen');

  function onFullscreenChange() {
    var el = fsElement();
    document.body.classList.toggle('is-fullscreen', !!el);
    [[fsLocalBtn, tileLocal], [fsRemoteBtn, tileRemote], [fsScreenBtn, tileScreen]].forEach(function (pair) {
      var isThisOne = (el === pair[1]);
      pair[0].innerHTML = isThisOne ? ICONS.exitFullscreen : ICONS.fullscreen;
      pair[0].title = isThisOne ? 'Exit fullscreen' : 'Fullscreen';
    });
    if (!el && screen.orientation && screen.orientation.unlock) {
      try { screen.orientation.unlock(); } catch (e) {}
    }
    log('fullscreen ->', el ? el.id : 'none');
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  // ---------- Floating window when you switch tabs (Zoom-style) ----------
  //
  // Document Picture-in-Picture gives a real always-on-top OS window that
  // can hold arbitrary DOM, so it can show BOTH cameras. The older
  // video-element PiP can only ever float one <video>, which is why that
  // is the fallback rather than the primary path.
  //
  // Chromium-only (Chrome/Edge 116+). Firefox and Safari have no
  // equivalent, so on those the feature is simply absent.
  var dpip = window.documentPictureInPicture || null;
  var dpipWindow = null;
  var dpipVideos = [];
  var PIP_KEY = 'notes.view.autopip';
  var autoPipEnabled = true;
  try { autoPipEnabled = localStorage.getItem(PIP_KEY) !== '0'; } catch (e) {}

  function dpipSupported() { return !!(dpip && typeof dpip.requestWindow === 'function'); }

  async function openFloatingWindow() {
    if (!dpipSupported() || dpipWindow || callState !== 'in-call') return;
    try {
      dpipWindow = await dpip.requestWindow({ width: 320, height: 420 });
    } catch (err) {
      // Needs a recent user gesture; a plain tab switch does not always
      // count, so this is expected to fail sometimes and must stay quiet.
      log('document PiP refused:', err && err.name, err && err.message);
      dpipWindow = null;
      return;
    }

    var doc = dpipWindow.document;
    var style = doc.createElement('style');
    style.textContent =
      'html,body{margin:0;height:100%;background:#1e1f22;font-family:system-ui,sans-serif;}' +
      '.w{display:flex;flex-direction:column;gap:6px;height:100%;padding:6px;box-sizing:border-box;}' +
      '.c{position:relative;flex:1 1 0;min-height:0;background:#000;border-radius:8px;overflow:hidden;}' +
      '.c video{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.c.me video{transform:scaleX(-1);}' +
      '.l{position:absolute;left:6px;bottom:6px;font-size:11px;color:#fff;background:rgba(0,0,0,.55);' +
      'padding:2px 6px;border-radius:4px;}';
    doc.head.appendChild(style);

    var wrap = doc.createElement('div');
    wrap.className = 'w';
    dpipVideos = [];

    // Cloned elements, never the originals: moving the page's own <video>
    // into the PiP document would blank the tile behind it.
    function addPane(srcVideo, label, mine, muted) {
      if (!srcVideo.srcObject) return;
      var cell = doc.createElement('div');
      cell.className = 'c' + (mine ? ' me' : '');
      var v = doc.createElement('video');
      v.autoplay = true;
      v.playsInline = true;
      v.muted = muted;
      v.srcObject = srcVideo.srcObject;
      var l = doc.createElement('div');
      l.className = 'l';
      l.textContent = label;
      cell.appendChild(v);
      cell.appendChild(l);
      wrap.appendChild(cell);
      dpipVideos.push(v);
    }

    addPane(remoteVideo, peerName, false, true);   // audio keeps playing from the main page
    addPane(screenVideo, screenTileLabel.textContent, false, true);
    addPane(localVideo, myName, true, true);
    doc.body.appendChild(wrap);

    // Clicking the floating window brings you back to the conversation.
    doc.body.addEventListener('click', function () {
      try { window.focus(); } catch (e) {}
      closeFloatingWindow();
    });

    dpipWindow.addEventListener('pagehide', function () {
      dpipVideos = [];
      dpipWindow = null;
      log('document PiP closed');
    });
    log('document PiP opened with', dpipVideos.length, 'panes');
  }

  function closeFloatingWindow() {
    if (!dpipWindow) return;
    try { dpipWindow.close(); } catch (e) {}
    dpipWindow = null;
    dpipVideos = [];
  }

  document.addEventListener('visibilitychange', function () {
    if (!autoPipEnabled || !dpipSupported()) return;
    if (document.visibilityState === 'hidden') {
      if (callState === 'in-call') openFloatingWindow();
    } else {
      closeFloatingWindow();
    }
  });

  // The toggle is only shown where the feature can actually work, rather
  // than offering a switch that does nothing on Firefox or a phone.
  (function initAutoPip() {
    var row = document.getElementById('autopip-row');
    var toggle = document.getElementById('autopip-toggle');
    if (!row || !toggle) return;
    if (!dpipSupported()) return;
    row.hidden = false;
    toggle.checked = autoPipEnabled;
    toggle.addEventListener('change', function () {
      autoPipEnabled = toggle.checked;
      try { localStorage.setItem(PIP_KEY, autoPipEnabled ? '1' : '0'); } catch (e) {}
      if (!autoPipEnabled) closeFloatingWindow();
      log('auto floating window ->', autoPipEnabled);
    });
  })();

  // ---------- Video fit mode (cover / contain / fill) ----------
  var FIT_KEY = 'notes.view.fit';
  function applyFitMode(mode) {
    var valid = (mode === 'cover' || mode === 'contain' || mode === 'fill') ? mode : 'cover';
    // Applied to BOTH camera tiles so local and remote stay consistent.
    // The screen tile is deliberately excluded: a cropped screen is
    // unreadable, so it is always 'contain' (owned by CSS, which can win
    // there precisely because nothing writes it inline).
    localVideo.style.objectFit = valid;
    // A peer in landscape overrides the preference for their tile only -
    // otherwise selecting 'cover' would re-crop the rotated frame that
    // applyPeerOrientation just letterboxed.
    if (tileRemote.classList.contains('dc-peer-landscape')) {
      remoteVideo.style.objectFit = 'contain';
    } else {
      remoteVideo.style.objectFit = valid;
    }
    // 'contain' letterboxes, so the black bars should read as intentional.
    tileLocal.classList.toggle('dc-fit-contain', valid === 'contain');
    tileRemote.classList.toggle('dc-fit-contain', valid === 'contain');
    log('video fit ->', valid);
  }
  (function initFitMode() {
    var saved = 'cover';
    try { saved = localStorage.getItem(FIT_KEY) || 'cover'; } catch (e) {}
    fitSelect.value = saved;
    applyFitMode(saved);
  })();
  fitSelect.addEventListener('change', function () {
    var v = fitSelect.value;
    try { localStorage.setItem(FIT_KEY, v); } catch (e) {}
    applyFitMode(v);
  });

  // ---------- Draggable picture-in-picture tile ----------
  // Pointer Events cover mouse + touch + pen in one code path, so we do not
  // need separate mousedown/touchstart handling.
  var pipDrag = { active: false, id: null, startX: 0, startY: 0, originX: 0, originY: 0, el: null };

  // With three tiles a focused stage can have two PiPs, so "the" PiP tile
  // is now whichever one a pointer actually landed on.
  function pipTiles() {
    if (focusMode === 'none') return [];
    return TILES.filter(function (t) { return !t.el.hidden && t.el.classList.contains('dc-pip'); })
                .map(function (t) { return t.el; });
  }

  function pipTileAt(target) {
    var list = pipTiles();
    for (var i = 0; i < list.length; i++) {
      if (list[i].contains(target)) return list[i];
    }
    return null;
  }

  // Kept for callers that just need "a" PiP (the viewport-flip re-clamp).
  function pipTile() {
    var list = pipTiles();
    return list.length ? list[0] : null;
  }

  function clampPipIntoView(el, x, y) {
    // The PiP is position:absolute inside .dc-stage (position:relative), so
    // left/top are measured against the stage's padding box. clientWidth/
    // clientHeight are exactly that box, and offsetWidth/offsetHeight are
    // the element's unscaled layout size - keeping both in the same
    // coordinate space is what makes the clamp exact.
    var maxX = stageEl.clientWidth - el.offsetWidth;
    var maxY = stageEl.clientHeight - el.offsetHeight;
    return {
      x: Math.max(0, Math.min(x, Math.max(0, maxX))),
      y: Math.max(0, Math.min(y, Math.max(0, maxY)))
    };
  }

  function setPipPosition(el, x, y) {
    var p = clampPipIntoView(el, x, y);
    // Switch from the CSS bottom/right anchoring to explicit left/top.
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }

  function resetPipPosition() {
    [tileLocal, tileRemote, tileScreen].forEach(function (el) {
      el.style.left = '';
      el.style.top = '';
      el.style.right = '';
      el.style.bottom = '';
      el.classList.remove('dc-pip-dragging');
    });
  }

  function onPipPointerDown(e) {
    // Only start a drag when the press actually lands on a small tile,
    // and never when it lands on one of its buttons.
    var el = pipTileAt(e.target);
    if (!el) return;
    if (e.target.closest && e.target.closest('.dc-tile-expand, .dc-tile-shrink, .dc-tile-fs')) return;

    pipDrag.active = true;
    pipDrag.id = e.pointerId;
    pipDrag.el = el;
    pipDrag.startX = e.clientX;
    pipDrag.startY = e.clientY;
    // offsetLeft/offsetTop are relative to the stage (the offsetParent),
    // matching the coordinate space clampPipIntoView works in.
    pipDrag.originX = el.offsetLeft;
    pipDrag.originY = el.offsetTop;
    el.classList.add('dc-pip-dragging');
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    log('PiP drag start at', pipDrag.originX, pipDrag.originY);
  }

  function onPipPointerMove(e) {
    if (!pipDrag.active || e.pointerId !== pipDrag.id || !pipDrag.el) return;
    e.preventDefault();
    var dx = e.clientX - pipDrag.startX;
    var dy = e.clientY - pipDrag.startY;
    setPipPosition(pipDrag.el, pipDrag.originX + dx, pipDrag.originY + dy);
  }

  function onPipPointerUp(e) {
    if (!pipDrag.active || e.pointerId !== pipDrag.id) return;
    if (pipDrag.el) {
      pipDrag.el.classList.remove('dc-pip-dragging');
      try { pipDrag.el.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    log('PiP drag end');
    pipDrag.active = false;
    pipDrag.id = null;
    pipDrag.el = null;
  }

  stageEl.addEventListener('pointerdown', onPipPointerDown);
  stageEl.addEventListener('pointermove', onPipPointerMove, { passive: false });
  stageEl.addEventListener('pointerup', onPipPointerUp);
  stageEl.addEventListener('pointercancel', onPipPointerUp);

  // Keep the PiP on-screen if the window/stage is resized mid-call.
  window.addEventListener('resize', function () {
    var el = pipTile();
    if (!el || !el.style.left) return;
    setPipPosition(el, el.offsetLeft, el.offsetTop);
  });

  // ---------- Landscape orientation during a call ----------
  // Both devices are Android, so the lock API is worth trying. Firefox
  // mobile does not implement it, hence the try/catch and the passive
  // fallback: the CSS media query reorganises the layout anyway if the
  // user just turns the phone themselves.
  var orientationLocked = false;

  async function lockLandscape() {
    if (!screen.orientation || typeof screen.orientation.lock !== 'function') {
      log('orientation.lock unavailable - relying on the media query');
      return;
    }
    try {
      await screen.orientation.lock('landscape');
      orientationLocked = true;
      log('orientation locked to landscape');
    } catch (err) {
      // Common and harmless: unsupported, or the browser requires
      // fullscreen first. The media query still handles a manual rotate.
      log('orientation lock refused:', err && err.name, err && err.message);
    }
  }

  function unlockOrientation() {
    if (!orientationLocked || !screen.orientation || typeof screen.orientation.unlock !== 'function') return;
    try { screen.orientation.unlock(); log('orientation unlocked'); } catch (e) {}
    orientationLocked = false;
  }

  // Passive path: re-clamp the PiP whenever the viewport flips, so a tile
  // that was dragged somewhere cannot end up off-screen after rotating.
  function onViewportFlip() {
    pipTiles().forEach(function (el) {
      if (el.style.left) setPipPosition(el, el.offsetLeft, el.offsetTop);
    });
  }
  window.addEventListener('orientationchange', function () { setTimeout(onViewportFlip, 250); });
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener('change', function () { setTimeout(onViewportFlip, 250); });
  }

  // ---------- Chat ----------
  var chatPanel = document.getElementById('chat-panel');
  var chatLog = document.getElementById('chat-log');
  var chatInput = document.getElementById('chat-input');
  var chatSend = document.getElementById('chat-send');
  var chatBtn = document.getElementById('chat-btn');
  var chatClose = document.getElementById('chat-close');
  var chatImageBtn = document.getElementById('chat-image-btn');
  var chatAudioBtn = document.getElementById('chat-audio-btn');
  var chatFile = document.getElementById('chat-file');
  var unreadDot = document.getElementById('unread-dot');
  var lightbox = document.getElementById('chat-lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var profileBtn = document.getElementById('profile-btn');
  var chatToasts = document.getElementById('chat-toasts');
  var typingIndicator = document.getElementById('typing-indicator');
  var typingWho = document.getElementById('typing-who');

  var historyLoaded = false;
  var renderedKeys = Object.create(null);

  function authHeaders(extra) {
    var h = { 'Authorization': 'Bearer ' + (window.__SESSION_KEY || '') };
    if (extra) { for (var k in extra) h[k] = extra[k]; }
    return h;
  }
  function mediaUrl(id) {
    return '/api/media/' + encodeURIComponent(id) + '?k=' + encodeURIComponent(window.__SESSION_KEY || '');
  }
  function timeLabel(ts) {
    return new Date(ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Day separators: "Today" and "Yesterday" are what you actually want to
  // read; anything older gets a real date.
  function dayKey(ts) {
    var d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  }
  function dayLabel(ts) {
    var d = new Date(ts || Date.now());
    var today = new Date();
    var yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (dayKey(d.getTime()) === dayKey(today.getTime())) return 'Today';
    if (dayKey(d.getTime()) === dayKey(yesterday.getTime())) return 'Yesterday';
    var sameYear = d.getFullYear() === today.getFullYear();
    return d.toLocaleDateString([], sameYear
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' });
  }
  // Correlation is by client-generated id, never by timestamp: the server
  // stamps its own clock, so the two never match.
  function msgKey(m) {
    if (m.id) return 'id|' + m.id;
    if (m.cid) return 'cid|' + m.cid;
    return m.sender + '|' + m.timestamp + '|' + String(m.content).slice(0, 40);
  }

  function renderMessage(m, pending) {
    var key = msgKey(m);
    if (renderedKeys[key]) return renderedKeys[key];

    var wrap = document.createElement('div');
    wrap.className = 'dc-msg ' + (m.sender === myId ? 'dc-msg-mine' : 'dc-msg-theirs');
    if (pending) wrap.classList.add('dc-msg-pending');

    if (m.type === 'image') {
      var img = document.createElement('img');
      img.className = 'dc-msg-image';
      img.src = mediaUrl(m.content);
      img.alt = 'image';
      img.addEventListener('click', function () {
        lightboxImg.src = img.src;
        lightbox.hidden = false;
      });
      wrap.appendChild(img);
    } else if (m.type === 'audio') {
      var audio = document.createElement('audio');
      audio.className = 'dc-msg-audio';
      audio.controls = true;
      audio.preload = 'none';
      audio.src = mediaUrl(m.content);
      wrap.appendChild(audio);
    } else {
      var bubble = document.createElement('div');
      bubble.className = 'dc-msg-bubble';
      bubble.textContent = m.content;   // textContent, never innerHTML
      wrap.appendChild(bubble);
    }

    var meta = document.createElement('div');
    meta.className = 'dc-msg-time';
    var timeSpan = document.createElement('span');
    timeSpan.textContent = timeLabel(m.timestamp);
    meta.appendChild(timeSpan);
    // Receipts only make sense on our own messages - we already know we
    // read theirs.
    if (m.sender === myId) {
      var ticks = document.createElement('span');
      ticks.className = 'dc-msg-ticks';
      ticks.textContent = pending ? '·' : '✓';   // middot while in flight, then one tick
      ticks.title = pending ? 'Sending' : 'Delivered';
      meta.appendChild(ticks);
      wrap.dataset.ts = String(m.timestamp || Date.now());
    }
    wrap.appendChild(meta);

    var empty = chatLog.querySelector('.dc-chat-empty');
    if (empty && empty.parentNode) empty.parentNode.removeChild(empty);

    // Day separator, inserted only when the day actually changes.
    var thisDay = dayKey(m.timestamp);
    if (lastRenderedDay !== thisDay) {
      lastRenderedDay = thisDay;
      var sep = document.createElement('div');
      sep.className = 'dc-day-sep';
      var sepText = document.createElement('span');
      sepText.textContent = dayLabel(m.timestamp);
      sep.appendChild(sepText);
      chatLog.appendChild(sep);
    }

    chatLog.appendChild(wrap);
    chatLog.scrollTop = chatLog.scrollHeight;
    renderedKeys[key] = wrap;
    if (m.cid) renderedKeys['cid|' + m.cid] = wrap;
    if (m.sender === myId) applySeenUpTo(peerSeenUpTo);
    return wrap;
  }

  // ---------- Read receipts ----------
  var peerSeenUpTo = 0;    // newest timestamp of OURS that the peer has seen
  var mySeenUpTo = 0;      // newest timestamp of THEIRS that we have seen
  var lastRenderedDay = null;

  function applySeenUpTo(ts) {
    peerSeenUpTo = Math.max(peerSeenUpTo || 0, ts || 0);
    if (!peerSeenUpTo) return;
    var mine = chatLog.querySelectorAll('.dc-msg-mine[data-ts]');
    for (var i = 0; i < mine.length; i++) {
      var el = mine[i];
      if (el.classList.contains('dc-msg-pending') || el.classList.contains('dc-msg-failed')) continue;
      var seen = Number(el.dataset.ts) <= peerSeenUpTo;
      el.classList.toggle('dc-msg-seen', seen);
      var t = el.querySelector('.dc-msg-ticks');
      if (t) {
        t.textContent = seen ? '✓✓' : '✓';
        t.title = seen ? 'Seen' : 'Delivered';
      }
    }
  }

  // Only report as seen what we could actually have read: the panel is
  // open AND the tab is in front. Marking messages read behind a closed
  // panel would make the receipt a lie.
  function reportSeen() {
    if (chatPanel.hidden || document.visibilityState !== 'visible') return;
    if (!mySeenUpTo) return;
    socket.emit('chat-seen', { sender: myId, upTo: mySeenUpTo });
    log('-> chat-seen upTo', mySeenUpTo);
  }

  socket.on('chat-seen', function (msg) {
    if (!msg || msg.sender === myId) return;
    log('<- chat-seen upTo', msg.upTo);
    applySeenUpTo(Number(msg.upTo) || 0);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') reportSeen();
  });

  function settle(m) {
    // A message we already drew optimistically has come back from the server.
    if (!m.cid) return false;
    var prov = renderedKeys['cid|' + m.cid];
    if (!prov) return false;
    prov.classList.remove('dc-msg-pending');
    // The server's clock is authoritative, so the receipt comparison has to
    // use its timestamp rather than the optimistic local one.
    if (m.timestamp) prov.dataset.ts = String(m.timestamp);
    var t = prov.querySelector('.dc-msg-ticks');
    if (t && !prov.classList.contains('dc-msg-seen')) {
      t.textContent = '✓';
      t.title = 'Delivered';
    }
    renderedKeys[msgKey(m)] = prov;
    applySeenUpTo(peerSeenUpTo);
    return true;
  }

  async function loadHistory() {
    if (historyLoaded) return;
    historyLoaded = true;
    try {
      var r = await fetch('/api/history', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: '{}'
      });
      var data = await r.json();
      (data.messages || []).forEach(function (m) {
        renderMessage(m, false);
        // Loading history means we have now seen everything in it.
        if (m.sender !== myId) mySeenUpTo = Math.max(mySeenUpTo, Number(m.timestamp) || 0);
      });
      if (!chatLog.children.length) {
        var e = document.createElement('div');
        e.className = 'dc-chat-empty';
        e.textContent = 'No messages yet.';
        chatLog.appendChild(e);
      }
    } catch (err) {
      log('history load failed', err && err.message);
      historyLoaded = false;
      // Say so rather than showing an unexplained empty panel. Live
      // messages still work over the socket; only stored history is down.
      if (!chatLog.children.length) {
        var w = document.createElement('div');
        w.className = 'dc-chat-empty';
        w.textContent = 'History unavailable - new messages will still arrive.';
        chatLog.appendChild(w);
      }
    }
  }

  function openChat() {
    chatPanel.hidden = false;
    unreadDot.hidden = true;
    // Opening the panel is the moment their messages are actually seen.
    loadHistory().then(reportSeen, reportSeen);
    reportSeen();
    setTimeout(function () { chatInput.focus(); }, 50);
  }
  chatBtn.addEventListener('click', function () {
    if (chatPanel.hidden) openChat(); else chatPanel.hidden = true;
  });
  chatClose.addEventListener('click', function () {
    chatPanel.hidden = true;
    clearTimeout(typingSendTimer);
    sendTyping(false);
  });
  lightbox.addEventListener('click', function () { lightbox.hidden = true; lightboxImg.src = ''; });

  function sendText() {
    var text = (chatInput.value || '').trim();
    if (!text) return;
    var cid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    renderMessage({ sender: myId, type: 'text', content: text, timestamp: Date.now(), cid: cid }, true);
    socket.emit('chat-send', { sender: myId, text: text, cid: cid });
    chatInput.value = '';
    chatInput.style.height = '';
    clearTimeout(typingSendTimer);
    sendTyping(false);
  }
  chatSend.addEventListener('click', sendText);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  });
  chatInput.addEventListener('input', function () {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';

    if (chatInput.value.trim()) {
      sendTyping(true);
      // Stop 1.5s after the last keystroke, not on a timer from the first.
      clearTimeout(typingSendTimer);
      typingSendTimer = setTimeout(function () { sendTyping(false); }, 1500);
    } else {
      clearTimeout(typingSendTimer);
      sendTyping(false);
    }
  });
  chatInput.addEventListener('blur', function () {
    clearTimeout(typingSendTimer);
    sendTyping(false);
  });

  socket.on('chat-message', function (m) {
    if (!m) return;
    if (m.sender === myId && settle(m)) return;   // our own echo
    renderMessage(m, false);
    if (m.sender !== myId) {
      // They are clearly done typing if a message arrived.
      hideTyping();
      mySeenUpTo = Math.max(mySeenUpTo, Number(m.timestamp) || Date.now());
      if (chatPanel.hidden) {
        unreadDot.hidden = false;
        showChatToast(m);
      } else {
        reportSeen();
      }
    }
  });

  // ---------- Corner toast for messages arriving with the panel closed ----------
  function toastPreview(m) {
    if (m.type === 'image') return 'Sent a photo';
    if (m.type === 'audio') return 'Sent a voice note';
    var t = String(m.content || '');
    return t.length > 90 ? t.slice(0, 89) + '…' : t;
  }

  function showChatToast(m) {
    if (!chatToasts) return;
    var el = document.createElement('div');
    el.className = 'dc-toast';

    var av = document.createElement('div');
    av.className = 'dc-toast-avatar';
    av.textContent = initialOf(peerName);
    av.style.background = colorForName(peerName);
    el.appendChild(av);

    var body = document.createElement('div');
    body.className = 'dc-toast-body';
    var who = document.createElement('div');
    who.className = 'dc-toast-who';
    who.textContent = peerName;
    var txt = document.createElement('div');
    txt.className = 'dc-toast-text';
    txt.textContent = toastPreview(m);   // textContent, never innerHTML
    body.appendChild(who);
    body.appendChild(txt);
    el.appendChild(body);

    // Clicking the toast is the fast path to the conversation.
    el.addEventListener('click', function () {
      openChat();
      dismissToast(el);
    });

    chatToasts.appendChild(el);
    // Cap the stack so a burst cannot cover the call.
    while (chatToasts.children.length > 3) chatToasts.removeChild(chatToasts.firstChild);
    setTimeout(function () { dismissToast(el); }, 5000);
  }

  function dismissToast(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('dc-toast-out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
  }

  // ---------- Typing indicator ----------
  var typingSendTimer = 0;
  var typingClearTimer = 0;
  var lastTypingSent = 0;

  function sendTyping(on) {
    // Throttled: one "typing" ping per 2s while keys are flowing, and an
    // immediate "stopped" so the dots never stick.
    var now = Date.now();
    if (on && now - lastTypingSent < 2000) return;
    lastTypingSent = on ? now : 0;
    socket.emit('chat-typing', { sender: myId, typing: on });
  }

  function showTyping() {
    typingWho.textContent = peerName;
    typingIndicator.hidden = false;
    chatLog.scrollTop = chatLog.scrollHeight;
    // Safety net: if their "stopped" ping is lost, the dots still go away.
    clearTimeout(typingClearTimer);
    typingClearTimer = setTimeout(hideTyping, 6000);
  }
  function hideTyping() {
    clearTimeout(typingClearTimer);
    typingIndicator.hidden = true;
  }

  socket.on('chat-typing', function (msg) {
    if (!msg || msg.sender === myId) return;
    if (msg.typing) showTyping(); else hideTyping();
  });
  socket.on('chat-stored', function (m) { if (m) settle(m); });
  socket.on('chat-store-failed', function (info) {
    // Delivered live but not persisted: mark it so it is not mistaken for
    // part of the permanent history.
    if (!info || !info.cid) return;
    var el = renderedKeys['cid|' + info.cid];
    if (el) { el.classList.remove('dc-msg-pending'); el.classList.add('dc-msg-failed'); }
  });

  // --- images: downscale before upload so we do not burn VM disk ---
  chatImageBtn.addEventListener('click', function () { chatFile.click(); });
  chatFile.addEventListener('change', async function () {
    var file = chatFile.files && chatFile.files[0];
    chatFile.value = '';
    if (!file) return;
    try {
      var blob = await compressImage(file, 1280, 0.82);
      await uploadMedia(blob, 'image', 'image/jpeg');
    } catch (err) {
      log('image upload failed', err && err.message);
      setStatus('Could not send image', 'error');
    }
  });

  function compressImage(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var cw = Math.round(img.width * scale), ch = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
        canvas.toBlob(function (blob) {
          blob ? resolve(blob) : reject(new Error('encode failed'));
        }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
      img.src = url;
    });
  }

  async function uploadMedia(blob, kind, mime) {
    var q = '?sender=' + encodeURIComponent(myId) + '&kind=' + kind + '&mime=' + encodeURIComponent(mime);
    var r = await fetch('/api/media' + q, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/octet-stream' }),
      body: blob
    });
    if (!r.ok) throw new Error('upload HTTP ' + r.status);
    return r.json();   // the server broadcasts chat-message itself
  }

  // --- voice notes: hold to record, release to send ---
  var recorder = null, recChunks = [], recStream = null;

  async function startRecording() {
    if (recorder) return;
    try {
      recStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (err) { setStatus('Mic permission needed', 'error'); return; }
    var mime = (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
      ? 'audio/webm;codecs=opus' : 'audio/webm';
    recChunks = [];
    try {
      recorder = new MediaRecorder(recStream, { mimeType: mime, audioBitsPerSecond: 32000 });
    } catch (err) {
      recorder = new MediaRecorder(recStream);
    }
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) recChunks.push(e.data); };
    recorder.start();
    chatAudioBtn.classList.add('is-recording');
  }

  async function stopRecording(send) {
    if (!recorder) return;
    var rec = recorder, stream = recStream;
    recorder = null; recStream = null;
    chatAudioBtn.classList.remove('is-recording');
    await new Promise(function (resolve) { rec.onstop = resolve; try { rec.stop(); } catch (e) { resolve(); } });
    try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    if (!send || !recChunks.length) { recChunks = []; return; }
    var blob = new Blob(recChunks, { type: 'audio/webm' });
    recChunks = [];
    if (blob.size < 1200) return;   // a stray tap, not a voice note
    try { await uploadMedia(blob, 'audio', 'audio/webm'); }
    catch (err) { log('audio upload failed', err && err.message); setStatus('Could not send audio', 'error'); }
  }

  chatAudioBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); startRecording(); });
  chatAudioBtn.addEventListener('pointerup', function () { stopRecording(true); });
  chatAudioBtn.addEventListener('pointerleave', function () { if (recorder) stopRecording(false); });
  chatAudioBtn.addEventListener('pointercancel', function () { if (recorder) stopRecording(false); });

  // --- switch profile (someone opening the site on another device) ---
  profileBtn.addEventListener('click', function () {
    if (typeof window.__pickProfile !== 'function') return;
    window.__pickProfile(function (p) {
      myProfile = p; myId = p.id; myName = p.label;
      applyIdentity();
      socket.emit('hello', { name: myName });
      // Redraw the log so the mine/theirs sides swap correctly.
      chatLog.innerHTML = '';
      renderedKeys = Object.create(null);
      historyLoaded = false;
      // Receipts and day separators are per-identity state too, so they
      // have to be reset with the log or the redraw inherits stale ticks.
      lastRenderedDay = null;
      peerSeenUpTo = 0;
      mySeenUpTo = 0;
      if (!chatPanel.hidden) loadHistory();
      log('profile switched to', p.id);
    });
  });

  // ---------- Session replaced by a newer one ----------
  // The server evicts an older socket when the same identity reconnects.
  // Say so plainly instead of leaving a tab that silently stopped working.
  socket.on('session-replaced', function (msg) {
    var reason = (msg && msg.reason) || 'replaced by a newer session';
    log('session replaced:', reason);
    // socket.io does not auto-reconnect after a server-side disconnect, but
    // be explicit so this tab cannot race the new one for the identity.
    try { socket.disconnect(); } catch (e) {}
    try { if (localStream) localStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}

    var el = document.createElement('div');
    el.className = 'dc-replaced';
    el.innerHTML =
      '<div class="dc-replaced-card">' +
      '  <div class="dc-replaced-title">Session taken over</div>' +
      '  <div class="dc-replaced-body">This tab was ' + reason +
      '. Only one session per person can be active at a time.</div>' +
      '  <button type="button">Back to notes</button>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('button').addEventListener('click', function () {
      window.location.reload();
    });
  });

  // ---------- Per-participant local volume ----------
  // Purely local playback level: it changes the <audio>/<video> element's
  // volume and sends nothing over the connection.
  var VOLUME_KEY = 'notes.volume.peer';
  var peerVolume = 1;
  try {
    var savedVol = parseFloat(localStorage.getItem(VOLUME_KEY));
    if (!isNaN(savedVol) && savedVol >= 0 && savedVol <= 1) peerVolume = savedVol;
  } catch (e) {}

  function applyPeerVolume(v) {
    peerVolume = Math.max(0, Math.min(1, v));
    remoteAudio.volume = peerVolume;
    // The video element carries the same stream; keep it in step so the
    // level does not depend on which element the browser actually plays.
    try { remoteVideo.volume = peerVolume; } catch (e) {}
    // A shared screen can carry its own audio on a separate stream, so it
    // needs the same level - but only when it is THEIR screen. Our own
    // preview stays muted or we would echo ourselves.
    try { if (!localScreenStream) screenVideo.volume = peerVolume; } catch (e) {}
    try { localStorage.setItem(VOLUME_KEY, String(peerVolume)); } catch (e) {}
  }
  applyPeerVolume(peerVolume);

  var volumePopover = null;
  function closeVolumePopover() {
    if (!volumePopover) return;
    volumePopover.remove();
    volumePopover = null;
    document.removeEventListener('pointerdown', onOutsideVolume, true);
  }
  function onOutsideVolume(e) {
    if (volumePopover && !volumePopover.contains(e.target)) closeVolumePopover();
  }

  function openVolumePopover(x, y) {
    closeVolumePopover();
    var pop = document.createElement('div');
    pop.className = 'dc-volume';
    pop.innerHTML =
      '<div class="dc-volume-title"><span id="vol-name"></span>' +
      '<span class="dc-volume-value" id="vol-val"></span></div>' +
      '<input type="range" min="0" max="100" step="1" id="vol-range" />';
    document.body.appendChild(pop);

    var nameEl = pop.querySelector('#vol-name');
    var valEl = pop.querySelector('#vol-val');
    var range = pop.querySelector('#vol-range');
    nameEl.textContent = peerName + ' volume';
    range.value = Math.round(peerVolume * 100);

    function paint() {
      var pct = parseInt(range.value, 10);
      valEl.textContent = pct === 0 ? 'Muted' : pct + '%';
      valEl.classList.toggle('dc-volume-muted', pct === 0);
    }
    paint();
    range.addEventListener('input', function () {
      applyPeerVolume(parseInt(range.value, 10) / 100);
      paint();
    });

    // Keep it on screen regardless of where the press landed.
    var r = pop.getBoundingClientRect();
    var px = Math.min(Math.max(8, x), window.innerWidth - r.width - 8);
    var py = Math.min(Math.max(8, y), window.innerHeight - r.height - 8);
    pop.style.left = px + 'px';
    pop.style.top = py + 'px';

    volumePopover = pop;
    // Defer so the press that opened it does not immediately close it.
    setTimeout(function () {
      document.addEventListener('pointerdown', onOutsideVolume, true);
    }, 0);
  }

  // Desktop: right-click. Mobile: long-press. Only on the remote tile -
  // your own playback is muted on purpose to avoid echo, so a slider there
  // would do nothing.
  tileRemote.addEventListener('contextmenu', function (e) {
    if (!hasRemoteMedia) return;
    e.preventDefault();
    openVolumePopover(e.clientX, e.clientY);
  });

  var pressTimer = 0, pressX = 0, pressY = 0;
  tileRemote.addEventListener('pointerdown', function (e) {
    if (!hasRemoteMedia) return;
    if (e.target.closest && e.target.closest('.dc-tile-expand, .dc-tile-shrink')) return;
    pressX = e.clientX; pressY = e.clientY;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(function () { openVolumePopover(pressX, pressY); }, 550);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
    tileRemote.addEventListener(evt, function () { clearTimeout(pressTimer); });
  });
  tileRemote.addEventListener('pointermove', function (e) {
    // A drag is not a long-press.
    if (Math.abs(e.clientX - pressX) > 10 || Math.abs(e.clientY - pressY) > 10) clearTimeout(pressTimer);
  });

  // Re-apply the chosen level whenever a new remote stream arrives.
  socket.on('peer-joined', function () { applyPeerVolume(peerVolume); });

  // ---------- Screen sharing ----------
  //
  // The share is an ADDITIONAL track on its own MediaStream, not a
  // replacement for the camera. The earlier replaceTrack approach needed no
  // renegotiation, which is why it was chosen, but it meant the person
  // sharing vanished from the call - you got their screen instead of their
  // face. Adding a track costs one renegotiation and gives three tiles.
  var isSharing = false;
  var localScreenStream = null;
  var screenSenders = [];   // senders we added, so we can remove exactly those

  // Mobile browsers do not implement getDisplayMedia at all (neither
  // Android Chrome nor iOS Safari), so this is a capability check, not a
  // permission one - there is nothing to prompt for.
  var canShareScreen = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  if (!canShareScreen) {
    shareBtn.disabled = true;
    shareBtn.title = 'Screen sharing is not available in mobile browsers';
    shareBtn.classList.add('dc-ctrl-unavailable');
  }

  function setSharingUI(on) {
    isSharing = on;
    shareBtn.classList.toggle('dc-ctrl-sharing', on);
    shareBtn.title = on ? 'Stop sharing' : 'Share screen';
    tileScreen.classList.toggle('dc-sharing', on);
    shareBadge.hidden = !on;
    // The camera tile keeps its own identity now - it is no longer the
    // thing being replaced.
    localTileLabel.textContent = myName;
  }

  async function startScreenShare() {
    if (isSharing) return;
    if (!canShareScreen) {
      setStatus('Screen sharing is not available in mobile browsers', 'error');
      return;
    }
    var stream;
    try {
      // audio:true asks for system/tab audio. Chrome and Edge on desktop
      // offer it as a checkbox in the picker; Firefox and Safari ignore it
      // and simply return no audio track, which is handled below.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: {
          echoCancellation: false,   // it is not a microphone; leave it alone
          noiseSuppression: false,
          autoGainControl: false
        }
      });
    } catch (err) {
      // Cancelling the OS picker lands here (NotAllowedError/AbortError).
      // Nothing was changed yet, so just leave the UI exactly as it was.
      log('screen share cancelled or refused:', err && err.name);
      return;
    }

    var vTrack = stream.getVideoTracks()[0];
    if (!vTrack) { log('getDisplayMedia returned no video track'); return; }
    var aTrack = stream.getAudioTracks()[0] || null;
    log('screen share got video=' + !!vTrack + ' audio=' + !!aTrack);

    localScreenStream = stream;
    screenSenders = [];
    if (pc) {
      // Both tracks go on the SAME stream, so the far side sees one stream
      // id and can match it against the id we announce below.
      screenSenders.push(pc.addTrack(vTrack, stream));
      if (aTrack) screenSenders.push(pc.addTrack(aTrack, stream));
      // addTrack fires negotiationneeded, which sends the offer.
      socket.emit('screen-share', { on: true, streamId: stream.id, audio: !!aTrack });
    }

    // Local preview. Muted, or the shared audio would play back through
    // our own speakers and feed straight into the microphone.
    screenVideo.srcObject = stream;
    screenVideo.muted = true;
    screenTileLabel.textContent = myName + "'s screen";
    hasScreenMedia = true;
    setSharingUI(true);
    refreshStage();
    // A share is almost always the thing you want to look at.
    setFocus('screen');
    if (!aTrack) setStatus('Sharing screen (no audio - your browser did not offer it)', 'connected');
    emitMediaState();
    log('screen share started, streamId=', stream.id);

    // The browser's own "Stop sharing" bar ends the track behind our back.
    vTrack.addEventListener('ended', function () {
      log('screen share ended by the browser UI');
      stopScreenShare();
    });
  }

  async function stopScreenShare() {
    if (!isSharing) return;

    // Remove exactly the senders we added. The camera sender is untouched,
    // which is the whole point of this design - the camera never stopped.
    if (pc) {
      screenSenders.forEach(function (s) {
        try { pc.removeTrack(s); } catch (e) { log('removeTrack failed', e && e.message); }
      });
      socket.emit('screen-share', { on: false });
    }
    screenSenders = [];

    try { if (localScreenStream) localScreenStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    localScreenStream = null;

    screenVideo.srcObject = null;
    hasScreenMedia = false;
    setSharingUI(false);
    if (focusMode === 'screen') setFocus('none');
    refreshStage();
    emitMediaState();
    log('screen share stopped; camera was never interrupted');
  }

  shareBtn.addEventListener('click', function () {
    if (isSharing) stopScreenShare(); else startScreenShare();
  });

  // The peer tells us which of their streams is the screen.
  socket.on('screen-share', function (msg) {
    if (!msg) return;
    log('<- screen-share', msg.on ? ('on id=' + msg.streamId) : 'off');
    remoteScreenStreamId = msg.on ? (msg.streamId || null) : null;
    if (!msg.on) {
      // Drop the stream we were treating as theirs so the tile clears even
      // if the removetrack event is slow to arrive.
      Object.keys(remoteStreams).forEach(function (id) {
        if (!remoteStreams[id].getTracks().some(function (t) { return t.readyState === 'live'; })) {
          delete remoteStreams[id];
        }
      });
      if (!localScreenStream) {
        screenVideo.srcObject = null;
        hasScreenMedia = false;
      }
      if (focusMode === 'screen' && !localScreenStream) setFocus('none');
    }
    routeRemoteStreams();
  });

  // Sharing must not survive the call ending.
  socket.on('call-end', function () { if (isSharing) stopScreenShare(); });
  socket.on('peer-left', function () { if (isSharing) stopScreenShare(); });

  setCallState('idle');
  initMedia();
})();
