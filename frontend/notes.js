(function () {
  'use strict';

  // Everything in this file is readable by anyone who opens devtools on the
  // landing page, so it is written to read as an ordinary notes app:
  //  - no identifier hints at a second mode
  //  - nothing is logged to the console (a debug build is opt-in, see DEBUG)
  //  - the server call looks like a notes search
  var DEBUG = false;
  try { DEBUG = localStorage.getItem('notes.diag') === '1'; } catch (e) {}
  function diag() { if (DEBUG) console.log.apply(console, arguments); }

  var STORAGE_KEY = 'notes-app-entries';

  var notesList = document.getElementById('notes-list');
  var emptyState = document.getElementById('empty-state');
  var addForm = document.getElementById('add-form');
  var addInput = document.getElementById('add-input');
  var searchInput = document.getElementById('search-input');
  var notesView = document.getElementById('notes-view');
  var workspaceView = document.getElementById('workspace-view');

  function loadNotes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveNotes(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  var notes = loadNotes();

  function render(filter) {
    var f = (filter || '').trim().toLowerCase();
    var visible = f
      ? notes.filter(function (n) { return n.text.toLowerCase().indexOf(f) !== -1; })
      : notes;

    notesList.innerHTML = '';
    visible.slice().reverse().forEach(function (n) {
      var li = document.createElement('li');
      li.className = 'note-item';
      li.textContent = n.text;

      var del = document.createElement('button');
      del.className = 'note-delete';
      del.textContent = '✕';
      del.setAttribute('aria-label', 'Delete note');
      del.addEventListener('click', function () {
        notes = notes.filter(function (x) { return x.id !== n.id; });
        saveNotes(notes);
        render(searchInput.value);
      });

      li.appendChild(del);
      notesList.appendChild(li);
    });

    emptyState.hidden = visible.length !== 0;
  }

  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = addInput.value.trim();
    if (!text) return;
    notes.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2), text: text });
    saveNotes(notes);
    addInput.value = '';
    render(searchInput.value);
  });

  searchInput.addEventListener('input', function () {
    render(searchInput.value);
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSearch(searchInput.value);
    }
  });

  function loadModule(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  // Sends the query to the server. For an ordinary term the server has no
  // match and the local filter above is all that happens.
  function submitSearch(query) {
    var value = (query || '').trim();
    if (!value) return;

    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: value })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.ok) return;
        if (data.view) openWorkspace(data.key);
      })
      .catch(function () { /* offline: local filtering already ran */ });
  }

  // The two people who use this. Ids are lowercase and stable - they are
  // what the server and the message history key on. Labels/colours are
  // presentation only.
  var PROFILES = [
    { id: 'seb',  label: 'Seb',  initial: 'S', color: '#5865f2' },
    { id: 'hala', label: 'Hala', initial: 'H', color: '#eb459e' }
  ];
  var PROFILE_KEY = 'notes.profile';

  function openWorkspace(key) {
    window.__SESSION_KEY = key;
    pickProfile(function (profile) {
      window.__PROFILE = profile;
      window.__PROFILE_NAME = profile.label;
      notesView.hidden = true;
      workspaceView.hidden = false;
      diag('loading workspace modules');
      loadModule('/api/sync/socket.io.js').then(function () {
        return loadModule('workspace.js');
      });
    });
  }

  // Stored in localStorage (per device, survives restarts) rather than
  // sessionStorage, so you only pick once per phone. This is not auth - it
  // just says which of the two you are.
  function pickProfile(callback) {
    var savedId = '';
    try { savedId = localStorage.getItem(PROFILE_KEY) || ''; } catch (e) {}

    var overlay = document.createElement('div');
    overlay.className = 'profile-pick';
    var opts = PROFILES.map(function (p) {
      return '<button type="button" class="profile-option' +
             (p.id === savedId ? ' is-current' : '') + '" data-id="' + p.id + '">' +
             '<span class="profile-option-avatar" style="background:' + p.color + '">' + p.initial + '</span>' +
             '<span class="profile-option-name">' + p.label + '</span>' +
             '</button>';
    }).join('');
    overlay.innerHTML =
      '<div class="profile-pick-card">' +
      '  <h2>Who are you?</h2>' +
      '  <div class="profile-pick-options">' + opts + '</div>' +
      '  <p class="profile-pick-hint">Saved on this device. Change it any time from the header.</p>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.profile-option') : null;
      if (!btn) return;
      var chosen = PROFILES.filter(function (p) { return p.id === btn.getAttribute('data-id'); })[0];
      if (!chosen) return;
      try { localStorage.setItem(PROFILE_KEY, chosen.id); } catch (e) {}
      overlay.parentNode.removeChild(overlay);
      callback(chosen);
    });
  }

  // Exposed so the workspace can offer "switch profile" without duplicating
  // the list or the storage key.
  window.__PROFILES = PROFILES;
  window.__PROFILE_KEY = PROFILE_KEY;
  window.__pickProfile = pickProfile;

  render('');
})();
