/* SmartClass – fixes.js
   1) Limpieza única de los datos de ejemplo (el profesor aún no ha montado nada)
   2) Sección "Apuntes": cada estudiante monta apuntes, todos los ven, +5 ⭐ por apunte
   3) Duelos con solicitud: eliges al compañero, le llega la invitación y, al aceptar, empieza el juego en ambos
   Se carga DESPUÉS de app.js y enhancements.js. */

/* ============ 1) Limpieza única de datos de ejemplo ============ */
(function () {
  try {
    const FLAG = 'smartclass_clean_v2';
    if (localStorage.getItem(FLAG)) return;
    ['TASKS', 'EXAMS', 'ACTIVITIES', 'DUELS', 'TUTORING_SESSIONS'].forEach(k => localStorage.setItem(STORAGE_KEYS[k], '[]'));
    localStorage.setItem(FLAG, '1');
  } catch (e) { /* sin acceso a localStorage */ }
})();

/* ============ 1b) Todos empiezan en 0 ⭐ y 0 puntos + sincronización ============ */
window.scSyncMe = function () {
  const u = state.currentUser; if (!u || u.role !== 'estudiante') return false;
  const s = state.getStudents().find(x => x.email === u.email); if (!s) return false;
  let changed = false;
  ['points', 'stars', 'level', 'unlocked'].forEach(k => { if (JSON.stringify(s[k]) !== JSON.stringify(u[k])) { u[k] = s[k]; changed = true; } });
  if (changed) state.save(STORAGE_KEYS.CURRENT_USER, u);
  return changed;
};
(function () {
  try {
    const FLAG = 'smartclass_clean_v3';
    if (!localStorage.getItem(FLAG)) {
      const zero = { points: 0, stars: 0, level: 'Apprentice' };
      state.saveStudents((state.getStudents() || []).map(s => Object.assign({}, s, zero)));
      if (state.currentUser && state.currentUser.role === 'estudiante') { Object.assign(state.currentUser, zero); state.save(STORAGE_KEYS.CURRENT_USER, state.currentUser); }
      localStorage.setItem(FLAG, '1');
    }
  } catch (e) { }
  const _r = window.renderApp;
  window.renderApp = function () { scSyncMe(); _r(); };
})();

