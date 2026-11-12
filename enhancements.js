/* SmartClass – Mejoras: tareas dirigidas, entrega con respuesta + foto, duelos reales con banco de temas, avisos */
(function () {
  const $ = (id) => document.getElementById(id);
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const shuffle = (arr) => arr.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  // ---------- Banco de preguntas por tema ----------
  function numQ(text, ans, exp) {
    const set = new Set([ans]);
    while (set.size < 4) { const d = ans + rnd(-9, 9) || 1; if (d >= 0 || ans < 0) set.add(d); }
    const opts = shuffle([...set]);
    return { q: text, options: opts.map(String), correct: opts.indexOf(ans), explanation: exp };
  }
  const gen = {
    mult: () => { const a = rnd(2, 12), b = rnd(2, 12); return numQ(`How much is ${a} × ${b}?`, a * b, `${a} × ${b} = ${a * b}.`); },
    div: () => { const b = rnd(2, 12), r = rnd(2, 12); return numQ(`How much is ${b * r} ÷ ${b}?`, r, `${b * r} ÷ ${b} = ${r}, because ${b} × ${r} = ${b * r}.`); },
    suma: () => { const a = rnd(20, 99), b = rnd(10, 60); return Math.random() < .5 ? numQ(`How much is ${a} + ${b}?`, a + b, `${a} + ${b} = ${a + b}.`) : numQ(`How much is ${a + b} − ${b}?`, a, `${a + b} − ${b} = ${a}.`); },
    frac: () => {
      const d = rnd(3, 9), a = rnd(1, d - 2), b = rnd(1, d - a - 1 || 1);
      const ans = `${a + b}/${d}`, set = new Set([ans]);
      while (set.size < 4) set.add(`${rnd(1, d + 2)}/${Math.random() < .5 ? d : d + rnd(1, 3)}`);
      const opts = shuffle([...set]);
      return { q: `How much is ${a}/${d} + ${b}/${d}?`, options: opts, correct: opts.indexOf(ans), explanation: `With the same denominator, add the numerators: ${a}+${b} = ${a + b}, over ${d}.` };
    },
    alg: () => { const x = rnd(2, 15), a = rnd(2, 9), b = rnd(1, 20); return numQ(`Solve: ${a}x + ${b} = ${a * x + b}. What is x?`, x, `${a}x = ${a * x}, then x = ${x}.`); }
  };
  const S = (q, o, c, e) => ({ q, options: o, correct: c, explanation: e || '' });
  const STATIC = {
    '🌍 Natural Sciences': [S('Which organ pumps blood?', ['Lung', 'Heart', 'Liver', 'Kidney'], 1, 'The heart pumps blood.'), S('Which gas do plants absorb for photosynthesis?', ['Oxygen', 'CO₂', 'Nitrogen', 'Helium'], 1), S('What is the largest planet in the Solar System?', ['Mars', 'Earth', 'Jupiter', 'Venus'], 2), S('At what temperature does water freeze?', ['0 °C', '10 °C', '50 °C', '100 °C'], 0), S('Which animal is a mammal?', ['Shark', 'Dolphin', 'Tuna', 'Octopus'], 1, 'Dolphins breathe air and nurse their young.'), S('Approximately how many bones does an adult have?', ['106', '206', '306', '406'], 1)],
    '🏛️ Social Studies and Colombia': [S('What is the capital of Colombia?', ['Medellin', 'Cali', 'Bogota', 'Barranquilla'], 2), S('In what year did Colombia become independent (1810 cry)?', ['1492', '1810', '1910', '1750'], 1), S('Which ocean washes the Colombian Caribbean coast?', ['Pacific', 'Indian', 'Atlantic', 'Arctic'], 2, 'The Caribbean Sea is part of the Atlantic.'), S('How many continents are there?', ['5', '6', '7', '8'], 2), S('Who led the independence of several Andean countries?', ['Simon Bolivar', 'Christopher Columbus', 'Napoleon', 'Julius Caesar'], 0)],
    '✍️ English Spelling and Grammar': [S('What type of word is \"quickly\"?', ['Noun', 'Adverb', 'Verb', 'Adjective'], 1), S('Which one is spelled correctly?', ['Receive', 'Recieve', 'Receve', 'Receeve'], 0, '\"Receive\" follows the rule: i before e, except after c.'), S('Synonym of \"happy\":', ['Sad', 'Glad', 'Angry', 'Tired'], 1), S('How many syllables does \"butterfly\" have?', ['3', '4', '5', '2'], 0), S('Opposite of \"big\":', ['Huge', 'High', 'Small', 'Strong'], 2)],
    '🇬🇧 English': [S('Which animal says "meow"?', ['Dog', 'Cat', 'Bird', 'Fish'], 1), S('Choose the correct form: "She ___ a student."', ['am', 'are', 'is', 'be'], 2), S('What is the past of "go"?', ['Goed', 'Went', 'Gone', 'Going'], 1), S('"Blue" is a...', ['Number', 'Color', 'Animal', 'Day'], 1), S('Opposite of "hot":', ['Cold', 'Warm', 'Big', 'Fast'], 0)],
    '📐 Geometry': [S('How many sides does a hexagon have?', ['5', '6', '7', '8'], 1), S('What do the interior angles of a triangle add up to?', ['90°', '180°', '270°', '360°'], 1), S('Area of a square with side 7:', ['14', '28', '49', '56'], 2, 'Area = side × side = 49.'), S('Perimeter of a 5 × 3 rectangle:', ['8', '15', '16', '30'], 2, '2(5+3) = 16.'), S('What is a 90° angle called?', ['Acute', 'Right', 'Obtuse', 'Straight'], 1)]
  };
  const TOPICS = {
    '✖️ Multiplication': () => gen.mult(), '➗ Division': () => gen.div(), '➕ Addition and Subtraction': () => gen.suma(),
    '🍕 Fractions': () => gen.frac(), '🧪 Algebra and Equations': () => gen.alg(),
    '🔢 Mental Math (mixed)': () => gen[['mult', 'div', 'suma', 'frac'][rnd(0, 3)]](),
    ...Object.fromEntries(Object.entries(STATIC).map(([k, v]) => [k, v]))
  };
  function buildQuestions(topic, n) {
    const t = TOPICS[topic] || TOPICS['🔢 Mental Math (mixed)'];
    if (typeof t === 'function') return Array.from({ length: n }, () => t());
    return shuffle(t).slice(0, n);
  }

  // ---------- Modal de juego ----------
  function ensureGameModal() {
    if ($('gameModal')) return;
    const d = document.createElement('div');
    d.className = 'modal-overlay'; d.id = 'gameModal';
    d.innerHTML = '<div class="modal-content game-box"><div class="modal-header"><h3 id="gameTitle"></h3></div><div class="modal-body" id="gameBody"></div></div>';
    document.body.appendChild(d);
  }
  function playGame(title, questions, onDone) {
    ensureGameModal();
    let i = 0, score = 0;
    $('gameTitle').textContent = title;
    $('gameModal').classList.add('active');
    const body = $('gameBody');
    function show() {
      if (i >= questions.length) {
        const pct = Math.round(score / questions.length * 100);
        body.innerHTML = `<div class="game-end"><div class="game-emoji">${pct >= 70 ? '🏆' : '💪'}</div><h2>${score} / ${questions.length} correctas</h2><p>Score: <b>${pct}</b></p><button class="btn-primary" id="gameFinish">Finish</button></div>`;
        $('gameFinish').onclick = () => { $('gameModal').classList.remove('active'); onDone(pct); };
        return;
      }
      const q = questions[i];
      body.innerHTML = `<div class="game-progress"><span style="width:${i / questions.length * 100}%"></span></div>
        <div class="game-count">Question ${i + 1} of ${questions.length}</div><h3 class="game-q">${q.q}</h3>
        <div class="game-opts">${q.options.map((o, k) => `<button class="game-opt" data-k="${k}">${o}</button>`).join('')}</div><div id="gameFb"></div>`;
      body.querySelectorAll('.game-opt').forEach(b => b.onclick = () => {
        const k = +b.dataset.k, ok = k === q.correct;
        if (ok) score++;
        body.querySelectorAll('.game-opt').forEach(x => { x.disabled = true; if (+x.dataset.k === q.correct) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        $('gameFb').innerHTML = `<p class="game-fb ${ok ? 'ok' : 'bad'}">${ok ? 'Correct! 🎉' : 'Incorrect.'} ${q.explanation || ''}</p><button class="btn-primary" id="gameNext">${i + 1 === questions.length ? 'See result' : 'Next ➜'}</button>`;
        $('gameNext').onclick = () => { i++; show(); };
      });
    }
    show();
  }

  window.scPlay = playGame; window.scBuild = buildQuestions; window.scTopics = () => Object.keys(TOPICS);

  // ---------- Duelos reales ----------
  const _openInvite = window.openInviteDuelModal;
  window.openInviteDuelModal = function () {
    _openInvite();
    const sel = $('duelTopicSelect');
    if (sel) sel.innerHTML = Object.keys(TOPICS).map(t => `<option value="${t}">${t}</option>`).join('');
    if (!$('duelCountSelect') && sel) {
      const g = document.createElement('div'); g.className = 'form-group';
      g.innerHTML = '<label for="duelCountSelect">Number of questions:</label><select id="duelCountSelect" class="form-control"><option>5</option><option>10</option><option>15</option></select>';
      sel.parentElement.after(g);
    }
  };
  window.handleSendDuelInviteSubmit = function (e) {
    e.preventDefault();
    const v = $('duelOpponentSelect')?.value;
    if (!v) return showToast('Select a classmate to invite them.', 'warning');
    const [oppEmail, oppName] = v.split('|'), u = state.currentUser, topic = $('duelTopicSelect').value;
    const n = parseInt($('duelCountSelect')?.value) || 5;
    const duel = { id: 'duel-' + Date.now(), grade: String(u.grade), challengerName: u.name, challengerEmail: u.email, opponentName: oppName, opponentEmail: oppEmail, topic, questions: buildQuestions(topic, n), status: 'pending', challengerScore: null, opponentScore: null, winner: null };
    closeInviteDuelModal();
    playGame(`⚔️ Your turn: ${topic}`, duel.questions, (score) => {
      duel.challengerScore = score;
      const d = state.getDuels(); d.unshift(duel); state.saveDuels(d);
      showToast(`You scored ${score}. Challenge sent to ${oppName}! They will get it when they log in.`, 'success'); renderApp();
    });
  };
  function awardStudent(email, pts, stars) {
    const list = state.getStudents(), s = list.find(x => x.email === email);
    if (!s) return;
    s.points = (s.points || 0) + pts; s.stars = (s.stars || 0) + stars;
    s.level = s.points >= 300 ? 'Subject Expert' : s.points >= 100 ? 'Explorer' : 'Apprentice';
    state.saveStudents(list);
  }
  window.acceptDuelChallenge = function (id) {
    const duels = state.getDuels(), d = duels.find(x => x.id === id);
    if (!d) return;
    if (!d.questions) d.questions = buildQuestions(d.topic, 5);
    playGame(`⚔️ ${d.challengerName} vs ${d.opponentName}: ${d.topic}`, d.questions, (score) => {
      d.opponentScore = score; d.status = 'completed';
      const c = d.challengerScore ?? 0;
      d.winner = score > c ? d.opponentName : score < c ? d.challengerName : 'Tie';
      state.saveDuels(duels);
      
      showToast(`Result: ${d.challengerName} ${c} – ${score} ${d.opponentName}. ${d.winner === 'Tie' ? 'It\'s a tie!' : 'Winner: ' + d.winner}`, 'success'); renderApp();
    });
  };

  // ---------- Tareas dirigidas ----------
  const _byGrade = SmartClassState.prototype.getTasksByGrade;
  SmartClassState.prototype.getTasksByGrade = function (g) {
    const list = _byGrade.call(this, g), u = this.currentUser;
    if (!u || u.role !== 'estudiante') return list;
    return list.filter(t => !t.assignedTo || !t.assignedTo.length || t.assignedTo.includes(u.email));
  };
  function renderTargets() {
    const box = $('taskTargetList'); if (!box) return;
    const g = $('taskGradeSelect').value;
    const st = state.getStudentsByGrade(g);
    box.innerHTML = st.length ? st.map(s => `<label class="tt-item"><input type="checkbox" value="${s.email}"> ${s.name}</label>`).join('') : '<em>There are no students registered in this grade.</em>';
  }
  window.toggleTaskTargets = function () {
    const sp = document.querySelector('input[name="taskTarget"]:checked')?.value === 'some';
    $('taskTargetList').style.display = sp ? 'grid' : 'none';
  };
  const _openTask = window.openNewTaskModal;
  window.openNewTaskModal = function () {
    _openTask();
    if (!$('taskTargetBox')) {
      const g = document.createElement('div'); g.className = 'form-group'; g.id = 'taskTargetBox';
      g.innerHTML = `<label>Who is the homework for?</label>
        <div class="tt-radios"><label><input type="radio" name="taskTarget" value="all" checked onchange="toggleTaskTargets()"> The whole grade</label>
        <label><input type="radio" name="taskTarget" value="some" onchange="toggleTaskTargets()"> Specific students</label></div>
        <div id="taskTargetList" class="tt-list" style="display:none"></div>`;
      $('taskDescInput').parentElement.before(g);
      $('taskGradeSelect').addEventListener('change', renderTargets);
    }
    document.querySelector('input[name="taskTarget"][value="all"]').checked = true;
    renderTargets(); toggleTaskTargets();
  };
  const _createTask = window.handleCreateTaskSubmit;
  window.handleCreateTaskSubmit = function (e) {
    e.preventDefault();
    let assigned = [];
    if (document.querySelector('input[name="taskTarget"]:checked')?.value === 'some') {
      assigned = [...document.querySelectorAll('#taskTargetList input:checked')].map(i => i.value);
      if (!assigned.length) return showToast('Choose at least one student or select \"The whole grade\".', 'warning');
    }
    _createTask(e);
    const tasks = state.getTasks();
    if (tasks[0]) { tasks[0].assignedTo = assigned; state.saveTasks(tasks); renderApp(); }
    if (assigned.length) showToast(`Homework sent to ${assigned.length} student(s).`, 'success');
  };

  // ---------- Entrega: respuesta escrita + foto ----------
  const NOPHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#e0f2fe"/><text x="200" y="105" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#0369a1">Written answer (no photo)</text></svg>');
  const _openSub = window.openSubmitHomeworkModal;
  window.openSubmitHomeworkModal = function (id) {
    _openSub(id);
    if (!$('submitTaskAnswer')) {
      const g = document.createElement('div'); g.className = 'form-group';
      g.innerHTML = '<label for="submitTaskAnswer">✍️ Your answer / work on the homework</label><textarea id="submitTaskAnswer" class="form-control" rows="4" placeholder="Write the solution here…"></textarea>';
      $('submitTaskComments').parentElement.before(g);
    }
    const t = state.getTasks().find(x => x.id === id), ex = t?.submissions?.find(s => s.studentEmail === state.currentUser.email);
    $('submitTaskAnswer').value = ex?.answer || '';
  };
  const _submit = window.handleSubmitHomework;
  window.handleSubmitHomework = function (e) {
    e.preventDefault();
    const ans = $('submitTaskAnswer')?.value.trim() || '', had = !!uploadedPhotoDataUrl, id = activeTaskToSubmitId, email = state.currentUser.email;
    if (!ans && !had) return showToast('Write your answer or upload a photo before sending.', 'warning');
    const c = $('submitTaskComments');
    if (ans) c.value = `Answer: ${ans}` + (c.value.trim() ? `\n\nComentario: ${c.value.trim()}` : '');
    _submit(e);
    const tasks = state.getTasks(), s = tasks.find(t => t.id === id)?.submissions?.find(x => x.studentEmail === email);
    if (s) { s.answer = ans; if (!had) s.photoUrl = NOPHOTO; state.saveTasks(tasks); renderApp(); }
  };

  // ---------- Avisos al entrar ----------
  const _render = window.renderApp;
  window.renderApp = function () {
    _render();
    const u = state.currentUser;
    if (!u || u.role !== 'estudiante') return;
    const tasks = state.getTasksByGrade(u.grade).filter(t => !t.submissions?.some(s => s.studentEmail === u.email)).length;
    const duels = state.getDuels().filter(d => d.opponentEmail === u.email && d.status === 'pending').length;
    const sig = u.email + ':' + tasks + ':' + duels, k = 'sc_notice';
    if ((tasks || duels) && sessionStorage.getItem(k) !== sig) {
      sessionStorage.setItem(k, sig);
      setTimeout(() => showToast(`🔔 You have ${tasks} homework(s) to submit and ${duels} challenge(s) waiting for you.`, 'info'), 400);
    }
  };
})();

/* ---------- Apuntes compartidos: +5 estrellas al autor cuando otro estudiante descarga por primera vez ---------- */
(function () {
  const $ = (id) => document.getElementById(id);
  const KEY = STORAGE_KEYS.MATERIALS, MAX = 1500000;
  const get = () => state.load(KEY) || [];
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function ensure() {
    if ($('materialsModal')) return;
    const d = document.createElement('div'); d.className = 'modal-overlay'; d.id = 'materialsModal';
    d.innerHTML = `<div class="modal-content game-box" style="max-width:680px"><div class="modal-header"><h3>📚 Shared Notes</h3><button class="modal-close-btn" onclick="document.getElementById('materialsModal').classList.remove('active')">&times;</button></div><div class="modal-body" id="materialsBody"></div></div>`;
    document.body.appendChild(d);
  }
  function render() {
    const u = state.currentUser, list = get().filter(m => String(m.grade) === String(u.grade)).reverse();
    $('materialsBody').innerHTML = `
      <p style="font-size:.88rem;color:var(--text-muted);margin-bottom:.75rem">Share your notes. You earn <b>5 ⭐</b> when another classmate downloads them for the first time.</p>
      <div class="mat-form"><input id="matTitle" class="form-control" placeholder="Title (e.g. Fractions summary)"><input id="matSubject" class="form-control" placeholder="Subject">
      <input id="matFile" type="file" class="form-control" accept="image/*,.pdf,.txt,.doc,.docx"><button class="btn-primary" id="matUp">⬆️ Share notes</button></div>
      <h4 style="margin:1rem 0 .5rem;color:var(--navy)">Grade notes ${u.grade}</h4>
      ${list.length ? list.map(m => `<div class="mat-item"><div><strong>${esc(m.title)}</strong><div style="font-size:.78rem;color:var(--text-muted)">${esc(m.subject || 'General')} • ${esc(m.authorName)} • ${m.downloadedBy.length} descarga(s)</div></div>
        <a class="btn-yellow mat-dl" href="${m.dataUrl}" download="${esc(m.fileName)}" data-id="${m.id}">⬇️ Download</a></div>`).join('') : '<em>There are no notes yet. Be the first to share!</em>'}`;
    $('matUp').onclick = upload;
    document.querySelectorAll('.mat-dl').forEach(a => a.addEventListener('click', () => download(a.dataset.id)));
  }
  function upload() {
    const f = $('matFile').files[0], title = $('matTitle').value.trim();
    if (!title || !f) return showToast('Write a title and choose a file.', 'warning');
    if (f.size > MAX) return showToast('The file is too large (max. 1.5 MB).', 'warning');
    const r = new FileReader();
    r.onload = () => {
      const u = state.currentUser, l = get();
      l.push({ id: 'mat-' + Date.now(), title, subject: $('matSubject').value.trim(), grade: String(u.grade), authorEmail: u.email, authorName: u.name, fileName: f.name, dataUrl: r.result, downloadedBy: [] });
      try { state.save(KEY, l); } catch (e) { return showToast('There is no space to save the file.', 'warning'); }
      showToast('Note shared!', 'success'); render();
    };
    r.readAsDataURL(f);
  }
  function download(id) {
    const u = state.currentUser, l = get(), m = l.find(x => x.id === id);
    if (!m || m.authorEmail === u.email || m.downloadedBy.includes(u.email)) return;
    const first = m.downloadedBy.length === 0;
    m.downloadedBy.push(u.email);
    if (first) {
      const st = state.getStudents(), a = st.find(s => s.email === m.authorEmail);
      
    }
    state.save(KEY, l);
    setTimeout(render, 300);
    if (first) showToast(`${m.authorName} earned 5 ⭐ for sharing this note.`, 'info');
  }
  window.openModalBiblioteca = function () { ensure(); render(); $('materialsModal').classList.add('active'); };
})();

/* ---------- Nuevo inicio del estudiante ---------- */
(function () {
  window.renderStudentMainMenu = function (c) {
    const u = state.currentUser, g = u.grade;
    const pts = u.points || 0, next = pts >= 300 ? null : pts >= 100 ? 300 : 100, base = pts >= 100 ? (pts >= 300 ? 300 : 100) : 0;
    const pct = next ? Math.round((pts - base) / (next - base) * 100) : 100;
    const mine = (a) => a?.some(s => s.studentEmail === u.email);
    const tasks = state.getTasksByGrade(g).filter(t => !mine(t.submissions)).length;
    const exams = state.getExamsByGrade(g).filter(e => !mine(e.submissions)).length;
    const duels = state.getDuels().filter(d => d.opponentEmail === u.email && d.status === 'pending').length;
    const card = (cls, ico, t, d, act, n) => `<button class="home-card ${cls}" onclick="${act}"><span class="home-ico">${ico}</span>${n ? `<em class="home-badge">${n}</em>` : ''}<strong>${t}</strong><small>${d}</small></button>`;
    c.innerHTML = `
      <section class="home-hero"><div class="home-hero-l"><div class="home-av">${generateAvatarSvg(u.avatar || {}, 96)}</div>
        <div><h2>Hi, ${u.name.split(' ')[0]}! 👋</h2><p>Grade ${g} <b>${u.level || 'Apprentice'}</b></p></div></div>
        <div class="home-stats"><div><b>${pts}</b><span>Points</span></div><div><b>${u.stars || 0} ⭐</b><span>Stars</span></div></div>
        <div class="home-level"><div class="home-bar"><i style="width:${pct}%"></i></div><small>${next ? `${next - pts} points to the next level` : 'Maximum level reached! 🎓'}</small></div></section>
      ${tasks || exams || duels ? `<div class="home-alert">🔔 You have <b>${tasks}</b> homework(s), <b>${exams}</b> exam(s) and <b>${duels}</b> challenge(s) pending.</div>` : ''}
      <div class="home-grid">
        ${card('c-blue', '📤', 'My Homework', 'Solve and upload your photo', "switchSection('tareas')", tasks)}
        ${card('c-yellow', '📝', 'My Exams', 'Answer and send to the teacher', "switchSection('examenes')", exams)}
        ${card('c-purple', '⚔️', 'Compete', 'Challenge a classmate', "switchSection('competir')", duels)}
        ${card('c-green', '🎮', 'Quizzes and Practice', 'Unlimited questions', "switchSection('actividades')")}
        ${card('c-orange', '📚', 'Shared Notes', 'Earn 5 ⭐ by sharing', 'openModalBiblioteca()')}
        ${card('c-teal', '🤝', 'Tutoring', 'Help and learn in a group', "switchSection('tutoria')")}
        ${card('c-pink', '🧑‍🎨', 'My Avatar', 'Customize your look', "switchSection('avatar')")}
        ${card('c-navy', '📊', 'My Grades', 'See your progress', "switchSection('calificaciones')")}
      </div>`;
  };
})();

/* ---------- Detalle a pantalla completa + descarga en Word / PDF + responder ---------- */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let photo = null, taskImg = null;
  const readFile = (f, cb) => { const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(f); };

  // Imagen adjunta opcional al crear tarea (docente)
  const _open = window.openNewTaskModal;
  window.openNewTaskModal = function () {
    _open(); taskImg = null;
    if (!$('taskImageInput')) {
      const g = document.createElement('div'); g.className = 'form-group';
      g.innerHTML = '<label for="taskImageInput">🖼️ Image for the homework (optional)</label><input type="file" id="taskImageInput" class="form-control" accept="image/*">';
      $('taskDescInput').parentElement.after(g);
      $('taskImageInput').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; if (f.size > 1200000) { e.target.value = ''; return showToast('The image is larger than 1.2 MB.', 'warning'); } readFile(f, d => taskImg = d); });
    }
    $('taskImageInput').value = '';
  };
  const _create = window.handleCreateTaskSubmit;
  window.handleCreateTaskSubmit = function (e) {
    const img = taskImg, n = state.getTasks().length;
    _create(e);
    const t = state.getTasks();
    if (img && t.length > n) { t[0].image = img; state.saveTasks(t); }
  };

  // ----- Modelo del documento -----
  function model(kind, it) {
    if (kind === 'task') return { label: 'Homework', title: it.title, meta: [['Subject', it.subject], ['Grade', it.grade + ''], ['Due date', it.dueDate], ['Points', it.points], ['Teacher', it.createdBy]], body: it.description, image: it.image };
    if (kind === 'act') return { label: 'Activity', title: it.title.replace(/[^\u0000-\u024f]/g, '').trim(), meta: [['Type', it.type === 'trivia' ? 'Trivia' : 'Memory'], ['Topic', it.topic], ['Grade', it.grade + ''], ['Points', it.points]], body: it.desc };
    return { label: 'Tutoring', title: it.title, meta: [['Subject', it.subject], ['Organizer', it.hostName], ['Schedule', it.time], ['Participants', (it.attendees || []).join(', ')]], body: it.desc };
  }
  const slug = (m) => (m.label + '_' + m.title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '_').slice(0, 60);
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const html = (m) => `<h1 style="color:#1e3a8a">${esc(m.title)}</h1><p style="color:#0284c7"><b>SmartClass — ${m.label}</b></p>
    <table style="border-collapse:collapse">${m.meta.filter(r => r[1] !== '' && r[1] != null).map(r => `<tr><td style="border:1px solid #cbd5e1;padding:4px 10px;background:#e0f2fe"><b>${r[0]}</b></td><td style="border:1px solid #cbd5e1;padding:4px 10px">${esc(r[1])}</td></tr>`).join('')}</table>
    <h3 style="color:#1e3a8a">Instructions</h3><p style="font-size:12pt;line-height:1.5">${esc(m.body).replace(/\n/g, '<br>')}</p>${m.image ? `<p><img src="${m.image}" width="420"></p>` : ''}`;

  function toWord(m) {
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(m.title)}</title><style>body{font-family:Calibri,Arial,sans-serif}</style></head><body>${html(m)}</body></html>`;
    save(new Blob(['\ufeff', doc], { type: 'application/msword' }), slug(m) + '.doc');
    showToast('Downloaded as Word. Open it from your downloads.', 'success');
  }
  function printPdf(m) {
    const w = window.open('', '_blank'); if (!w) return showToast('Allow pop-ups to generate the PDF.', 'warning');
    w.document.write(`<html><head><meta charset="utf-8"><title>${esc(m.title)}</title><style>body{font-family:Arial;padding:30px}img{max-width:100%}</style></head><body>${html(m)}</body></html>`); w.document.close();
    setTimeout(() => w.print(), 400);
  }
  const loadPdfLib = () => new Promise((ok, no) => { if (window.jspdf) return ok(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  async function toPdf(m) {
    try { await loadPdfLib(); } catch (e) { return printPdf(m); }
    const d = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), clean = (t) => String(t ?? '').replace(/[^\u0000-\u00ff]/g, '');
    let y = 30;
    d.setFillColor(30, 58, 138); d.rect(0, 0, 210, 22, 'F'); d.setTextColor(255); d.setFontSize(16); d.text('SmartClass - ' + m.label, 15, 14);
    d.setTextColor(30, 58, 138); d.setFontSize(18); d.text(d.splitTextToSize(clean(m.title), 180), 15, y); y += 12;
    d.setFontSize(11); d.setTextColor(40);
    m.meta.filter(r => r[1] !== '' && r[1] != null).forEach(r => { d.text(clean(r[0] + ': ' + r[1]), 15, y); y += 6; });
    y += 4; d.setFontSize(13); d.setTextColor(30, 58, 138); d.text('Instructions', 15, y); y += 7; d.setFontSize(11); d.setTextColor(40);
    d.splitTextToSize(clean(m.body), 180).forEach(l => { if (y > 280) { d.addPage(); y = 20; } d.text(l, 15, y); y += 5.5; });
    if (m.image) await new Promise(ok => { const im = new Image(); im.onload = () => { const w = 120, h = w * im.height / im.width; if (y + h > 285) { d.addPage(); y = 20; } try { d.addImage(m.image, /png/.test(m.image) ? 'PNG' : 'JPEG', 15, y + 4, w, h); } catch (e) { } ok(); }; im.onerror = ok; im.src = m.image; });
    d.save(slug(m) + '.pdf'); showToast('PDF downloaded.', 'success');
  }
  const find = (kind, id) => (kind === 'task' ? state.getTasks() : kind === 'act' ? state.getActivities() : state.getTutorings()).find(x => x.id === id);
  window.scDownload = (kind, id, fmt) => { const it = find(kind, id); if (!it) return; const m = model(kind, it); fmt === 'pdf' ? toPdf(m) : toWord(m); };
  window.downloadTaskGuide = (id) => scDownload('task', id, 'word');

  // ----- Detalle a toda la página -----
  window.closeDetailPage = () => { $('detailPage')?.remove(); document.body.style.overflow = ''; };
  window.openDetail = function (kind, id) {
    const it = find(kind, id), u = state.currentUser; if (!it || !u) return;
    closeDetailPage(); photo = null;
    const m = model(kind, it), mySub = kind === 'task' ? it.submissions?.find(s => s.studentEmail === u.email) : (kind === 'act' ? it.submissions?.find(s => s.studentEmail === u.email) : null);
    const colors = { task: '#0284c7,#38bdf8', act: '#16a34a,#34d399', tut: '#0d9488,#2dd4bf' };
    const status = mySub ? (mySub.reviewed ? `<div class="dt-status ok">🎉 Graded: <b>${esc(mySub.gradeMark)}</b> — ${esc(mySub.feedback)}</div>` : '<div class="dt-status">⏳ You already submitted this homework. You can submit it again to replace it.</div>') : '';
    const respond = kind === 'tut'
      ? `<button class="btn-primary" onclick="joinTutoringSession('${id}');openDetail('tut','${id}')">🤝 Join the session</button>`
      : `<h3>✍️ ${kind === 'task' ? 'Answer homework' : 'Upload homework'}</h3>
         <textarea id="dtAnswer" class="form-control" rows="5" placeholder="Write your answer here…">${esc(mySub?.answer || '')}</textarea>
         <label class="dt-photo"><input type="file" id="dtFile" accept="image/*" hidden>📷 Upload a photo of my work</label><div id="dtPrev"></div>
         <div class="dt-actions"><button class="btn-primary" onclick="scSendDetail('${kind}','${id}')">📤 Submit homework</button>${kind === 'act' ? `<button class="btn-yellow" onclick="scPlayAct('${id}')">🎮 Play now</button>` : ''}</div>`;
    const d = document.createElement('div'); d.id = 'detailPage'; d.className = 'detail-page';
    d.innerHTML = `<div class="dt-head" style="background:linear-gradient(135deg,${colors[kind]})"><button class="dt-back" onclick="closeDetailPage()">← Back</button><span class="dt-kind">${m.label}</span><h1>${esc(m.title)}</h1></div>
      <div class="dt-body"><div class="dt-meta">${m.meta.filter(r => r[1] !== '' && r[1] != null).map(r => `<div><small>${r[0]}</small><b>${esc(r[1])}</b></div>`).join('')}</div>
      ${status}<h3>📋 Teacher's instructions</h3><p class="dt-text">${esc(m.body).replace(/\n/g, '<br>')}</p>
      ${m.image ? `<img class="dt-img" src="${m.image}" alt="Homework image"><a class="btn-secondary btn-sm" href="${m.image}" download="imagen_${slug(m)}.png">🖼️ Download image</a>` : ''}
      <div class="dt-actions dl"><button class="btn-secondary" onclick="scDownload('${kind}','${id}','word')">📄 Download as Word</button><button class="btn-secondary" onclick="scDownload('${kind}','${id}','pdf')">📕 Download as PDF</button></div>
      <div class="dt-respond">${respond}</div></div>`;
    document.body.appendChild(d); document.body.style.overflow = 'hidden';
    $('dtFile')?.addEventListener('change', e => { const f = e.target.files[0]; if (f) readFile(f, x => { photo = x; $('dtPrev').innerHTML = `<img class="dt-img" src="${x}">`; }); });
  };
  window.scSendDetail = function (kind, id) {
    const ans = $('dtAnswer').value.trim();
    if (!ans && !photo) return showToast('Write your answer or upload a photo.', 'warning');
    if (kind === 'task') {
      openSubmitHomeworkModal(id); uploadedPhotoDataUrl = photo || uploadedPhotoDataUrl;
      $('submitTaskAnswer').value = ans; $('submitTaskComments').value = '';
      handleSubmitHomework({ preventDefault() { } }); closeDetailPage(); return;
    }
    const a = state.getActivities(), act = a.find(x => x.id === id), u = state.currentUser;
    act.submissions = (act.submissions || []).filter(s => s.studentEmail !== u.email);
    act.submissions.push({ studentEmail: u.email, studentName: u.name, answer: ans, photoUrl: photo || '', date: new Date().toLocaleDateString('en-US') });
    state.saveActivities(a); showToast('Homework sent!', 'success'); closeDetailPage(); renderApp();
  };
  const guess = (a) => { const t = (a.topic + ' ' + a.title).toLowerCase(), has = (r) => r.test(t); return has(/multipl|times table|tabla/) ? '✖️ Multiplication' : has(/divis|divid/) ? '➗ Division' : has(/fracc|fraction/) ? '🍕 Fractions' : has(/álgebra|algebra|ecuac|equation/) ? '🧪 Algebra and Equations' : has(/suma|resta|addition|subtract|plus|minus/) ? '➕ Addition and Subtraction' : has(/solar|planet|ciencia|scien|natur|cuerpo|body|animal|biolog/) ? '🌍 Natural Sciences' : has(/ingl|english/) ? '🇬🇧 English' : has(/geometr|angle|triangle|area/) ? '📐 Geometry' : has(/social|colombia|histor|geograf/) ? '🏛️ Social Studies and Colombia' : '🔢 Mental Math (mixed)'; };
  window.scPlayAct = function (id) {
    const a = state.getActivities(), act = a.find(x => x.id === id); closeDetailPage();
    scPlay(act.title, scBuild(guess(act), 5), (score) => {
      act.doneBy = act.doneBy || [];
      if (score >= 60 && !act.doneBy.includes(state.currentUser.email)) { act.doneBy.push(state.currentUser.email); state.saveActivities(a); showToast('Activity completed! 🎉', 'success'); }
      else showToast(`You scored ${score}. ${score < 60 ? 'You need 60 to earn the points; try again!' : 'You had already earned the points for this activity.'}`, 'info');
      renderApp();
    });
  };
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-kind]');
    if (!c || e.target.closest('button,a,input,select,textarea,label') || state.currentUser?.role !== 'estudiante') return;
    openDetail(c.dataset.kind, c.dataset.id);
  });
})();
