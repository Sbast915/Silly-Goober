(function () {
  'use strict';

  var STORAGE_KEY = 'notes-app-entries';

  var notesList = document.getElementById('notes-list');
  var emptyState = document.getElementById('empty-state');
  var addForm = document.getElementById('add-form');
  var addInput = document.getElementById('add-input');
  var searchInput = document.getElementById('search-input');
  var notesView = document.getElementById('notes-view');
  var callView = document.getElementById('call-view');
  var decoyView = document.getElementById('decoy-view');

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
      attemptUnlock(searchInput.value);
    }
  });

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function attemptUnlock(passphrase) {
    var value = (passphrase || '').trim();
    if (!value) return;

    fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: value })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.ok) return; // wrong passphrase: stays a notes app, silently
        if (data.mode === 'real') {
          enterRealCall(data.token);
        } else if (data.mode === 'decoy') {
          enterDecoy();
        }
      })
      .catch(function () {
        // network error: fail silently, stay on the notes app
      });
  }

  function enterRealCall(token) {
    window.__UNLOCK_TOKEN = token;
    notesView.hidden = true;
    callView.hidden = false;
    loadScript('/socket.io/socket.io.js').then(function () {
      return loadScript('call.js');
    });
  }

  function enterDecoy() {
    notesView.hidden = true;
    decoyView.hidden = false;
    loadScript('decoy.js');
  }

  render('');
})();