/* ============ 2) Apuntes ============ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = STORAGE_KEYS.MATERIALS;
  const getMats = () => state.load(KEY) || [];
  const MAX_FILE = 1000000; // 1 MB para PDF/Word/txt (las imágenes se comprimen solas)
  let scope = 'grade';

  const readAsDataURL = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
  function compressImage(file) {
    return readAsDataURL(file).then(src => new Promise((ok) => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1280 / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', 0.72));
      };
      im.onerror = () => ok(src);
      im.src = src;
    }));
  }
  function toBlobUrl(dataUrl) {
    const [h, b] = dataUrl.split(','), mime = (h.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(b), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  }
  const isImg = (m) => /^image\//.test(m.mime || '') || /^data:image\//.test(m.dataUrl || '');
  const isPdf = (m) => /pdf/.test(m.mime || '') || /^data:application\/pdf/.test(m.dataUrl || '');

  function renderApuntes(c) {
    const u = state.currentUser;
    let list = getMats().slice().reverse();
    if (scope === 'grade') list = list.filter(m => String(m.grade) === String(u.grade));
    c.innerHTML = `
      <div class="content-card">
        <div class="card-top-bar"><div class="card-title-group">
          <div class="card-title-icon" style="background:#ffedd5;color:#ea580c">📚</div>
          <div class="card-title-text"><h2>Class notes</h2><span>Upload your notes so your classmates can see them. You earn <b>5 ⭐</b> for each note!</span></div>
        </div></div>
        <div class="mat-form" style="margin-top:1rem">
          <input id="matTitle" class="form-control" maxlength="80" placeholder="Title (e.g. Fractions summary)">
          <input id="matSubject" class="form-control" maxlength="40" placeholder="Subject (e.g. Math)">
          <textarea id="matText" class="form-control" rows="4" placeholder="Write your note here (optional if you upload a file)…"></textarea>
          <label class="dt-photo" style="max-width:100%">📎 Attach photo, PDF or document (optional)
            <input id="matFile" type="file" accept="image/*,.pdf,.txt,.doc,.docx" hidden></label>
          <div id="matFileName" style="font-size:.82rem;color:var(--text-muted)"></div>
          <button class="btn-primary" id="matUp">⬆️ Upload notes (+5 ⭐)</button>
        </div>
      </div>
      <div class="content-card" style="margin-top:1.25rem">
        <div class="card-top-bar"><div class="card-title-text"><h2>Notes uploaded (${list.length})</h2></div>
          <select id="matScope" class="form-control" style="max-width:220px">
            <option value="grade" ${scope === 'grade' ? 'selected' : ''}>Only my grade (${esc(u.grade)}</option>
            <option value="all" ${scope === 'all' ? 'selected' : ''}>All grades</option></select></div>
        <div style="margin-top:.8rem">${list.length ? list.map(m => `
          <div class="mat-item"><div>
            <strong>${esc(m.title)}</strong>${m.authorEmail === u.email ? ' <span class="dt-kind" style="margin-left:.3rem">Yours</span>' : ''}
            <div style="font-size:.78rem;color:var(--text-muted)">${esc(m.subject || 'General')} • ${esc(m.authorName)} • Grade ${esc(m.grade)} ${m.dataUrl ? '• 📎 file' : ''}</div></div>
            <button class="btn-yellow btn-sm" data-view="${esc(m.id)}">👁️ View note</button></div>`).join('')
        : '<em>There are no notes yet. Be the first to upload one!</em>'}</div>
      </div>`;
    $('matFile').onchange = (e) => { const f = e.target.files[0]; $('matFileName').textContent = f ? '📎 ' + f.name : ''; };
    $('matUp').onclick = publish;
    $('matScope').onchange = (e) => { scope = e.target.value; renderApuntes(c); };
    c.querySelectorAll('[data-view]').forEach(b => b.onclick = () => openNote(b.dataset.view));
  }

  async function publish() {
    const u = state.currentUser, title = $('matTitle').value.trim(), subject = $('matSubject').value.trim(), text = $('matText').value.trim(), f = $('matFile').files[0];
    if (!title) return showToast('Give your note a title.', 'warning');
    if (!text && !f) return showToast('Write your note or attach a file.', 'warning');
    let dataUrl = '', fileName = '', mime = '';
    if (f) {
      if (/^image\//.test(f.type)) dataUrl = await compressImage(f);
      else { if (f.size > MAX_FILE) return showToast('The file is larger than 1 MB. Upload a photo or a lighter file.', 'warning'); dataUrl = await readAsDataURL(f); }
      fileName = f.name; mime = /^image\//.test(f.type) ? 'image/jpeg' : f.type;
    }
    const l = getMats();
    l.push({ id: 'mat-' + Date.now(), title, subject, text, grade: String(u.grade), authorEmail: u.email, authorName: u.name, fileName, mime, dataUrl, date: new Date().toISOString(), downloadedBy: [] });
    try { state.save(KEY, l); } catch (e) { return showToast('There is no space to save that file. Try a lighter one.', 'warning'); }
    state.addPointsAndStars(0, 5);
    showToast('Note uploaded! You earned +5 ⭐', 'success');
    renderApp();
  }

  function openNote(id) {
    const m = getMats().find(x => x.id === id); if (!m) return;
    closeDetailPage();
    let viewer = '';
    if (m.dataUrl && isImg(m)) viewer = `<img class="dt-img" style="max-height:none" src="${m.dataUrl}" alt="${esc(m.title)}">`;
    else if (m.dataUrl && isPdf(m)) viewer = `<iframe src="${toBlobUrl(m.dataUrl)}" style="width:100%;height:70vh;border:1px solid var(--border-color);border-radius:14px"></iframe>`;
    else if (m.dataUrl) viewer = '<div class="dt-status">This file type cannot be displayed here. Download it to open it.</div>';
    const d = document.createElement('div'); d.id = 'detailPage'; d.className = 'detail-page';
    d.innerHTML = `<div class="dt-head" style="background:linear-gradient(135deg,#ea580c,#fb923c)"><button class="dt-back" onclick="closeDetailPage()">← Back</button><span class="dt-kind">Note</span><h1>${esc(m.title)}</h1></div>
      <div class="dt-body"><div class="dt-meta"><div><small>Subject</small><b>${esc(m.subject || 'General')}</b></div><div><small>Author</small><b>${esc(m.authorName)}</b></div><div><small>Grade</small><b>${esc(m.grade)}</b></div></div>
      ${m.text ? `<p class="dt-text" style="white-space:pre-wrap">${esc(m.text)}</p>` : ''}${viewer}
      ${m.dataUrl ? `<div class="dt-actions"><a class="btn-yellow mat-dl" href="${m.dataUrl}" download="${esc(m.fileName || 'apunte')}">⬇️ Download file</a></div>` : ''}</div>`;
    document.body.appendChild(d); document.body.style.overflow = 'hidden';
  }

  // Enganches: pestaña, sección y tarjeta del menú
  const _tabs = window.renderSubnavTabs;
  window.renderSubnavTabs = function (isTeacher) {
    _tabs(isTeacher);
    if (isTeacher) return;
    const c = $('subnavTabsContainer'); if (!c) return;
    const b = document.createElement('button');
    b.className = 'subnav-tab-btn' + (state.currentSection === 'apuntes' ? ' active' : '');
    b.setAttribute('onclick', "switchSection('apuntes')"); b.innerHTML = '<span>📚 Notes</span>';
    const av = [...c.querySelectorAll('button')].find(x => /switchSection\('avatar'\)/.test(x.getAttribute('onclick') || ''));
    av ? c.insertBefore(b, av) : c.appendChild(b);
  };
  const _sec = window.renderActiveSection;
  window.renderActiveSection = function (isTeacher) {
    if (!isTeacher && state.currentSection === 'apuntes') { const v = $('mainViewContainer'); if (v) return renderApuntes(v); }
    return _sec(isTeacher);
  };
  const _menu = window.renderStudentMainMenu;
  window.renderStudentMainMenu = function (c) { _menu(c); c.innerHTML = c.innerHTML.replace('openModalBiblioteca()', "switchSection('apuntes')"); };
  window.openModalBiblioteca = function () { switchSection('apuntes'); };
})();

/* ============ 3) Duelos con solicitud ============ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const INVITE_TTL = 15 * 60e3, PLAY_TTL = 10 * 60e3;
  const me = () => (state.currentUser && state.currentUser.role === 'estudiante') ? state.currentUser : null;
  const gameActive = () => !!$('gameModal')?.classList.contains('active');
  let waitingId = null, popupId = null, lastSig = null;
  const started = new Set();

  function updateDuel(id, fn) {
    const l = state.getDuels(), d = l.find(x => x.id === id);
    if (!d) return null; fn(d); state.saveDuels(l); return d;
  }
  function overlay(id, html) {
    let o = $(id);
    if (!o) { o = document.createElement('div'); o.className = 'modal-overlay'; o.id = id; document.body.appendChild(o); }
    o.innerHTML = `<div class="modal-content game-box">${html}</div>`; o.classList.add('active'); return o;
  }
  const hide = (id) => $(id)?.classList.remove('active');
  function finalize(d) {
    const c = d.challengerScore ?? 0, o = d.opponentScore ?? 0;
    d.winner = o > c ? d.opponentName : c > o ? d.challengerName : 'Tie'; d.status = 'completed';
  }

  /* --- Elegir compañero y enviar solicitud --- */
  window.openInviteDuelModal = function () {
    const u = me(); if (!u) return;
    if (state.getDuels().some(d => d.challengerEmail === u.email && (d.status === 'pending' || d.status === 'playing')))
      return showToast('You already have a challenge in progress. Wait for it to finish or cancel it.', 'warning');
    const mates = state.getStudentsByGrade(u.grade).filter(s => s.email !== u.email);
    const topics = (window.scTopics ? scTopics() : []).map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    overlay('duelInviteModal', `<div class="modal-header"><h3>⚔️ Challenge a classmate</h3><button class="modal-close-btn" onclick="document.getElementById('duelInviteModal').classList.remove('active')">&times;</button></div>
      <div class="modal-body">${mates.length ? `
        <label style="font-weight:700">1. Choose who you want to compete with:</label>
        <div class="duel-pick-list">${mates.map(s => `<label class="duel-pick"><input type="radio" name="duelOpp" value="${esc(s.email)}">
          <span class="duel-pick-av">${generateAvatarSvg(s.avatar || {}, 38)}</span><span><b>${esc(s.name)}</b><small>${esc(s.level || 'Apprentice')}</small></span></label>`).join('')}</div>
        <div class="form-group"><label for="duelTopic2">2. Duel topic:</label><select id="duelTopic2" class="form-control">${topics}</select></div>
        <div class="form-group"><label for="duelCount2">3. Number of questions (picked at random by the page):</label><select id="duelCount2" class="form-control"><option>5</option><option>10</option><option>15</option></select></div>
        <button class="btn-primary" id="duelSend" style="width:100%">📨 Send duel request</button>`
        : '<p>There are no other classmates registered in your grade yet.</p>'}</div>`);
    $('duelSend')?.addEventListener('click', sendInvite);
  };
  function sendInvite() {
    const u = me(), email = document.querySelector('input[name="duelOpp"]:checked')?.value;
    if (!email) return showToast('Choose a classmate from the list.', 'warning');
    const opp = state.getStudents().find(s => s.email === email); if (!opp) return;
    const topic = $('duelTopic2').value, n = parseInt($('duelCount2').value) || 5;
    const duel = { id: 'duel-' + Date.now(), grade: String(u.grade), challengerName: u.name, challengerEmail: u.email, opponentName: opp.name, opponentEmail: opp.email, topic, questions: scBuild(topic, n), status: 'pending', createdAt: Date.now(), challengerScore: null, opponentScore: null, challengerDone: false, opponentDone: false, winner: null, awardedTo: [] };
    const l = state.getDuels(); l.unshift(duel); state.saveDuels(l);
    hide('duelInviteModal'); showWaiting(duel); renderApp();
  }
  function showWaiting(d) {
    waitingId = d.id;
    overlay('duelWaitModal', `<div class="modal-body" style="text-align:center;padding:1.5rem"><div class="duel-spinner"></div>
      <h3 style="margin:.8rem 0 .3rem">Request sent to ${esc(d.opponentName)}</h3>
      <p style="color:var(--text-muted)">When they accept, the game of <b>${esc(d.topic)}</b> will open automatically for both of you.</p>
      <button class="btn-secondary" onclick="cancelDuel('${d.id}')" style="margin-top:1rem">Cancel request</button></div>`);
  }
  window.cancelDuel = function (id) {
    updateDuel(id, d => { if (d.status === 'pending') d.status = 'cancelled'; });
    if (waitingId === id) { waitingId = null; hide('duelWaitModal'); }
    showToast('Request cancelled.', 'info'); renderApp();
  };

  /* --- Recibir: aceptar o rechazar --- */
  function showInvitePopup(d) {
    popupId = d.id;
    overlay('duelInvitePopup', `<div class="modal-body" style="text-align:center;padding:1.5rem"><div style="font-size:3.5rem">⚔️</div>
      <h3 style="margin:.4rem 0">${esc(d.challengerName)} challenges you to a duel!</h3>
      <p>Topic: <b>${esc(d.topic)}</b> • ${d.questions.length} questions</p>
      <div class="dt-actions" style="justify-content:center;margin-top:1rem"><button class="btn-primary" onclick="acceptDuelChallenge('${d.id}')">🎮 Accept and play</button>
      <button class="btn-secondary" onclick="declineDuel('${d.id}')">Not now</button></div></div>`);
  }
  window.acceptDuelChallenge = function (id) {
    const cur = state.getDuels().find(x => x.id === id);
    hide('duelInvitePopup'); popupId = null;
    if (!cur || cur.status !== 'pending') { showToast('That challenge is no longer available.', 'info'); return renderApp(); }
    const d = updateDuel(id, x => { x.status = 'playing'; x.startedAt = Date.now(); x.opponentStarted = true; });
    started.add(id + me().email); startGame(d, 'opponent');
  };
  window.declineDuel = function (id) {
    updateDuel(id, d => { if (d.status === 'pending') d.status = 'declined'; });
    hide('duelInvitePopup'); popupId = null; renderApp();
  };

  /* --- Jugar y registrar resultado --- */
  function startGame(d, role) {
    scPlay(`⚔️ ${d.challengerName} vs ${d.opponentName}: ${d.topic}`, d.questions, (pct) => {
      const done = updateDuel(d.id, x => {
        if (role === 'challenger') { x.challengerScore = pct; x.challengerDone = true; } else { x.opponentScore = pct; x.opponentDone = true; }
        if (x.challengerDone && x.opponentDone) finalize(x);
      });
      if (done && done.status === 'completed') claimReward(done);
      else showToast(`You finished with ${pct}/100. Waiting for your opponent to finish…`, 'info');
      renderApp();
    });
  }
  function claimReward(d) {
    const u = me(); if (!u || (d.awardedTo || []).includes(u.email)) return;
    const mineChal = d.challengerEmail === u.email, mine = mineChal ? d.challengerScore : d.opponentScore, other = mineChal ? d.opponentScore : d.challengerScore;
    updateDuel(d.id, x => { (x.awardedTo = x.awardedTo || []).push(u.email); });
    let msg;
    if (mine === other) msg = 'It\'s a tie!';
    else if (mine > other) msg = 'You won! 🏆';
    else msg = `Winner: ${d.winner}.`;
    const c = d.challengerScore ?? 0, o = d.opponentScore ?? 0;
    showToast(`⚔️ ${d.challengerName} ${c} – ${o} ${d.opponentName}. ${msg}`, 'success');
  }

  /* --- Vigilante: revisa cada 1.5 s (y al instante si cambia en otra pestaña) --- */
  function tick() {
    const u = me();
    if (u && scSyncMe() && ['menu', 'calificaciones'].includes(state.currentSection) && !gameActive()) renderApp();
    if (!u) { hide('duelInvitePopup'); hide('duelWaitModal'); return; }
    const now = Date.now(), all = state.getDuels();
    let dirty = false;
    all.forEach(d => {
      if (d.status === 'pending' && now - d.createdAt > INVITE_TTL) { d.status = 'expired'; dirty = true; }
      if (d.status === 'playing' && d.startedAt && now - d.startedAt > PLAY_TTL) {
        if (!d.challengerDone) { d.challengerScore = 0; d.challengerDone = true; }
        if (!d.opponentDone) { d.opponentScore = 0; d.opponentDone = true; }
        finalize(d); dirty = true;
      }
    });
    if (dirty) state.saveDuels(all);
    const mine = all.filter(d => d.challengerEmail === u.email || d.opponentEmail === u.email);

    // Espera del retador
    if (waitingId) {
      const w = mine.find(d => d.id === waitingId);
      if (!w || w.status !== 'pending') { waitingId = null; hide('duelWaitModal'); }
    }
    mine.forEach(d => {
      // El rival aceptó -> se abre el juego
      if (d.challengerEmail === u.email && d.status === 'playing' && !started.has(d.id + u.email) && !d.challengerStarted && !gameActive()) {
        started.add(d.id + u.email); updateDuel(d.id, x => { x.challengerStarted = true; });
        showToast(`${d.opponentName} accepted! The duel begins.`, 'success'); startGame(d, 'challenger');
      }
      if (d.challengerEmail === u.email && (d.status === 'declined') && !d.seen) {
        updateDuel(d.id, x => { x.seen = true; }); showToast(`${d.opponentName} couldn't play right now.`, 'info');
      }
      if (d.status === 'completed' && (d.challengerDone && d.opponentDone || d.startedAt) && !(d.awardedTo || []).includes(u.email) && !gameActive()) claimReward(d);
    });
    // Solicitud entrante
    const inc = mine.find(d => d.opponentEmail === u.email && d.status === 'pending');
    if (inc && popupId !== inc.id && !gameActive()) showInvitePopup(inc);
    if (popupId && !mine.some(d => d.id === popupId && d.status === 'pending')) { popupId = null; hide('duelInvitePopup'); }

    // Refrescar la pantalla de "Competir" si algo cambió
    const sig = mine.map(d => d.id + d.status + d.challengerDone + d.opponentDone).join('|');
    if (lastSig !== null && sig !== lastSig && state.currentSection === 'competir' && !gameActive()) renderApp();
    lastSig = sig;
  }
  setInterval(tick, 1500);
  window.addEventListener('storage', tick);

  /* --- Pantalla "Competir" --- */
  window.renderStudentDuelsSection = function (c) {
    const u = state.currentUser, mine = state.getDuels().filter(d => d.challengerEmail === u.email || d.opponentEmail === u.email);
    const incoming = mine.filter(d => d.opponentEmail === u.email && d.status === 'pending');
    const outgoing = mine.filter(d => d.challengerEmail === u.email && d.status === 'pending');
    const live = mine.filter(d => d.status === 'playing');
    const past = mine.filter(d => !['pending', 'playing'].includes(d.status));
    const label = { completed: '', declined: 'Declined', cancelled: 'Cancelled', expired: 'No answer' };
    c.innerHTML = `
      ${incoming.map(d => `<div class="invitation-alert-card"><div><span style="font-size:.75rem;font-weight:800;color:#b45309;text-transform:uppercase">Challenge received!</span>
        <h4 style="font-size:1.1rem;color:#78350f;font-weight:800">⚔️ ${esc(d.challengerName)} te reta: "${esc(d.topic)}" (${d.questions.length} questions)</h4></div>
        <div class="dt-actions"><button class="btn-primary" onclick="acceptDuelChallenge('${d.id}')">🎮 Accept and play</button><button class="btn-secondary" onclick="declineDuel('${d.id}')">Decline</button></div></div>`).join('')}
      <div class="content-card">
        <div class="card-top-bar"><div class="card-title-group"><div class="card-title-icon" style="background:#ede9fe;color:#8b5cf6">⚔️</div>
          <div class="card-title-text"><h2>Compete with a classmate (Grade ${esc(u.grade)}</h2><span>Choose a classmate, they accept and the game starts for both of you. The questions are picked at random by the page.</span></div></div>
          <button class="btn-yellow" onclick="openInviteDuelModal()">⚔️ Challenge a classmate</button></div>
        ${outgoing.map(d => `<div class="dt-status" style="margin-top:1rem">⏳ Waiting for <b>${esc(d.opponentName)}</b> to accept your challenge of ${esc(d.topic)}. <button class="btn-secondary btn-sm" onclick="cancelDuel('${d.id}')">Cancel</button></div>`).join('')}
        ${live.map(d => `<div class="dt-status ok" style="margin-top:1rem">🎮 Duel in progress: ${esc(d.challengerName)} vs ${esc(d.opponentName)} (${esc(d.topic)})</div>`).join('')}
        <h4 style="margin:1.25rem 0 .6rem;color:var(--navy)">My duels</h4>
        ${past.length ? past.map(d => `<div class="mat-item"><div><strong>${esc(d.challengerName)}</strong> <span style="color:#f59e0b;font-weight:900">VS</span> <strong>${esc(d.opponentName)}</strong>
          <div style="font-size:.78rem;color:var(--text-muted)">${esc(d.topic)}</div></div>
          <span class="submission-status-badge ${d.status === 'completed' ? 'submitted' : 'pending'}">${d.status === 'completed' ? `${d.challengerScore ?? 0} – ${d.opponentScore ?? 0} • ${d.winner === 'Tie' ? 'Tie' : 'Winner: ' + esc(d.winner)}` : label[d.status]}</span></div>`).join('')
        : '<em>You haven\'t played any duels yet. Challenge someone!</em>'}
      </div>`;
  };
})();

