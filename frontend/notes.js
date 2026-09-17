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

  function openWorkspace(key) {
    window.__SESSION_KEY = key;
    askForProfileName(function (name) {
      window.__PROFILE_NAME = name;
      try { sessionStorage.setItem('notes.profile', name); } catch (e) {}
      notesView.hidden = true;
      workspaceView.hidden = false;
      diag('loading workspace modules');
      loadModule('/api/sync/socket.io.js').then(function () {
        return loadModule('workspace.js');
      });
    });
  }

  function askForProfileName(callback) {
    var saved = '';
    try { saved = sessionStorage.getItem('notes.profile') || ''; } catch (e) {}

    var overlay = document.createElement('div');
    overlay.className = 'name-prompt';
    overlay.innerHTML =
      '<div class="name-prompt-card">' +
      '  <h2>What should we call you?</h2>' +
      '  <p>Just for this session.</p>' +
      '  <input id="name-input" type="text" maxlength="24" autocomplete="off" spellcheck="false" placeholder="Your name" />' +
      '  <button id="name-continue" type="button">Continue</button>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = overlay.querySelector('#name-input');
    var btn = overlay.querySelector('#name-continue');
    if (saved) input.value = saved;
    setTimeout(function () { input.focus(); input.select(); }, 30);

    function finish() {
      var name = (input.value || '').trim().slice(0, 24);
      if (!name) { input.focus(); input.classList.add('name-error'); return; }
      overlay.parentNode.removeChild(overlay);
      callback(name);
    }
    btn.addEventListener('click', finish);
    input.addEventListener('keydown', function (e) {
      input.classList.remove('name-error');
      if (e.key === 'Enter') { e.preventDefault(); finish(); }
    });
  }

  render('');
})();
