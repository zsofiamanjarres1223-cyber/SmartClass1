/* SmartClass – admin.js
   Loaded AFTER teacher.js. Adds:
   1) Teachers by grade: the administrator assigns grades to each teacher; teachers only see their grades.
   2) Administrator portal (assign grades, add / remove teachers).
   3) Interactive activities with 4 clearly different formats. Click a format to preview how it works,
      choose ABCD or "student writes in their own words", edit the content and publish.
   4) Homework: the teacher can simply type the task (no file needed).
*/
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ALL = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const me = () => state.currentUser;
  const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

  /* =====================================================================
     1) TEACHERS BY GRADE
     ===================================================================== */
  const TK = STORAGE_KEYS.TEACHERS;
  const getT = () => state.load(TK) || [];
  const saveT = (v) => state.save(TK, v);
  const sortG = (g) => [...new Set((g || []).map(String))].sort((a, b) => a - b);
  const DEFAULT_ROSTER = [
    { name: 'Prof. Roberto Mendoza', email: 'roberto.mendoza@smartclass.edu', grades: ['5', '6', '7'] },
    { name: 'Prof. Tatiana Ruiz', email: 'tatiana.ruiz@smartclass.edu', grades: ['1', '2'] },
    { name: 'Prof. Sofía Vargas', email: 'sofia.vargas@smartclass.edu', grades: ['1', '3'] },
    { name: 'Prof. Nelson Pardo', email: 'nelson.pardo@smartclass.edu', grades: ['1', '4'] },
    { name: 'Prof. Carolina Gómez', email: 'carolina.gomez@smartclass.edu', grades: ['5', '8'] },
    { name: 'Prof. David Herrera', email: 'david.herrera@smartclass.edu', grades: ['9', '10', '11'] }
  ];
  const teacherBase = (name, email, grades) => ({
    id: 'tch-' + Date.now() + Math.floor(Math.random() * 1000), name, email, role: 'docente', subject: 'General', grades: sortG(grades),
    avatar: { skin: '#ffd1a4', hair: 'short', hairColor: '#334155', clothes: 'blazer', clothesColor: '#1e3a8a', expression: 'smile', accessory: 'glasses' }
  });
  (function ensureRoster() {
    try {
      if (localStorage.getItem('smartclass_roster_v1')) return;
      const list = getT();
      DEFAULT_ROSTER.forEach(d => {
        const t = list.find(x => x.email === d.email);
        if (t) t.grades = sortG(d.grades); else list.push(teacherBase(d.name, d.email, d.grades));
      });
      list.forEach(t => { if (!t.grades) t.grades = []; });
      saveT(list); localStorage.setItem('smartclass_roster_v1', '1');
    } catch (e) { }
  })();
  const findT = (email) => getT().find(t => t.email === String(email || '').toLowerCase());
  const myGrades = (u) => { if (!u || u.role !== 'docente') return ALL; const t = findT(u.email); return sortG(t ? t.grades : u.grades || []); };

  window.handleDedicatedTeacherLogin = function (e) {
    e.preventDefault();
    const name = $('cbnTeacherName').value.trim(), email = $('cbnTeacherEmail').value.trim().toLowerCase();
    const list = getT(); let t = list.find(x => x.email === email);
    if (!t) { t = teacherBase(name, email, []); list.push(t); saveT(list); }
    state.setCurrentUser(t);
    state.activeGrade = myGrades(t)[0] || '5';
    state.currentSection = 'calificaciones';
    showToast(myGrades(t).length ? `Welcome teacher ${t.name}! Your grades: ${myGrades(t).join(', ')}.` : `Welcome ${t.name}. The administrator has not assigned any grades to you yet.`, 'success');
    renderApp();
  };

  window.renderGradeSelector = function () {
    const box = $('gradePillsContainer'); if (!box) return;
    const mine = myGrades(me()), cur = String(state.activeGrade);
    const tasks = state.getTasks(), students = state.getStudents(), exams = state.getExams();
    box.innerHTML = mine.length ? mine.map(g => `<button class="grade-pill ${g === cur ? 'active' : ''}" onclick="selectGradeTeacher('${g}')">
        <span>Grade ${g}</span><span class="pill-counter">${students.filter(s => String(s.grade) === g).length} students • ${tasks.filter(t => String(t.grade) === g).length} hw • ${exams.filter(x => String(x.grade) === g).length} ex.</span></button>`).join('')
      : '<em style="padding:.5rem">No grades assigned yet.</em>';
    const b = $('activeGradeTitleBadge'); if (b) b.textContent = mine.length ? `Managing Grade ${cur}` : 'No grades assigned';
  };

  function limitGradeSelects() {
    const u = me(); if (!u || u.role !== 'docente') return;
    const mine = myGrades(u);
    ['taskGradeSelect', 'examGradeSelect', 'editTaskGradeSelect', 'newStdGradeSelect'].forEach(id => {
      const s = $(id); if (!s) return;
      [...s.options].forEach(o => { const ok = mine.includes(o.value); o.hidden = !ok; o.disabled = !ok; });
      if (!mine.includes(s.value) && mine.length) s.value = mine.includes(String(state.activeGrade)) ? String(state.activeGrade) : mine[0];
    });
  }
  ['openNewTaskModal', 'openCreateExamModal', 'openEditTaskGradeModal', 'openAddStudentModal'].forEach(n => {
    const f = window[n]; if (typeof f !== 'function') return;
    window[n] = function () { const r = f.apply(this, arguments); limitGradeSelects(); return r; };
  });

  /* =====================================================================
     2) ADMINISTRATOR PORTAL
     ===================================================================== */
  const _showGateway = window.showPortalGateway;
  window.showPortalGateway = function () { _showGateway(); const a = $('adminLoginCardView'); if (a) a.style.display = 'none'; };
  const _showRole = window.showLoginRole;
  window.showLoginRole = function (role) {
    if (role === 'admin') {
      ['portalGatewayView', 'studentLoginCardView', 'teacherLoginCardView'].forEach(i => { if ($(i)) $(i).style.display = 'none'; });
      if ($('adminLoginCardView')) $('adminLoginCardView').style.display = 'flex'; return;
    }
    if ($('adminLoginCardView')) $('adminLoginCardView').style.display = 'none';
    _showRole(role);
  };
  window.handleAdminLogin = function (e) {
    e.preventDefault();
    const name = $('cbnAdminName').value.trim() || 'Administrator', email = $('cbnAdminEmail').value.trim().toLowerCase();
    state.setCurrentUser({ id: 'adm-1', name, email, role: 'admin', avatar: { skin: '#ffd1a4', hair: 'short', hairColor: '#334155', clothes: 'blazer', clothesColor: '#0f172a', expression: 'smile', accessory: 'glasses' } });
    showToast(`Welcome ${name}. You can assign grades to teachers here.`, 'success');
    renderApp();
  };

  function adminHtml() {
    const list = getT();
    const gradeBoxes = (email, sel) => ALL.map(g => `<label class="adm-g"><input type="checkbox" data-email="${esc(email)}" value="${g}" ${sel.includes(g) ? 'checked' : ''}>${g}</label>`).join('');
    const coverage = ALL.map(g => { const names = list.filter(t => (t.grades || []).includes(g)).map(t => t.name.replace(/^Prof\.\s*/, '')); return `<div class="adm-cov"><b>Grade ${g}</b><span>${names.length ? esc(names.join(', ')) : '<em>No teacher yet</em>'}</span></div>`; }).join('');
    return `<div class="content-card"><div class="card-top-bar"><div class="card-title-group"><div class="card-title-icon" style="background:#e0e7ff;color:#3730a3">🛡️</div>
      <div class="card-title-text"><h2>Teachers and Their Grades</h2><span>Tick the grades each teacher is responsible for. Teachers only see and manage the grades you assign. A grade can have several teachers.</span></div></div></div>
      <div style="margin-top:1rem">${list.map(t => `<div class="mat-item" style="flex-wrap:wrap;align-items:flex-start"><div style="min-width:210px"><strong>${esc(t.name)}</strong><div style="font-size:.78rem;color:var(--text-muted)">${esc(t.email)}</div></div>
        <div class="adm-grades" id="adm_${esc(t.email)}">${gradeBoxes(t.email, t.grades || [])}</div>
        <div class="dt-actions"><button class="btn-primary btn-sm" onclick="scAdmSave('${esc(t.email)}')">💾 Save</button><button class="btn-secondary btn-sm" onclick="scAdmRemove('${esc(t.email)}')">🗑️ Remove</button></div></div>`).join('') || '<em>No teachers yet.</em>'}</div></div>
      <div class="content-card" style="margin-top:1.25rem"><div class="card-top-bar"><div class="card-title-group"><div class="card-title-icon">➕</div><div class="card-title-text"><h2>Add a Teacher</h2><span>Create the account and choose the grades it will manage</span></div></div></div>
        <div class="mat-form"><input id="admName" class="form-control" placeholder="Full name (e.g. Prof. Ana Torres)"><input id="admEmail" type="email" class="form-control" placeholder="teacher@smartclass.edu">
        <div class="adm-grades" id="adm_new">${gradeBoxes('new', [])}</div><button class="btn-primary" onclick="scAdmAdd()">➕ Add Teacher</button></div></div>
      <div class="content-card" style="margin-top:1.25rem"><div class="card-top-bar"><div class="card-title-group"><div class="card-title-icon">🏫</div><div class="card-title-text"><h2>Who Teaches Each Grade</h2></div></div></div><div class="adm-cov-grid">${coverage}</div></div>`;
  }
  const readGrades = (key) => [...document.querySelectorAll(`#adm_${CSS.escape(key)} input:checked`)].map(i => i.value);
  window.scAdmSave = (email) => { const l = getT(), t = l.find(x => x.email === email); if (!t) return; t.grades = sortG(readGrades(email)); saveT(l); showToast(`Grades saved for ${t.name}: ${t.grades.join(', ') || 'none'}.`, 'success'); renderApp(); };
  window.scAdmRemove = (email) => { if (!confirm('Remove this teacher account?')) return; saveT(getT().filter(x => x.email !== email)); renderApp(); };
  window.scAdmAdd = () => {
    const name = $('admName').value.trim(), email = $('admEmail').value.trim().toLowerCase();
    if (!name || !email) return showToast('Enter the teacher name and email.', 'warning');
    if (findT(email)) return showToast('A teacher with that email already exists.', 'warning');
    const l = getT(); l.push(teacherBase(name, email, readGrades('new'))); saveT(l); showToast(`${name} added.`, 'success'); renderApp();
  };

  function renderAdmin(u) {
    $('loginScreenView').style.display = 'none'; $('appDashboardView').style.display = 'block'; $('navUserPanel').style.display = 'flex';
    $('navUserName').textContent = u.name; $('navUserRole').textContent = '🛡️ Administrator'; $('navBrandBadge').textContent = 'Administration';
    $('navMiniAvatar').innerHTML = generateAvatarSvg(u.avatar, 36);
    $('gradeStripContainer').style.display = 'none';
    const nav = $('subnavTabsContainer'); nav.style.display = ''; nav.innerHTML = '<button class="subnav-tab-btn active"><span>👩‍🏫 Teachers and Grades</span></button>';
    $('mainViewContainer').innerHTML = adminHtml();
  }

  /* wrap renderApp: admin view, teacher with no grades, notices */
  const _render = window.renderApp;
  window.renderApp = function () {
    const u = me();
    if (u && u.role === 'admin') return renderAdmin(u);
    if (u && u.role === 'docente') { const g = myGrades(u); if (g.length && !g.includes(String(state.activeGrade))) state.activeGrade = g[0]; }
    _render();
    if (u && u.role === 'docente' && !myGrades(u).length) {
      $('subnavTabsContainer').innerHTML = '';
      $('mainViewContainer').innerHTML = '<div class="content-card"><div class="empty-state"><span class="empty-state-icon">🏫</span><h3>No grades assigned yet</h3><p>The administrator has not assigned any grades to your account. Once they do, your classes will appear here.</p></div></div>';
    }
    if (u && u.role === 'estudiante') notifyReviewed(u);
  };

  /* =====================================================================
     3) HOMEWORK: TYPE THE TASK (no file needed)
     ===================================================================== */
  const _createTask = window.handleCreateTaskSubmit;
  window.handleCreateTaskSubmit = function (e) {
    const txt = $('taskDescInput'), hasFile = !!($('taskDocInput')?.files?.length || $('taskImageInput')?.files?.length);
    if (!txt.value.trim()) {
      if (!hasFile) { e.preventDefault(); return showToast('Write the task in the "Task" box, or attach a file.', 'warning'); }
      txt.value = '(See the attached file.)';
    }
    return _createTask(e);
  };

  /* =====================================================================
     4) INTERACTIVE ACTIVITIES – 4 DIFFERENT FORMATS
     ===================================================================== */
  const FORMATS = {
    abcd: { icon: '🔤', name: 'Multiple Choice Quiz', tag: 'A · B · C · D', color: '#0284c7,#38bdf8', mode: 'abcd', pts: 30,
      blurb: 'One question at a time. Students tap A, B, C or D and see right away if they were correct. Best for quick reviews and vocabulary.' },
    numbered: { icon: '🔢', name: 'Numbered Questions', tag: '1 · 2 · 3 · 4 · 5', color: '#7c3aed,#a78bfa', mode: 'written', pts: 40,
      blurb: 'Five numbered questions on one page, like a short worksheet. Students answer each one, either choosing A–D or writing in their own words.' },
    matching: { icon: '🧩', name: 'Matching Card Game', tag: '🃏 flip and match', color: '#059669,#34d399', mode: 'game', pts: 25,
      blurb: 'A memory game: students flip cards to match each term with its definition. Great for new words, concepts and formulas.' },
    steps: { icon: '📐', name: 'Step-by-Step Problem', tag: '∑ show your work', color: '#ea580c,#fb923c', mode: 'written', pts: 50,
      blurb: 'One problem the student must solve step by step, for example "Solve this equation step by step". They write their work (and can add a photo) and you review it.' }
  };
  const LETTERS = ['A', 'B', 'C', 'D'];
  let curTopic = '', draft = null;

  function topicKey(topic) {
    const t = (topic || '').toLowerCase(), has = (r) => r.test(t), keys = window.scTopics ? window.scTopics() : [];
    const pick = (needle) => keys.find(k => k.includes(needle));
    return (has(/multipl|times/) && pick('Multiplication')) || (has(/divis|divid/) && pick('Division')) || (has(/fraction|fracc/) && pick('Fractions')) ||
      (has(/algebra|equation|ecuac/) && pick('Algebra')) || (has(/addition|subtract|suma|resta/) && pick('Addition')) ||
      (has(/geometr|angle|triangle|area/) && pick('Geometry')) || (has(/solar|planet|scien|natur|body|animal|biolog/) && pick('Natural')) ||
      (has(/social|colombia|histor|geograph/) && pick('Social')) || (has(/english|spelling|grammar/) && pick('English')) || '🔢 Mental Math (mixed)';
  }
  function sampleQuestions(topic) {
    let qs = []; try { qs = window.scBuild(topicKey(topic), 5); } catch (e) { }
    return qs.map(q => ({ q: q.q, options: [...q.options, '', '', ''].slice(0, 4), correct: q.correct }));
  }
  function samplePrompts(topic) {
    const t = topic || 'this topic';
    return [`Explain "${t}" in your own words.`, `Give one example related to "${t}".`, `Why is "${t}" important?`, `How would you teach "${t}" to a younger student?`, `Write one question you still have about "${t}".`].map(q => ({ q }));
  }
  function sampleProblem(topic) {
    return /algebra|equation|ecuac/i.test(topic || '') ? 'Solve the following equation step by step: 3x + 7 = 22. Write every step and check your answer.'
      : `Solve the following problem step by step and explain each step.\n\nTopic: ${topic || ''}\nProblem: `;
  }

  /* ---- generate the 4 options ---- */
  window.generateInteractiveActivitiesForTopic = function () {
    curTopic = ($('teacherTopicInput')?.value || '').trim() || 'The Solar System';
    const grade = state.activeGrade, box = $('actOptions') || $('generatedActivitiesContainer');
    box.innerHTML = `<div style="background:#fff;border:2px dashed var(--primary-blue);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1.5rem">
      <h3 style="font-size:1.15rem;font-weight:800;color:var(--navy)">✨ 4 different activity formats for: "${esc(curTopic)}"</h3>
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:1rem">Click a format to see exactly how it works, choose how students answer, and publish it to Grade ${esc(grade)}.</p>
      <div class="activities-options-grid">${Object.entries(FORMATS).map(([k, f], i) => `<div class="activity-option-card act-fmt-card" onclick="scActPreview('${k}')">
        <div><span class="activity-type-badge" style="background:var(--yellow-light);color:#b45309">Option #${i + 1}</span>
        <div class="act-fmt-tag" style="background:linear-gradient(135deg,${f.color})">${f.icon}<b>${f.tag}</b></div>
        <h4 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:.5rem 0 .3rem">${f.name}</h4>
        <p style="font-size:.82rem;color:var(--text-muted)">${f.blurb}</p></div>
        <div style="margin-top:.8rem;font-weight:700;color:var(--primary-blue);font-size:.85rem">👆 Click to see how it works</div></div>`).join('')}</div></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ---- shared renderers (preview + student) ---- */
  function qBlockAbcd(q, i, name, dis, picked) {
    return `<div class="act-opts">${q.options.map((o, k) => o ? `<label class="act-opt"><input type="radio" name="${name}" value="${k}" ${dis ? 'disabled' : ''} ${picked === k ? 'checked' : ''}><b>${LETTERS[k]}</b> ${esc(o)}</label>` : '').join('')}</div>`;
  }
  function numberedHtml(a, dis, answers) {
    return a.questions.map((q, i) => `<div class="act-numq"><div class="act-num">${i + 1}</div><div style="flex:1"><div class="act-q">${esc(q.q)}</div>
      ${a.answerMode === 'abcd' ? qBlockAbcd(q, i, 'an' + i, dis, answers ? answers[i] : null) : `<textarea id="an${i}" class="form-control" rows="2" ${dis ? 'disabled' : ''} placeholder="Write your answer in your own words…">${esc(answers?.[i] || '')}</textarea>`}</div></div>`).join('');
  }
  function matchingHtml(pairs, dis) {
    const cards = shuffle(pairs.flatMap((p, i) => [{ t: p.term, i, k: 'T' }, { t: p.def, i, k: 'D' }]));
    return `<div class="act-match" id="actMatch">${cards.map((c, n) => `<button type="button" class="act-card" ${dis ? 'disabled' : ''} data-i="${c.i}" data-n="${n}"><span class="act-back">?</span><span class="act-front">${esc(c.t)}</span></button>`).join('')}</div><div id="actMatchInfo" class="game-count" style="margin-top:.6rem"></div>`;
  }
  function stepsHtml(a, dis, ans) {
    return `<div class="act-problem">${esc(a.problem).replace(/\n/g, '<br>')}</div>
      <label style="font-weight:800;color:var(--navy)">✍️ Your work, step by step</label>
      <textarea id="anSteps" class="form-control" rows="6" ${dis ? 'disabled' : ''} placeholder="Step 1: …&#10;Step 2: …&#10;Answer: …">${esc(ans || '')}</textarea>
      ${dis ? '<label class="dt-photo">📷 Add a photo of your work (optional)</label>' : '<label class="dt-photo"><input type="file" id="anPhoto" accept="image/*" hidden>📷 Add a photo of your work (optional)</label><div id="anPhotoPrev"></div>'}`;
  }
  function abcdPreview(a, dis) {
    const q = a.mode === undefined ? a.questions[0] : a.questions[0];
    return `<div class="game-count">Question 1 of ${a.questions.length}</div><h3 class="game-q">${esc(q.q)}</h3>
      ${a.answerMode === 'abcd' ? `<div class="game-opts">${q.options.map((o, k) => o ? `<button type="button" class="game-opt" ${dis ? 'disabled' : ''}><b>${LETTERS[k]}.</b> ${esc(o)}</button>` : '').join('')}</div>`
        : `<textarea class="form-control" rows="3" ${dis ? 'disabled' : ''} placeholder="Write your answer in your own words…"></textarea><button type="button" class="btn-primary" style="margin-top:.6rem" ${dis ? 'disabled' : ''}>Next ➜</button>`}`;
  }
  function studentUi(a, dis) {
    if (a.format === 'abcd') return `<div class="act-demo">${abcdPreview(a, dis)}</div>`;
    if (a.format === 'numbered') return `<div class="act-demo">${numberedHtml(a, dis)}</div>`;
    if (a.format === 'matching') return `<div class="act-demo">${matchingHtml(a.pairs && a.pairs.length ? a.pairs : [{ term: 'Term', def: 'Definition' }, { term: 'Word', def: 'Meaning' }], dis)}</div>`;
    return `<div class="act-demo">${stepsHtml(a, dis)}</div>`;
  }

  /* ---- preview + editor page ---- */
  function overlay(id, color, kind, title, bodyHtml) {
    $(id)?.remove();
    const d = document.createElement('div'); d.id = id; d.className = 'detail-page';
    d.innerHTML = `<div class="dt-head" style="background:linear-gradient(135deg,${color})"><button class="dt-back" onclick="scClosePage('${id}')">← Back</button><span class="dt-kind">${kind}</span><h1>${esc(title)}</h1></div><div class="dt-body">${bodyHtml}</div>`;
    document.body.appendChild(d); document.body.style.overflow = 'hidden'; return d;
  }
  window.scClosePage = (id) => { $(id)?.remove(); if (!document.querySelector('.detail-page')) document.body.style.overflow = ''; };

  const editorHtml = (d) => {
    const f = FORMATS[d.format];
    const modeBox = (d.format === 'abcd' || d.format === 'numbered') ? `<div class="act-mode"><b>How do students answer?</b>
      <label><input type="radio" name="apMode" value="abcd" ${d.answerMode === 'abcd' ? 'checked' : ''} onchange="scActMode('abcd')"> 🔤 Multiple choice (A, B, C, D)</label>
      <label><input type="radio" name="apMode" value="written" ${d.answerMode === 'written' ? 'checked' : ''} onchange="scActMode('written')"> ✍️ The student writes the answer in their own words</label></div>` : '';
    let content = '';
    if (d.format === 'matching') content = `<h3>🃏 Card pairs</h3><p style="font-size:.85rem;color:var(--text-muted)">One pair per line, written as <b>term = definition</b>. Use at least 3 pairs (max 8).</p>
      <textarea id="apPairs" class="form-control" rows="6" placeholder="Photosynthesis = How plants make food from light&#10;Mammal = Animal that nurses its young&#10;Noun = A word that names a person, place or thing" oninput="scActPairsLive()">${esc((d.pairs || []).map(p => p.term + ' = ' + p.def).join('\n'))}</textarea>`;
    else if (d.format === 'steps') content = `<h3>📐 The problem</h3><p style="font-size:.85rem;color:var(--text-muted)">Write the problem exactly as you want students to see it (e.g. "Solve the following equation step by step").</p>
      <textarea id="apProblem" class="form-control" rows="5">${esc(d.problem)}</textarea>`;
    else content = `<h3>${d.answerMode === 'abcd' ? '🔤 Questions and options' : '✍️ Questions'}</h3><p style="font-size:.85rem;color:var(--text-muted)">${d.answerMode === 'abcd' ? 'Edit each question and its 4 options. Mark the correct one.' : 'Write the 5 questions or instructions. You will review and mark each student’s answers.'}</p>` +
      d.questions.map((q, i) => `<div class="qb-card"><b>${i + 1}.</b><input id="apQ${i}" class="form-control" value="${esc(q.q)}" placeholder="Write the question…">` +
        (d.answerMode === 'abcd' ? q.options.map((o, k) => `<label class="qt-opt"><input type="radio" name="apC${i}" value="${k}" ${q.correct === k ? 'checked' : ''}><b>${LETTERS[k]}</b><input id="apO${i}_${k}" class="form-control" value="${esc(o)}" placeholder="Option ${LETTERS[k]}"></label>`).join('') : '') + '</div>').join('');
    return `${modeBox}<div style="display:grid;grid-template-columns:2fr 1fr;gap:.8rem"><div><label><b>Activity title</b></label><input id="apTitle" class="form-control" value="${esc(d.title)}"></div><div><label><b>Reward points</b></label><input id="apPoints" type="number" min="5" max="200" class="form-control" value="${d.points}"></div></div>${content}`;
  };
  function readDraft() {
    const d = draft; if (!d || !$('apTitle')) return;
    d.title = $('apTitle').value.trim() || d.title; d.points = parseInt($('apPoints').value) || d.points;
    if (d.format === 'matching') d.pairs = parsePairs($('apPairs')?.value || '');
    else if (d.format === 'steps') d.problem = $('apProblem')?.value ?? d.problem;
    else d.questions = d.questions.map((q, i) => ({ q: $('apQ' + i)?.value ?? q.q, options: d.answerMode === 'abcd' ? [0, 1, 2, 3].map(k => $(`apO${i}_${k}`)?.value ?? q.options[k]) : q.options, correct: d.answerMode === 'abcd' ? (+(document.querySelector(`input[name="apC${i}"]:checked`)?.value ?? q.correct)) : q.correct }));
  }
  const parsePairs = (txt) => txt.split('\n').map(l => l.split('=')).filter(p => p.length >= 2 && p[0].trim() && p.slice(1).join('=').trim()).map(p => ({ term: p[0].trim(), def: p.slice(1).join('=').trim() })).slice(0, 8);
  function refreshPreview() { const p = $('apPreviewBox'); if (p) p.innerHTML = studentUi(draft, true); }
  window.scActPairsLive = () => { readDraft(); refreshPreview(); };
  window.scActMode = (m) => {
    readDraft(); draft.answerMode = m;
    if (draft.format !== 'steps' && draft.format !== 'matching') {
      if (m === 'abcd') { const s = sampleQuestions(curTopic); draft.questions = s.length ? s : draft.questions.map(q => ({ q: q.q, options: ['', '', '', ''], correct: 0 })); }
      else draft.questions = samplePrompts(curTopic);
    }
    $('apEditor').innerHTML = editorHtml(draft); refreshPreview();
  };

  window.scActPreview = function (fmt) {
    const f = FORMATS[fmt];
    draft = { format: fmt, topic: curTopic, grade: state.activeGrade, answerMode: f.mode === 'abcd' ? 'abcd' : 'written', points: f.pts, title: `${f.icon} ${f.name}: ${curTopic}`, questions: [], pairs: [], problem: '' };
    if (fmt === 'abcd') { draft.questions = sampleQuestions(curTopic); if (!draft.questions.length) draft.answerMode = 'written'; }
    if (fmt === 'abcd' && draft.answerMode === 'written') draft.questions = samplePrompts(curTopic);
    if (fmt === 'numbered') draft.questions = samplePrompts(curTopic);
    if (fmt === 'steps') draft.problem = sampleProblem(curTopic);
    overlay('actPreviewPage', f.color, 'Activity format', `${f.icon} ${f.name}`,
      `<div class="dt-status ok"><b>What is this?</b> ${f.blurb}</div>
       <h3>👀 What your students will see</h3><div id="apPreviewBox"></div>
       <div class="dt-respond" id="apEditor"></div>
       <div class="dt-actions"><button class="btn-primary" onclick="scActPublish()">🚀 Activate and Publish in Grade ${esc(state.activeGrade)}</button><button class="btn-secondary" onclick="scClosePage('actPreviewPage')">← Choose a different format</button></div>`);
    $('apEditor').innerHTML = editorHtml(draft); refreshPreview();
  };

  window.scActPublish = function () {
    readDraft(); const d = draft;
    if (d.format === 'matching' && d.pairs.length < 3) return showToast('Add at least 3 pairs written as "term = definition".', 'warning');
    if (d.format === 'steps' && !d.problem.trim()) return showToast('Write the problem students must solve.', 'warning');
    if (d.format !== 'matching' && d.format !== 'steps') {
      if (d.questions.some(q => !q.q.trim())) return showToast('Fill in all the questions.', 'warning');
      if (d.answerMode === 'abcd' && d.questions.some(q => q.options.some(o => !o.trim()))) return showToast('Fill in all 4 options (A–D) of every question.', 'warning');
    }
    const f = FORMATS[d.format];
    const act = { id: 'act-' + Date.now(), topic: d.topic, grade: String(d.grade), type: d.format === 'matching' ? 'memory' : 'trivia', format: d.format, answerMode: d.format === 'matching' ? 'game' : d.answerMode,
      title: d.title, desc: `${f.name} about ${d.topic}. ${d.format === 'steps' ? 'Solve it step by step.' : d.format === 'matching' ? 'Match every term with its definition.' : d.answerMode === 'abcd' ? 'Choose A, B, C or D.' : 'Answer in your own words.'}`,
      points: d.points, questions: d.questions, pairs: d.pairs, problem: d.problem, submissions: [], doneBy: [] };
    const all = state.getActivities(); all.unshift(act); state.saveActivities(all);
    scClosePage('actPreviewPage'); showToast(`Activity "${act.title}" published for Grade ${act.grade}!`, 'success'); renderApp();
  };

  /* ---- teacher: list of active activities ---- */
  const pending = (a) => (a.submissions || []).filter(s => !s.reviewed).length;
  function activeList() {
    const grade = state.activeGrade, list = state.getActivitiesByGrade(grade);
    return `<h3 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:1rem 0">Active Interactive Activities in Grade ${esc(grade)}:</h3>` + (!list.length
      ? '<div class="empty-state" style="padding:1.5rem"><p>You have not activated any interactive activities for this class yet. Type a topic above and click generate.</p></div>'
      : `<div class="activities-options-grid">${list.map(a => { const f = FORMATS[a.format]; const p = pending(a);
        return `<div class="activity-option-card"><div><span class="activity-type-badge" style="background:#e0f2fe;color:#0284c7">${f ? f.icon + ' ' + f.name : (a.type === 'trivia' ? '🎯 Quick Trivia' : '🧩 Concept Matching')}</span>
          <h4 style="font-size:1.05rem;font-weight:800;color:var(--navy);margin:.4rem 0">${esc(a.title)}</h4><p style="font-size:.85rem;color:var(--text-muted)">${esc(a.desc)}</p>
          <div style="font-size:.75rem;color:var(--primary-blue);font-weight:700">Topic: ${esc(a.topic)}${a.format ? ' • ' + (a.answerMode === 'abcd' ? 'A–D answers' : a.answerMode === 'game' ? 'Game' : 'Written answers') : ''}</div></div>
          <div style="margin-top:1rem;padding-top:.75rem;border-top:1px solid #e2e8f0"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;color:var(--yellow-accent)">⭐ +${a.points} pts</span><span class="submission-status-badge submitted">${(a.submissions || []).length} response(s)${p ? ` • ${p} to review` : ''}</span></div>
          <div class="dt-actions" style="margin-top:.6rem">${a.format ? `<button class="btn-secondary btn-sm" onclick="scActView('${a.id}')">👁️ View</button>` : ''}${p || (a.submissions || []).length ? `<button class="btn-yellow btn-sm" onclick="scActReview('${a.id}')">📝 Responses${p ? ` (${p})` : ''}</button>` : ''}<button class="btn-secondary btn-sm" onclick="scActDelete('${a.id}')">🗑️</button></div></div></div>`; }).join('')}</div>`);
  }
  const _rta = window.renderTeacherActivitiesSection;
  window.renderTeacherActivitiesSection = function (c) {
    _rta(c); const box = $('generatedActivitiesContainer'); if (box) box.innerHTML = '<div id="actOptions"></div>' + activeList();
  };
  window.scActDelete = (id) => { if (!confirm('Delete this activity and its responses?')) return; state.saveActivities(state.getActivities().filter(a => a.id !== id)); renderApp(); };
  window.scActView = (id) => {
    const a = state.getActivities().find(x => x.id === id); if (!a) return; const f = FORMATS[a.format] || FORMATS.abcd;
    overlay('actPreviewPage', f.color, 'Activity', a.title, `<div class="dt-status ok">${esc(a.desc)}</div><h3>👀 What students see</h3>${studentUi(a, true)}`);
  };

  /* ---- teacher: review written answers ---- */
  function awardStudent(email, pts) {
    const st = state.getStudents(), s = st.find(x => x.email === email); if (!s) return;
    s.points = (s.points || 0) + pts; s.level = s.points >= 300 ? 'Subject Expert' : s.points >= 100 ? 'Explorer' : 'Apprentice'; state.saveStudents(st);
  }
  window.scActReview = function (id) {
    const a = state.getActivities().find(x => x.id === id); if (!a) return;
    const subs = a.submissions || [];
    const answersHtml = (s) => a.format === 'steps' ? `<div class="act-problem">${esc(a.problem).replace(/\n/g, '<br>')}</div><div class="dt-text"><b>Work:</b><br>${esc(s.answers?.[0] || '').replace(/\n/g, '<br>')}</div>${s.photo ? `<img class="dt-img" src="${s.photo}">` : ''}`
      : (a.questions || []).map((q, i) => `<div style="margin:.4rem 0"><b>${i + 1}. ${esc(q.q)}</b><br>${a.answerMode === 'abcd' ? `Chose: ${s.answers?.[i] != null ? LETTERS[s.answers[i]] + ' – ' + esc(q.options[s.answers[i]] || '') : '—'} ${s.answers?.[i] === q.correct ? '✅' : '❌'}` : `<span style="color:#334155">${esc(s.answers?.[i] || '—')}</span>`}</div>`).join('');
    overlay('actReviewPage', '#d97706,#fbbf24', 'Responses', a.title, subs.length ? subs.map((s, k) => `<div class="mat-item" style="display:block"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><strong>${esc(s.studentName)}</strong><span>${esc(s.date)} • ${s.reviewed ? (s.result === 'correct' ? '✅ Correct' : s.result === 'auto' ? '🤖 Auto-graded: ' + s.score + '%' : '✖ Needs work') : '⏳ To review'}</span></div>${answersHtml(s)}
      ${s.auto ? '' : `<div class="grading-controls-row" style="margin-top:.6rem"><input id="arF${k}" class="form-control" placeholder="Message for the student (optional)" value="${esc(s.feedback || '')}"><button class="btn-primary btn-sm" onclick="scActMark('${a.id}',${k},true)">✔ Correct (+${a.points} pts)</button><button class="btn-secondary btn-sm" onclick="scActMark('${a.id}',${k},false)">✖ Incorrect</button></div>`}</div>`).join('') : '<em>Nobody has answered yet.</em>');
  };
  window.scActMark = function (id, k, ok) {
    const all = state.getActivities(), a = all.find(x => x.id === id), s = a?.submissions?.[k]; if (!s) return;
    const was = s.reviewed && s.result === 'correct';
    s.reviewed = true; s.result = ok ? 'correct' : 'incorrect'; s.feedback = $('arF' + k)?.value.trim() || (ok ? 'Great work!' : 'Review it and try again.'); s.notified = false;
    if (ok && !was) { awardStudent(s.studentEmail, a.points); a.doneBy = a.doneBy || []; if (!a.doneBy.includes(s.studentEmail)) a.doneBy.push(s.studentEmail); }
    state.saveActivities(all); showToast(`Marked for ${s.studentName}.`, 'success'); scActReview(id); renderApp();
  };

  /* =====================================================================
     STUDENT SIDE for the new formats
     ===================================================================== */
  const findAct = (id) => state.getActivities().find(a => a.id === id);
  const _openDetail = window.openDetail;
  window.openDetail = function (kind, id) { const a = kind === 'act' ? findAct(id) : null; if (a && a.format) return openPlayer(id); return _openDetail(kind, id); };
  const _playAct = window.scPlayAct;
  window.scPlayAct = function (id) { const a = findAct(id); if (a && a.format) return openPlayer(id); return _playAct(id); };
  const _stuPractice = window.renderStudentInfinitePracticeSection;
  window.renderStudentInfinitePracticeSection = function (c) {
    _stuPractice(c);
    c.querySelectorAll('.activity-option-card[data-id]').forEach(el => {
      const a = findAct(el.dataset.id); if (!a || !a.format) return; const f = FORMATS[a.format];
      const badge = el.querySelector('.activity-type-badge'); if (badge) badge.textContent = `${f.icon} ${f.name}`;
      const btn = el.querySelector('button'); const mine = (a.submissions || []).find(s => s.studentEmail === me().email);
      if (btn) btn.textContent = mine ? (mine.reviewed ? '✅ See my result' : '⏳ Waiting for your teacher') : `▶️ Start (+${a.points} pts)`;
    });
  };

  const mySub = (a) => (a.submissions || []).find(s => s.studentEmail === me().email);
  function saveSub(id, sub) {
    const all = state.getActivities(), a = all.find(x => x.id === id), u = me();
    a.submissions = (a.submissions || []).filter(s => s.studentEmail !== u.email);
    a.submissions.push(Object.assign({ studentEmail: u.email, studentName: u.name, date: new Date().toLocaleDateString('en-US') }, sub));
    state.saveActivities(all); return a;
  }
  function giveAuto(a, score) {
    a.doneBy = a.doneBy || []; const u = me();
    if (score >= 60 && !a.doneBy.includes(u.email)) {
      a.doneBy.push(u.email); const all = state.getActivities(); all.find(x => x.id === a.id).doneBy = a.doneBy; state.saveActivities(all);
      state.addPointsAndStars(a.points, 0); showToast(`Activity completed! +${a.points} pts 🎉`, 'success'); return true;
    }
    showToast(score >= 60 ? 'You had already earned the points for this activity.' : `You scored ${score}%. You need 60% to earn the points – try again!`, 'info'); return false;
  }
  window.scActRetry = (id) => openPlayer(id);

  function openPlayer(id) {
    const a = findAct(id); if (!a) return; const f = FORMATS[a.format], prev = mySub(a);
    const locked = prev && !prev.auto && prev.reviewed;
    let status = '';
    if (prev && !prev.auto) status = prev.reviewed ? `<div class="dt-status ok">${prev.result === 'correct' ? '🎉 Correct!' : '📝 Your teacher reviewed it:'} ${esc(prev.feedback || '')}</div>` : '<div class="dt-status">⏳ You already sent this. Your teacher is reviewing it. You can send it again to replace it.</div>';
    if (prev && prev.auto) status = `<div class="dt-status ok">Your last score: <b>${prev.score}%</b>. You can play again.</div>`;
    const meta = `<div class="dt-meta"><div><small>Format</small><b>${f.name}</b></div><div><small>Topic</small><b>${esc(a.topic)}</b></div><div><small>Reward</small><b>⭐ ${a.points} pts</b></div></div>`;
    let ui;
    if (a.format === 'abcd') ui = '<div class="act-demo" id="actStage"></div>';
    else if (a.format === 'numbered') ui = `<div class="act-demo">${numberedHtml(a, locked, prev && !prev.auto ? prev.answers : null)}</div>${locked ? '' : '<div class="dt-actions"><button class="btn-primary" onclick="scActSubmit(\'' + id + '\')">📤 Submit answers</button></div>'}`;
    else if (a.format === 'matching') ui = `<div class="act-demo">${matchingHtml(a.pairs, false)}</div>`;
    else ui = `<div class="act-demo">${stepsHtml(a, locked, prev && !prev.auto ? prev.answers?.[0] : '')}</div>${locked ? '' : '<div class="dt-actions"><button class="btn-primary" onclick="scActSubmit(\'' + id + '\')">📤 Submit my work</button></div>'}`;
    overlay('actPlayPage', f.color, f.name, a.title, `${meta}${status}<p class="dt-text">${esc(a.desc)}</p>${ui}`);
    if (a.format === 'abcd') abcdStage(a); if (a.format === 'matching') initMatching(a);
    $('anPhoto')?.addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; if (file.size > 1200000) { e.target.value = ''; return showToast('The image is larger than 1.2 MB.', 'warning'); } const r = new FileReader(); r.onload = () => { window._anPhoto = r.result; $('anPhotoPrev').innerHTML = `<img class="dt-img" src="${r.result}">`; }; r.readAsDataURL(file); });
    window._anPhoto = null;
  }

  function abcdStage(a) {
    let i = 0; const answers = [], st = $('actStage');
    const show = () => {
      if (i >= a.questions.length) {
        if (a.answerMode === 'abcd') {
          const ok = a.questions.filter((q, k) => answers[k] === q.correct).length, score = Math.round(ok / a.questions.length * 100);
          saveSub(a.id, { answers, score, auto: true, reviewed: true, result: 'auto' });
          st.innerHTML = `<div class="game-end"><div class="game-emoji">${score >= 70 ? '🏆' : '💪'}</div><h2>${ok} / ${a.questions.length} correct</h2><p>Score: <b>${score}%</b></p><div class="dt-actions" style="justify-content:center"><button class="btn-primary" onclick="scActRetry('${a.id}')">🔄 Play again</button><button class="btn-secondary" onclick="scClosePage('actPlayPage');renderApp()">Done</button></div></div>`;
          giveAuto(a, score);
        } else {
          saveSub(a.id, { answers, auto: false, reviewed: false });
          st.innerHTML = '<div class="game-end"><div class="game-emoji">📤</div><h2>Answers sent!</h2><p>Your teacher will review them and give you the points.</p><button class="btn-primary" onclick="scClosePage(\'actPlayPage\');renderApp()">Done</button></div>';
          showToast('Answers sent to your teacher!', 'success');
        }
        return;
      }
      const q = a.questions[i];
      st.innerHTML = `<div class="game-progress"><span style="width:${i / a.questions.length * 100}%"></span></div><div class="game-count">Question ${i + 1} of ${a.questions.length}</div><h3 class="game-q">${esc(q.q)}</h3>` +
        (a.answerMode === 'abcd' ? `<div class="game-opts">${q.options.map((o, k) => `<button type="button" class="game-opt" data-k="${k}"><b>${LETTERS[k]}.</b> ${esc(o)}</button>`).join('')}</div><div id="actFb"></div>`
          : '<textarea id="actTxt" class="form-control" rows="3" placeholder="Write your answer in your own words…"></textarea><button type="button" class="btn-primary" id="actNext" style="margin-top:.6rem">Next ➜</button>');
      if (a.answerMode === 'abcd') st.querySelectorAll('.game-opt').forEach(b => b.onclick = () => {
        const k = +b.dataset.k, ok = k === q.correct; answers[i] = k;
        st.querySelectorAll('.game-opt').forEach(x => { x.disabled = true; if (+x.dataset.k === q.correct) x.classList.add('right'); }); if (!ok) b.classList.add('wrong');
        $('actFb').innerHTML = `<p class="game-fb ${ok ? 'ok' : 'bad'}">${ok ? 'Correct! 🎉' : 'Incorrect.'}</p><button class="btn-primary" id="actNext">${i + 1 === a.questions.length ? 'See result' : 'Next ➜'}</button>`;
        $('actNext').onclick = () => { i++; show(); };
      });
      else $('actNext').onclick = () => { const t = $('actTxt').value.trim(); if (!t) return showToast('Write your answer first.', 'warning'); answers[i] = t; i++; show(); };
    };
    show();
  }

  function initMatching(a) {
    const root = $('actMatch'), info = $('actMatchInfo'); let open = [], done = 0, moves = 0, lock = false;
    root.querySelectorAll('.act-card').forEach(c => c.onclick = () => {
      if (lock || c.classList.contains('flip') || c.classList.contains('ok')) return;
      c.classList.add('flip'); open.push(c);
      if (open.length === 2) {
        moves++; lock = true; const [x, y] = open;
        const text = (el) => el.querySelector('.act-front').textContent, isTerm = (el) => a.pairs[+el.dataset.i].term === text(el) && !(a.pairs[+el.dataset.i].def === text(el));
        const match = x.dataset.i === y.dataset.i && x !== y && (text(x) !== text(y));
        setTimeout(() => {
          if (match) { x.classList.add('ok'); y.classList.add('ok'); done++; } else { x.classList.remove('flip'); y.classList.remove('flip'); }
          open = []; lock = false; info.textContent = `Moves: ${moves} • Pairs found: ${done} / ${a.pairs.length}`;
          if (done === a.pairs.length) {
            const score = Math.max(40, Math.min(100, 100 - (moves - a.pairs.length) * 8));
            saveSub(a.id, { score, moves, auto: true, reviewed: true, result: 'auto' });
            info.innerHTML = `<div class="dt-status ok">🏆 All pairs found in ${moves} moves — score <b>${score}%</b></div>`; giveAuto(a, score);
          }
        }, match ? 250 : 800);
      }
    });
    info.textContent = `Moves: 0 • Pairs found: 0 / ${a.pairs.length}`;
  }

  window.scActSubmit = function (id) {
    const a = findAct(id);
    if (a.format === 'steps') {
      const t = $('anSteps').value.trim(); if (!t && !window._anPhoto) return showToast('Write your work or add a photo first.', 'warning');
      saveSub(id, { answers: [t], photo: window._anPhoto || '', auto: false, reviewed: false });
    } else {
      let answers;
      if (a.answerMode === 'abcd') { answers = a.questions.map((q, i) => { const r = document.querySelector(`input[name="an${i}"]:checked`); return r ? +r.value : null; }); if (answers.some(x => x === null)) return showToast('Answer every question before sending.', 'warning'); }
      else { answers = a.questions.map((q, i) => ($('an' + i).value || '').trim()); if (answers.some(x => !x)) return showToast('Answer every question before sending.', 'warning'); }
      if (a.answerMode === 'abcd') {
        const ok = a.questions.filter((q, i) => answers[i] === q.correct).length, score = Math.round(ok / a.questions.length * 100);
        saveSub(id, { answers, score, auto: true, reviewed: true, result: 'auto' }); scClosePage('actPlayPage'); giveAuto(a, score); return renderApp();
      }
      saveSub(id, { answers, auto: false, reviewed: false });
    }
    scClosePage('actPlayPage'); showToast('Sent to your teacher!', 'success'); renderApp();
  };

  function notifyReviewed(u) {
    const all = state.getActivities(); let ch = false;
    all.forEach(a => (a.submissions || []).forEach(s => { if (s.studentEmail === u.email && s.reviewed && !s.auto && s.notified === false) { s.notified = true; ch = true; showToast(`🎉 Your teacher reviewed the activity "${a.title}"${s.result === 'correct' ? ` — correct! +${a.points} pts` : ''}`, 'success'); } }));
    if (ch) state.saveActivities(all);
  }

  renderApp();
})();