/* ============ 4) Avatar: más parecido a una persona, con estilos y prendas que se desbloquean con ⭐ ============ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DEF = { skin: '#ffd1a4', hair: 'short', hairColor: '#4a2c11', clothes: 'tshirt', clothesColor: '#0284c7', bottoms: 'jeans', expression: 'smile', accessory: 'none' };
  const dk = (hex, k = 0.78) => { const n = parseInt(String(hex).replace('#', ''), 16) || 0; return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`; };

  /* ---------- Dibujo ---------- */
  const CAP = c => `<path d="M 29 43 C 25 9, 75 9, 71 43 C 67 31, 58 27, 50 27 C 42 27, 34 31, 30 42 Z" fill="${c}"/>`;
  const BRAIDS = c => [0, 1, 2, 3, 4].map(i => `<circle cx="29" cy="${52 + i * 8}" r="4.2" fill="${c}"/><circle cx="71" cy="${52 + i * 8}" r="4.2" fill="${c}"/>`).join('') + '<circle cx="29" cy="92" r="2.6" fill="#ef4444"/><circle cx="71" cy="92" r="2.6" fill="#ef4444"/>';
  const HAIR_BACK = {
    long: c => `<path d="M 28 34 C 22 62, 26 82, 34 86 L 66 86 C 74 82, 78 62, 72 34 Z" fill="${c}"/>`,
    bob: c => `<path d="M 28 34 C 24 54, 27 64, 33 66 L 67 66 C 73 64, 76 54, 72 34 Z" fill="${c}"/>`,
    ponytail: c => `<path d="M 64 28 C 86 26, 90 56, 80 78 C 78 62, 72 46, 64 38 Z" fill="${c}"/><circle cx="65" cy="31" r="3" fill="#ef4444"/>`,
    afro: c => `<circle cx="50" cy="31" r="29" fill="${c}"/>`,
    buns: c => `<circle cx="31" cy="17" r="9" fill="${c}"/><circle cx="69" cy="17" r="9" fill="${c}"/>`,
    wavy: c => `<path d="M 28 34 C 20 50, 30 58, 25 72 C 31 80, 38 74, 40 86 L 60 86 C 62 74, 69 80, 75 72 C 70 58, 80 50, 72 34 Z" fill="${c}"/>`
  };
  const HAIR_FRONT = {
    short: CAP, ponytail: CAP, buns: CAP,
    long: c => `<path d="M 29 44 C 25 9, 75 9, 71 44 C 66 32, 56 27, 46 24 C 40 31, 34 36, 29 44 Z" fill="${c}"/>`,
    bob: c => `<path d="M 28 44 C 24 9, 76 9, 72 44 C 70 36, 66 34, 60 33 C 54 36, 46 36, 40 33 C 34 34, 30 36, 28 44 Z" fill="${c}"/>`,
    curly: c => [[31, 36, 11], [40, 25, 11], [50, 21, 11], [60, 25, 11], [69, 36, 11], [34, 46, 6], [66, 46, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join(''),
    spiky: c => CAP(c) + `<polygon points="30,36 30,18 38,28 42,12 49,26 56,10 61,26 69,16 70,36" fill="${c}"/>`,
    afro: c => `<path d="M 30 40 C 32 27, 68 27, 70 40 C 64 33, 36 33, 30 40 Z" fill="${c}"/>`,
    braids: c => CAP(c) + BRAIDS(c),
    mohawk: c => `<polygon points="43,32 42,14 47,20 50,6 53,20 58,14 57,32" fill="${c}"/>`,
    wavy: c => `<path d="M 29 44 C 24 8, 76 8, 71 44 C 66 30, 56 26, 50 30 C 44 26, 34 30, 29 44 Z" fill="${c}"/>`,
    bald: () => ''
  };
  const TORSO = 'M 27 69 Q 50 61 73 69 L 72 113 L 28 113 Z';
  const ARM_L = 'M 27 69 C 20 78, 18 98, 19 111 L 28 111 C 28 98, 30 84, 34 74 Z';
  const ARM_R = 'M 73 69 C 80 78, 82 98, 81 111 L 72 111 C 72 98, 70 84, 66 74 Z';
  const SLV_L = 'M 27 69 C 22 73, 19 80, 19 87 L 29 89 C 30 82, 31 77, 34 74 Z';
  const SLV_R = 'M 73 69 C 78 73, 81 80, 81 87 L 71 89 C 70 82, 69 77, 66 74 Z';
  const shortTop = (c) => `<path d="${TORSO}" fill="${c}"/><path d="${SLV_L}" fill="${c}"/><path d="${SLV_R}" fill="${c}"/>`;
  const longTop = (c) => `<path d="${TORSO}" fill="${c}"/><path d="${ARM_L}" fill="${c}"/><path d="${ARM_R}" fill="${c}"/>`;
  const neck = (skin, d = 'M 41 64 Q 50 75 59 64 Z') => `<path d="${d}" fill="${skin}"/>`;
  const TOPS = {
    tshirt: (c, sk) => shortTop(c) + neck(sk) + `<path d="M 41 64 Q 50 75 59 64" stroke="${dk(c, .7)}" stroke-width="1.6" fill="none"/>`,
    polo: (c, sk) => shortTop(c) + neck(sk, 'M 43 64 L 50 75 L 57 64 Z') + '<polygon points="41,63 50,77 43,79 36,67" fill="#fff"/><polygon points="59,63 50,77 57,79 64,67" fill="#fff"/>' + `<circle cx="50" cy="83" r="1.3" fill="${dk(c, .6)}"/><circle cx="50" cy="90" r="1.3" fill="${dk(c, .6)}"/>`,
    hoodie: (c, sk) => longTop(c) + `<path d="M 33 67 Q 50 86 67 67 Q 50 57 33 67 Z" fill="${dk(c, .82)}"/>` + neck(sk, 'M 42 65 Q 50 76 58 65 Z') + `<path d="M 36 97 L 64 97 L 68 112 L 32 112 Z" fill="${dk(c, .88)}"/><line x1="45" y1="76" x2="45" y2="90" stroke="#fff" stroke-width="1.6"/><line x1="55" y1="76" x2="55" y2="90" stroke="#fff" stroke-width="1.6"/>`,
    uniform: (c, sk) => shortTop('#f8fafc') + neck(sk, 'M 43 64 L 50 74 L 57 64 Z') + `<polygon points="41,63 50,75 44,77 37,66" fill="${c}"/><polygon points="59,63 50,75 56,77 63,66" fill="${c}"/><polygon points="48,74 52,74 53,95 50,99 47,95" fill="${c}"/><circle cx="36" cy="84" r="3.5" fill="${c}"/>`,
    sweater: (c, sk) => longTop(c) + `<path d="M 40 64 Q 50 78 60 64" stroke="${dk(c, .75)}" stroke-width="4" fill="${sk}"/><rect x="28" y="95" width="44" height="4" fill="#fff" opacity=".6"/><rect x="28" y="103" width="44" height="4" fill="#fff" opacity=".6"/><rect x="19" y="104" width="9" height="5" fill="${dk(c, .75)}"/><rect x="72" y="104" width="9" height="5" fill="${dk(c, .75)}"/>`,
    jersey: (c, sk) => shortTop(c) + neck(sk, 'M 42 64 L 50 78 L 58 64 Z') + '<path d="M 42 64 L 50 78 L 58 64" stroke="#fff" stroke-width="2" fill="none"/><rect x="28" y="72" width="3" height="41" fill="#fff" opacity=".8"/><rect x="69" y="72" width="3" height="41" fill="#fff" opacity=".8"/><text x="50" y="102" font-size="15" font-weight="800" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif">10</text>',
    dress: (c, sk) => `<path d="M 28 98 L 72 98 L 84 136 L 16 136 Z" fill="${c}"/><path d="${TORSO}" fill="${c}"/>` + neck(sk, 'M 38 64 Q 50 80 62 64 Z') + `<rect x="28" y="96" width="44" height="4" fill="${dk(c, .7)}"/>`,
    blazer: (c, sk) => longTop(c) + neck(sk, 'M 44 64 L 50 70 L 56 64 Z') + `<polygon points="43,63 50,91 57,63" fill="#fff"/><polygon points="48,72 52,72 53,90 50,95 47,90" fill="#ef4444"/><polygon points="43,63 50,91 40,98 35,70" fill="${dk(c, .8)}"/><polygon points="57,63 50,91 60,98 65,70" fill="${dk(c, .8)}"/><circle cx="50" cy="100" r="1.4" fill="#fbbf24"/>`,
    overalls: (c, sk) => shortTop('#f8fafc') + neck(sk) + `<path d="M 33 86 L 67 86 L 68 113 L 32 113 Z" fill="${c}"/><path d="M 33 86 L 36 66 L 41 66 L 39 86 Z" fill="${c}"/><path d="M 67 86 L 64 66 L 59 66 L 61 86 Z" fill="${c}"/><rect x="43" y="94" width="14" height="9" rx="1.5" fill="${dk(c, .85)}"/><circle cx="37" cy="87" r="1.8" fill="#fbbf24"/><circle cx="63" cy="87" r="1.8" fill="#fbbf24"/>`,
    hero: (c, sk) => longTop(c) + neck(sk, 'M 43 64 L 50 72 L 57 64 Z') + `<circle cx="50" cy="86" r="8" fill="#fbbf24"/><polygon points="50,80 52,85 57,85 53,88 55,93 50,90 45,93 47,88 43,85 48,85" fill="${c}"/><rect x="28" y="104" width="44" height="5" fill="#fbbf24"/><rect x="19" y="104" width="9" height="5" fill="#fbbf24"/><rect x="72" y="104" width="9" height="5" fill="#fbbf24"/>`,
    astronaut: (c, sk) => longTop('#f1f5f9') + `<ellipse cx="50" cy="66" rx="13" ry="5" fill="${c}"/>` + neck(sk, 'M 44 65 Q 50 72 56 65 Z') + `<rect x="40" y="82" width="20" height="13" rx="2" fill="${c}"/><circle cx="46" cy="88" r="2" fill="#fbbf24"/><circle cx="54" cy="88" r="2" fill="#ef4444"/><rect x="19" y="100" width="9" height="5" fill="${c}"/><rect x="72" y="100" width="9" height="5" fill="${c}"/><circle cx="23.5" cy="90" r="3" fill="#ef4444"/>`
  };
  const CAPE = { hero: c => `<path d="M 30 68 C 14 100, 10 130, 8 142 L 92 142 C 90 130, 86 100, 70 68 Z" fill="${dk(c, .72)}"/>` };
  const skinLegs = (sk, from) => `<rect x="36" y="${from}" width="12" height="${148 - from}" fill="${sk}"/><rect x="52" y="${from}" width="12" height="${148 - from}" fill="${sk}"/>`;
  const pants = (col, end) => `<rect x="35" y="106" width="14" height="${end - 106}" rx="2" fill="${col}"/><rect x="51" y="106" width="14" height="${end - 106}" rx="2" fill="${col}"/>`;
  const BOTTOMS = {
    jeans: () => pants('#1d4ed8', 150) + '<rect x="34" y="106" width="32" height="5" fill="#1e3a8a"/>',
    slacks: () => pants('#334155', 150) + '<rect x="34" y="106" width="32" height="5" fill="#1e293b"/>',
    sport: () => pants('#111827', 150) + '<rect x="36" y="110" width="2" height="40" fill="#fff"/><rect x="62" y="110" width="2" height="40" fill="#fff"/>',
    shorts: (sk) => skinLegs(sk, 124) + pants('#ca8a04', 130),
    skirt: (sk) => skinLegs(sk, 120) + '<path d="M 30 106 L 70 106 L 78 128 L 22 128 Z" fill="#be185d"/>',
    bare: (sk) => skinLegs(sk, 106)
  };
  const SHOES = '<ellipse cx="42" cy="152" rx="9.5" ry="4.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/><ellipse cx="58" cy="152" rx="9.5" ry="4.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/><rect x="33" y="153" width="19" height="2" fill="#38bdf8"/><rect x="49" y="153" width="19" height="2" fill="#38bdf8"/>';
  const ACC = {
    glasses: () => '<circle cx="42" cy="40" r="6.5" stroke="#1e293b" stroke-width="1.8" fill="rgba(186,230,253,.3)"/><circle cx="58" cy="40" r="6.5" stroke="#1e293b" stroke-width="1.8" fill="rgba(186,230,253,.3)"/><line x1="48.5" y1="40" x2="51.5" y2="40" stroke="#1e293b" stroke-width="1.8"/><line x1="35.5" y1="40" x2="31" y2="38" stroke="#1e293b" stroke-width="1.5"/><line x1="64.5" y1="40" x2="69" y2="38" stroke="#1e293b" stroke-width="1.5"/>',
    sunglasses: () => '<rect x="35" y="35" width="14" height="10" rx="4" fill="#111827"/><rect x="51" y="35" width="14" height="10" rx="4" fill="#111827"/><line x1="49" y1="39" x2="51" y2="39" stroke="#111827" stroke-width="2"/><line x1="37" y1="37" x2="41" y2="37" stroke="#fff" stroke-width="1.2" opacity=".6"/><line x1="53" y1="37" x2="57" y2="37" stroke="#fff" stroke-width="1.2" opacity=".6"/>',
    headphones: () => '<path d="M 30 40 C 28 6, 72 6, 70 40" stroke="#475569" stroke-width="3.5" fill="none"/><rect x="26" y="34" width="7" height="15" rx="3.5" fill="#ef4444"/><rect x="67" y="34" width="7" height="15" rx="3.5" fill="#ef4444"/>',
    star: () => '<polygon points="66,17 68.4,23 74.5,23.5 69.8,27.6 71.3,33.5 66,30.3 60.7,33.5 62.2,27.6 57.5,23.5 63.6,23" fill="#f59e0b" stroke="#b45309" stroke-width=".8"/>',
    bow: () => '<polygon points="64,23 77,15 77,31" fill="#ec4899"/><polygon points="64,23 51,15 51,31" fill="#ec4899"/><circle cx="64" cy="23" r="3.4" fill="#be185d"/>',
    cap: () => '<path d="M 29 34 C 28 8, 72 8, 71 34 C 62 28, 38 28, 29 34 Z" fill="#dc2626"/><path d="M 40 31 C 55 26, 80 28, 85 36 C 70 34, 52 34, 40 34 Z" fill="#b91c1c"/><circle cx="50" cy="11" r="2.2" fill="#b91c1c"/>',
    crown: () => '<polygon points="33,22 35,5 43,14 50,2 57,14 65,5 67,22" fill="#fbbf24" stroke="#b45309" stroke-width="1.2"/><rect x="33" y="19" width="34" height="5" fill="#f59e0b" stroke="#b45309" stroke-width="1"/><circle cx="50" cy="12" r="2" fill="#ef4444"/><circle cx="40" cy="15" r="1.5" fill="#38bdf8"/><circle cx="60" cy="15" r="1.5" fill="#38bdf8"/>'
  };
  const eye = (x, ry = 4.4) => `<ellipse cx="${x}" cy="40" rx="4" ry="${ry}" fill="#fff"/><circle cx="${x}" cy="40.4" r="2.6" fill="#1e293b"/><circle cx="${x + .9}" cy="39.3" r=".9" fill="#fff"/>`;
  const arc = (x) => `<path d="M ${x - 4} 41 Q ${x} 35.5 ${x + 4} 41" stroke="#1e293b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const MOUTH = (k) => `<path d="${k}" stroke="#7f1d1d" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  function face(expr, brow, skin) {
    const brows = (dy = 0) => `<path d="M 37 ${33 + dy} Q 42 ${31 + dy} 47 ${33 + dy}" stroke="${brow}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M 53 ${33 + dy} Q 58 ${31 + dy} 63 ${33 + dy}" stroke="${brow}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    if (expr === 'happy') return brows() + arc(42) + arc(58) + '<path d="M 42 49 Q 50 62 58 49 Z" fill="#7f1d1d"/><path d="M 45 55 Q 50 59 55 55 Q 50 52 45 55 Z" fill="#f87171"/>';
    if (expr === 'cool') return brows() + eye(42) + eye(58) + `<path d="M 37.5 40.5 Q 42 36.5 46.5 40.5 L 46.5 35 L 37.5 35 Z" fill="${skin}"/><path d="M 53.5 40.5 Q 58 36.5 62.5 40.5 L 62.5 35 L 53.5 35 Z" fill="${skin}"/><path d="M 37.5 40.5 Q 42 36.5 46.5 40.5 M 53.5 40.5 Q 58 36.5 62.5 40.5" stroke="#1e293b" stroke-width="1.4" fill="none"/>` + MOUTH('M 44 52 Q 51 55 58 50');
    if (expr === 'wink') return brows() + eye(42) + `<path d="M 54 40 Q 58 43.5 62 40" stroke="#1e293b" stroke-width="2.2" fill="none" stroke-linecap="round"/>` + MOUTH('M 43 51 Q 50 57 57 51');
    if (expr === 'surprised') return brows(-2) + eye(42, 5) + eye(58, 5) + '<ellipse cx="50" cy="54" rx="3.2" ry="4.2" fill="#7f1d1d"/>';
    return brows() + eye(42) + eye(58) + MOUTH('M 43 51 Q 50 57 57 51');
  }
  const CROPS = { head: '16 2 68 68', body: '6 56 88 62', legs: '14 98 72 62' };
  const pickOr = (obj, key, fb) => (obj[key] ? key : fb);

  window.generateAvatarSvg = function (cfg, size = 120) {
    const c = Object.assign({}, DEF);
    Object.keys(cfg || {}).forEach(k => { if (cfg[k]) c[k] = cfg[k]; });
    const skin = c.skin, hairId = pickOr(HAIR_FRONT, c.hair, 'short'), clothes = pickOr(TOPS, c.clothes, 'tshirt');
    const bottoms = clothes === 'dress' ? 'bare' : pickOr(BOTTOMS, c.bottoms, 'jeans');
    const brow = hairId === 'bald' ? '#64748b' : dk(c.hairColor, .8);
    const vb = c.crop ? (CROPS[c.crop] || CROPS.head) : (c.full ? '0 0 100 160' : '0 0 100 120');
    const w = c.full && !c.crop ? Math.round(size * 100 / 160) : size;
    return `<svg viewBox="${vb}" width="${w}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:hidden">
      <rect x="-20" y="-20" width="140" height="200" fill="#e0f2fe"/><circle cx="50" cy="55" r="52" fill="#f0f9ff"/>
      ${CAPE[clothes] ? CAPE[clothes](c.clothesColor) : ''}
      ${HAIR_BACK[hairId] ? HAIR_BACK[hairId](c.hairColor) : ''}
      ${BOTTOMS[bottoms](skin)}${SHOES}
      <rect x="44" y="58" width="12" height="14" fill="${dk(skin, .92)}"/>
      <path d="${ARM_L}" fill="${skin}"/><path d="${ARM_R}" fill="${skin}"/><circle cx="23.5" cy="113" r="4.6" fill="${skin}"/><circle cx="76.5" cy="113" r="4.6" fill="${skin}"/>
      <path d="${TORSO}" fill="${skin}"/>
      ${TOPS[clothes](c.clothesColor, skin)}
      <ellipse cx="31" cy="42" rx="3.5" ry="5" fill="${skin}"/><ellipse cx="69" cy="42" rx="3.5" ry="5" fill="${skin}"/>
      <ellipse cx="50" cy="40" rx="19" ry="21" fill="${skin}"/>
      <circle cx="38" cy="48" r="3.2" fill="#f87171" opacity=".25"/><circle cx="62" cy="48" r="3.2" fill="#f87171" opacity=".25"/>
      <path d="M 49 44 Q 50 47 52 46" stroke="${dk(skin, .7)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      ${face(c.expression, brow, skin)}
      ${HAIR_FRONT[hairId](c.hairColor)}
      ${ACC[c.accessory] ? ACC[c.accessory]() : ''}
    </svg>`;
  };

  /* ---------- Catálogo (cost = estrellas para desbloquear; 0 = gratis) ---------- */
  const I = (id, name, cost = 0) => ({ id, name, cost });
  const CAT = [
    { key: 'hair', label: 'Hairstyle', icon: '💇', crop: 'head', items: [I('short', 'Short'), I('ponytail', 'Ponytail'), I('curly', 'Curly'), I('spiky', 'Spiky'), I('bald', 'Buzz cut', 3), I('long', 'Long', 5), I('bob', 'Bob', 5), I('buns', 'Pigtails', 8), I('wavy', 'Wavy', 8), I('afro', 'Afro', 10), I('braids', 'Braids', 12), I('mohawk', 'Mohawk', 15)] },
    { key: 'hairColor', label: 'Hair color', icon: '🎨', crop: 'head', items: [I('#4a2c11', 'Brown'), I('#1e293b', 'Black'), I('#b45309', 'Blond'), I('#991b1b', 'Redhead'), I('#9ca3af', 'Gray', 5), I('#2563eb', 'Blue', 8), I('#ec4899', 'Pink', 8), I('#7c3aed', 'Purple', 8)] },
    { key: 'skin', label: 'Skin', icon: '🧑', crop: 'head', items: [I('#ffd1a4', 'Light'), I('#fcd34d', 'Warm'), I('#e2a76f', 'Tan'), I('#c68642', 'Cinnamon'), I('#8d5524', 'Brown'), I('#5c3a21', 'Dark')] },
    { key: 'expression', label: 'Face', icon: '😊', crop: 'head', items: [I('smile', 'Smiling'), I('happy', 'Happy'), I('cool', 'Relaxed', 4), I('wink', 'Wink', 4), I('surprised', 'Surprised', 6)] },
    { key: 'accessory', label: 'Accessories', icon: '👓', crop: 'head', items: [I('none', 'None'), I('glasses', 'Glasses'), I('star', 'Star', 3), I('headphones', 'Headphones', 5), I('bow', 'Bow', 5), I('cap', 'Cap', 8), I('sunglasses', 'Sunglasses', 8), I('crown', 'Crown', 30)] },
    { key: 'clothes', label: 'Clothes', icon: '👕', crop: 'body', items: [I('tshirt', 'T-shirt'), I('polo', 'Polo'), I('hoodie', 'Hoodie'), I('uniform', 'Uniform'), I('sweater', 'Sweater', 4), I('jersey', 'Soccer jersey', 6), I('dress', 'Dress', 8), I('overalls', 'Overalls', 10), I('blazer', 'Smart blazer', 12), I('hero', 'Superhero', 20), I('astronaut', 'Astronaut', 25)] },
    { key: 'clothesColor', label: 'Clothes color', icon: '🌈', crop: 'body', items: [I('#0284c7', 'Blue'), I('#16a34a', 'Green'), I('#dc2626', 'Red'), I('#f59e0b', 'Yellow'), I('#7c3aed', 'Purple'), I('#ec4899', 'Pink'), I('#111827', 'Black'), I('#f97316', 'Orange'), I('#0d9488', 'Turquoise')] },
    { key: 'bottoms', label: 'Pants / Skirt', icon: '👖', crop: 'legs', items: [I('jeans', 'Jeans'), I('shorts', 'Shorts'), I('slacks', 'School uniform'), I('sport', 'Sporty', 4), I('skirt', 'Skirt', 4)] }
  ];

  /* ---------- Pantalla ---------- */
  let draft = null, tab = 'hair', lastEmail = null;
  const isOwned = (u, key, it) => u.role === 'docente' || it.cost === 0 || (u.unlocked || []).includes(key + ':' + it.id) || (u.avatar && u.avatar[key] === it.id);
  const fixDraft = (u) => { CAT.forEach(cat => { const it = cat.items.find(i => i.id === draft[cat.key]); if (!it || !isOwned(u, cat.key, it)) draft[cat.key] = DEF[cat.key]; }); };

  function render(c) {
    const u = state.currentUser, teacher = u.role === 'docente';
    scSyncMe();
    if (!draft || lastEmail !== u.email) { draft = Object.assign({}, DEF); Object.keys(u.avatar || {}).forEach(k => { if (u.avatar[k]) draft[k] = u.avatar[k]; }); lastEmail = u.email; }
    const cat = CAT.find(x => x.key === tab) || CAT[0], stars = u.stars || 0;
    c.innerHTML = `<div class="av-wrap">
      <div class="content-card av-stage-card">
        <div class="av-stage">${generateAvatarSvg(Object.assign({}, draft, { full: true }), 300)}</div>
        <div class="av-name">${esc(u.name)}</div>
        ${teacher ? '' : `<div class="av-stars">⭐ <b>${stars}</b> estrella${stars === 1 ? '' : 's'} disponible${stars === 1 ? '' : 's'}</div>`}
        <button class="btn-primary" id="avSave">💾 Save my avatar</button>
        <button class="btn-secondary" id="avRandom">🎲 Surprise me</button>
      </div>
      <div class="content-card av-panel">
        <div class="av-tabs">${CAT.map(x => `<button class="av-tab ${x.key === cat.key ? 'on' : ''}" data-tab="${x.key}">${x.icon} ${x.label}</button>`).join('')}</div>
        ${teacher ? '' : '<p class="av-hint">Tap an item with 🔒 to unlock it with your stars. Stars are earned through tutoring, getting 5.0 on homework, sharing notes, or when your teacher gives them to you.</p>'}
        <div class="av-grid">${cat.items.map(it => {
          const own = isOwned(u, cat.key, it), sel = draft[cat.key] === it.id;
          return `<button class="av-item ${sel ? 'sel' : ''} ${own ? '' : 'locked'}" data-id="${esc(it.id)}"><span class="av-thumb">${generateAvatarSvg(Object.assign({}, draft, { [cat.key]: it.id, crop: cat.crop }), 84)}</span><b>${esc(it.name)}</b>${own ? (sel ? '<small style="color:#0369a1">✔ Equipped</small>' : '') : `<small>🔒 ${it.cost} ⭐</small>`}</button>`;
        }).join('')}</div>
      </div></div>`;
    c.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(c); });
    c.querySelectorAll('.av-item').forEach(b => b.onclick = () => pick(c, cat, b.dataset.id));
    $('avSave').onclick = () => {
      fixDraft(state.currentUser);
      state.updateCurrentUserProfile({ avatar: Object.assign({}, draft) });
      showToast('Avatar saved! 🎉', 'success'); renderApp();
    };
    $('avRandom').onclick = () => {
      CAT.forEach(ct => { const ok = ct.items.filter(it => isOwned(state.currentUser, ct.key, it)); draft[ct.key] = ok[Math.floor(Math.random() * ok.length)].id; });
      render(c);
    };
  }
  function pick(c, cat, id) {
    const u = state.currentUser, it = cat.items.find(i => String(i.id) === String(id)); if (!it) return;
    if (isOwned(u, cat.key, it)) { draft[cat.key] = it.id; return render(c); }
    scSyncMe();
    const stars = state.currentUser.stars || 0;
    if (stars < it.cost) return showToast(`You need ${it.cost - stars} ⭐ to unlock \"${it.name}".`, 'warning');
    if (!confirm(`Unlock \"${it.name}\" for ${it.cost} ⭐?\nYou will have ${stars - it.cost} ⭐.`)) return;
    state.updateCurrentUserProfile({ stars: stars - it.cost, unlocked: (state.currentUser.unlocked || []).concat(cat.key + ':' + it.id) });
    draft[cat.key] = it.id;
    showToast(`🔓 You unlocked \"${it.name}"!`, 'success'); renderApp();
  }
  window.renderStudentAvatarSection = render;
  window.renderTeacherAvatarSection = render;
  const _sec = window.renderActiveSection; let last = null;
  window.renderActiveSection = function (t) {
    if (state.currentSection === 'avatar' && last !== 'avatar') draft = null;
    last = state.currentSection; return _sec(t);
  };
})();
