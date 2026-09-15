(function () {
  'use strict';

  var decoyView = document.getElementById('decoy-view');

  decoyView.innerHTML =
    '<div class="call-videos">' +
    '  <div class="decoy-remote"></div>' +
    '  <div class="decoy-local"></div>' +
    '  <div class="call-status" id="decoy-status">Ready</div>' +
    '</div>' +
    '<div class="device-picker">' +
    '  <label for="decoy-mic">Mic</label>' +
    '  <select id="decoy-mic" disabled>' +
    '    <option>Default Microphone</option>' +
    '  </select>' +
    '</div>' +
    '<div class="call-controls">' +
    '  <button class="btn-toggle" id="decoy-mute">Mute</button>' +
    '  <button class="btn-call" id="decoy-call">Call</button>' +
    '  <button class="btn-end" id="decoy-end" hidden>End</button>' +
    '  <button class="btn-toggle" id="decoy-camera">Cam</button>' +
    '</div>';

  var statusEl = document.getElementById('decoy-status');
  var callBtn = document.getElementById('decoy-call');
  var endBtn = document.getElementById('decoy-end');
  var muteBtn = document.getElementById('decoy-mute');
  var cameraBtn = document.getElementById('decoy-camera');

  var timer = null;

  callBtn.addEventListener('click', function () {
    callBtn.hidden = true;
    endBtn.hidden = false;
    statusEl.textContent = 'Calling...';
    timer = setTimeout(function () {
      statusEl.textContent = 'No answer';
      callBtn.hidden = false;
      endBtn.hidden = true;
    }, 4000);
  });

  endBtn.addEventListener('click', function () {
    if (timer) clearTimeout(timer);
    callBtn.hidden = false;
    endBtn.hidden = true;
    statusEl.textContent = 'Ready';
  });

  muteBtn.addEventListener('click', function () {
    muteBtn.classList.toggle('off');
    muteBtn.textContent = muteBtn.classList.contains('off') ? 'Unmute' : 'Mute';
  });

  cameraBtn.addEventListener('click', function () {
    cameraBtn.classList.toggle('off');
    cameraBtn.textContent = cameraBtn.classList.contains('off') ? 'Cam off' : 'Cam';
  });
})();
