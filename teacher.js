/* SmartClass – teacher.js
   Lado del docente + lo que le llega al estudiante:
   1) Tareas con documento adjunto (profesor y estudiante) y aviso de nota al estudiante
   2) Quizzes (ABCD y/o respuesta abierta): crear, publicar, responder, calificar
   3) Duelos del profesor: preguntas propias (quiz) o por tema -> invitación al curso -> juegan al instante -> estrellas según la nota
   4) Ruleta con la lista de estudiantes (o con opciones propias)
   5) Lista de todos los estudiantes
   Se carga DESPUÉS de fixes.js. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const QK = 'smartclass_quizzes', GK = 'smartclass_live_games';
  const getQ = () => state.load(QK) || [], saveQ = (v) => state.save(QK, v);
  const getG = () => state.load(GK) || [], saveG = (v) => state.save(GK, v);
  const me = () => state.currentUser;
  const isT = () => me() && me().role === 'docente';
  const isS = () => me() && me().role === 'estudiante';
  const gameActive = () => !!$('gameModal')?.classList.contains('active');
  const readFile = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
  const nota = (ratio) => (1 + 4 * ratio).toFixed(1);               // 50 % = 3.0 · 100 % = 5.0
  const forMe = (g, u) => String(g.grade) === String(u.grade) && (!g.targets || !g.targets.length || g.targets.includes(u.email));
  function overlay(id, html, wide) {
    let o = $(id);
    if (!o) { o = document.createElement('div'); o.className = 'modal-overlay'; o.id = id; document.body.appendChild(o); }
    o.innerHTML = `<div class="modal-content ${wide ? '' : 'game-box'}" ${wide ? 'style="max-width:760px;width:94%;max-height:90vh;overflow:auto"' : ''}>${html}</div>`;
    o.classList.add('active'); return o;
  }
  const hide = (id) => $(id)?.classList.remove('active');
  function page(color, kind, title, bodyHtml) {
    closeDetailPage();
    const d = document.createElement('div'); d.id = 'detailPage'; d.className = 'detail-page';
    d.innerHTML = `<div class="dt-head" style="background:linear-gradient(135deg,${color})"><button class="dt-back" onclick="closeDetailPage();renderApp()">← Back</button><span class="dt-kind">${kind}</span><h1>${esc(title)}</h1></div><div class="dt-body">${bodyHtml}</div>`;
    document.body.appendChild(d); document.body.style.overflow = 'hidden'; return d;
  }

  /* =====================================================================
     1) TAREAS CON DOCUMENTO
     ===================================================================== */
  let taskDoc = null, dtDoc = null;
  const _openTask = window.openNewTaskModal;
  window.openNewTaskModal = function () {
    _openTask(); taskDoc = null;
    if (!$('taskDocInput')) {
      const g = document.createElement('div'); g.className = 'form-group';
      g.innerHTML = '<label for="taskDocInput">📎 Document for the homework (Word, PDF… optional)</label><input type="file" id="taskDocInput" class="form-control" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx">';
      ($('taskImageInput')?.parentElement || $('taskDescInput').parentElement).after(g);
      $('taskDocInput').addEventListener('change', async (e) => {
        const f = e.target.files[0]; if (!f) { taskDoc = null; return; }
        if (f.size > 1500000) { e.target.value = ''; taskDoc = null; return showToast('The document is larger than 1.5 MB.', 'warning'); }
        taskDoc = { name: f.name, mime: f.type, dataUrl: await readFile(f) };
      });
    }
    $('taskDocInput').value = '';
  };
  const _createTask = window.handleCreateTaskSubmit;
  window.handleCreateTaskSubmit = function (e) {
    const doc = taskDoc, n = state.getTasks().length;
    _createTask(e);
    const t = state.getTasks();
    if (doc && t.length > n) { t[0].file = doc; state.saveTasks(t); taskDoc = null; renderApp(); }
  };
  const _openDetail = window.openDetail;
  window.openDetail = function (kind, id) {
    _openDetail(kind, id); dtDoc = null;
    if (kind !== 'task') return;
    const t = state.getTasks().find(x => x.id === id), dl = document.querySelector('#detailPage .dt-actions.dl');
    if (t && t.file && dl) dl.insertAdjacentHTML('beforeend', `<a class="btn-primary" href="${t.file.dataUrl}" download="${esc(t.file.name)}">📎 Download document: ${esc(t.file.name)}</a>`);
    const ph = document.querySelector('#detailPage .dt-respond .dt-photo');
    if (ph) {
      ph.insertAdjacentHTML('afterend', '<label class="dt-photo">📎 Attach document (Word / PDF)<input type="file" id="dtDoc" accept=".pdf,.doc,.docx,.txt" hidden></label><div id="dtDocName" style="font-size:.82rem"></div>');
      $('dtDoc').addEventListener('change', async (e) => {
        const f = e.target.files[0]; if (!f) return;
        if (f.size > 1500000) { e.target.value = ''; return showToast('The document is larger than 1.5 MB.', 'warning'); }
        dtDoc = { name: f.name, dataUrl: await readFile(f) }; $('dtDocName').textContent = '📎 ' + f.name;
      });
    }
  };
  const _sendDetail = window.scSendDetail;
  window.scSendDetail = function (kind, id) {
    const doc = dtDoc;
    if (kind === 'task' && doc && !$('dtAnswer').value.trim() && !document.querySelector('#dtPrev img')) $('dtAnswer').value = '(Submission in the attached document)';
    _sendDetail(kind, id);
    if (kind === 'task' && doc) {
      const tasks = state.getTasks(), s = tasks.find(t => t.id === id)?.submissions?.find(x => x.studentEmail === me().email);
      if (s) { s.fileUrl = doc.dataUrl; s.fileName = doc.name; state.saveTasks(tasks); }
      dtDoc = null;
    }
  };

  /* =====================================================================
     2) QUIZZES
     ===================================================================== */
  const counts = (q) => ({ abcd: q.questions.filter(x => x.type === 'abcd').length, open: q.questions.filter(x => x.type === 'open').length });
  const pendingReviews = (q) => (q.responses || []).filter(r => !r.reviewed).length;
  function finalGrade(q, r) {
    let ok = 0;
    q.questions.forEach((qu, i) => { if (qu.type === 'abcd' ? r.answers[i] === qu.correct : (r.marks && r.marks[i] === true)) ok++; });
    return nota(ok / q.questions.length);
  }

  /* ---- Docente: lista ---- */
  function renderTQuizzes(c) {
    const grade = String(state.activeGrade), list = getQ().filter(q => String(q.grade) === grade);
    c.innerHTML = `<div class="content-card">
      <div class="card-top-bar"><div class="card-title-group"><div class="card-title-icon" style="background:#fce7f3;color:#db2777">❓</div>
        <div class="card-title-text"><h2>My Quizzes (Grade ${esc(grade)}</h2><span>Create multiple-choice (ABCD) questions or questions answered in the student's own words. You choose how.</span></div></div>
        <button class="btn-primary" onclick="scQuizBuilder()">➕ Create quiz</button></div>
      <div style="margin-top:1rem">${list.length ? list.map(q => {
        const n = counts(q), pend = pendingReviews(q);
        return `<div class="mat-item" style="flex-wrap:wrap"><div><strong>${esc(q.title)}</strong> <span class="dt-kind" style="margin-left:.3rem">${q.published ? '📣 Published' : '📝 Draft'}</span>
          <div style="font-size:.78rem;color:var(--text-muted)">${esc(q.subject || 'General')} • ${n.abcd} ABCD · ${n.open} open • ${(q.responses || []).length} response(s)${pend ? ` • <b style="color:#b45309">${pend} to grade</b>` : ''}</div></div>
          <div class="dt-actions"><button class="btn-yellow btn-sm" onclick="scQuizPublish('${q.id}')">${q.published ? '🔒 Unpublish' : '📣 Publish to students'}</button>
          <button class="btn-secondary btn-sm" onclick="scQuizDuel('${q.id}')" ${n.abcd ? '' : 'disabled title=\"Needs ABCD questions\"'}>⚔️ Use in duel</button>
          <button class="btn-secondary btn-sm" onclick="scQuizResults('${q.id}')">📊 Results</button>
          <button class="btn-secondary btn-sm" onclick="scQuizDelete('${q.id}')">🗑️</button></div></div>`;
      }).join('') : '<em>You haven\'t created any quizzes for this grade yet. Press “Create quiz” to get started.</em>'}</div></div>`;
  }
  window.scQuizPublish = (id) => { const l = getQ(), q = l.find(x => x.id === id); if (!q) return; q.published = !q.published; saveQ(l); showToast(q.published ? '📣 Quiz published: it now appears to the students.' : 'Quiz unpublished.', 'success'); renderApp(); };
  window.scQuizDelete = (id) => { if (!confirm('Delete this quiz and its responses?')) return; saveQ(getQ().filter(x => x.id !== id)); renderApp(); };
  window.scQuizDuel = (id) => { presetQuiz = id; state.currentSection = 'competencias'; renderApp(); };

  /* ---- Docente: constructor ---- */
  let qbN = 0;
  const qCard = (type) => { const id = ++qbN; return `<div class="qb-card" data-type="${type}"><div class="qb-top"><b>${type === 'abcd' ? '🔤 ABCD question' : '✍️ Open question (in their own words)'}</b><button type="button" class="btn-secondary btn-sm" onclick="this.closest('.qb-card').remove()">Unpublish</button></div>
    <input class="form-control qb-text" placeholder="Write the question…">
    ${type === 'abcd' ? ['A', 'B', 'C', 'D'].map((L, i) => `<div class="exam-option-radio-row"><input type="radio" name="qbc_${id}" value="${i}" ${i === 0 ? 'checked' : ''}><input class="form-control qb-opt" placeholder="Opción ${L}${i === 0 ? ' (mark the circle of the correct one)' : ''}"></div>`).join('') : '<small style="color:var(--text-muted)">The student answers by writing and you mark it as correct or incorrect.</small>'}</div>`; };
  window.scAddQ = (type) => { $('qbList').insertAdjacentHTML('beforeend', qCard(type)); };
  window.scQuizBuilder = function () {
    overlay('quizBuilder', `<div class="modal-header"><h3>❓ Create quiz</h3><button class="modal-close-btn" onclick="document.getElementById('quizBuilder').classList.remove('active')">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label>Quiz title</label><input id="qbTitle" class="form-control" placeholder="E.g. Fractions quiz"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="form-group"><label>Subject</label><input id="qbSubject" class="form-control" placeholder="E.g. Math"></div>
        <div class="form-group"><label>Grade</label><select id="qbGrade" class="form-control">${Array.from({ length: 11 }, (_, i) => `<option value="${i + 1}" ${String(i + 1) === String(state.activeGrade) ? 'selected' : ''}>Grade ${i + 1}</option>`).join('')}</select></div></div>
        <div id="qbList"></div>
        <div class="dt-actions" style="margin:.8rem 0"><button type="button" class="btn-secondary" onclick="scAddQ('abcd')">➕ ABCD question</button><button type="button" class="btn-secondary" onclick="scAddQ('open')">➕ Open question</button></div>
        <button class="btn-primary" style="width:100%" onclick="scQuizBuilderSave()">💾 Save quiz</button></div>`, true);
    $('qbList').insertAdjacentHTML('beforeend', qCard('abcd'));
  };
  window.scQuizBuilderSave = function () {
    const title = $('qbTitle').value.trim(); if (!title) return showToast('Give the quiz a title.', 'warning');
    const questions = []; let bad = false;
    document.querySelectorAll('#qbList .qb-card').forEach(card => {
      const type = card.dataset.type, text = card.querySelector('.qb-text').value.trim();
      if (!text) { bad = true; return; }
      if (type === 'abcd') {
        const options = [...card.querySelectorAll('.qb-opt')].map(i => i.value.trim()); if (options.some(o => !o)) { bad = true; return; }
        questions.push({ type, text, options, correct: parseInt(card.querySelector('input[type=radio]:checked')?.value || '0') });
      } else questions.push({ type, text });
    });
    if (bad) return showToast('Complete all the questions (and the 4 options of the ABCD ones).', 'warning');
    if (!questions.length) return showToast('Add at least one question.', 'warning');
    const l = getQ(); l.unshift({ id: 'quiz-' + Date.now(), title, subject: $('qbSubject').value.trim(), grade: String($('qbGrade').value), createdBy: me().name, questions, published: false, responses: [] });
    saveQ(l); hide('quizBuilder'); state.activeGrade = String($('qbGrade').value); showToast('Quiz saved. Press “Publish to students” when it\'s ready.', 'success'); renderApp();
  };

  /* ---- Docente: resultados y calificación ---- */
  window.scQuizResults = function (id) {
    const q = getQ().find(x => x.id === id); if (!q) return;
    const blocks = (q.responses || []).map((r, ri) => `<div class="grading-item-box ${r.reviewed ? 'reviewed-done' : 'pending-review'}" style="padding:1rem">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem"><strong>👨‍🎓 ${esc(r.name)}</strong><span class="reviewing-badge ${r.reviewed ? 'graded' : ''}">${r.reviewed ? `✅ Score ${esc(r.gradeMark)}` : '⏳ To grade'}</span></div>
      ${q.questions.map((qu, qi) => qu.type === 'abcd'
        ? `<p style="margin:.5rem 0">${qi + 1}. ${esc(qu.text)}<br><small>Answered: <b>${esc(qu.options[r.answers[qi]] ?? '—')}</b> ${r.answers[qi] === qu.correct ? '✅' : `❌ (correct: ${esc(qu.options[qu.correct])})`}</small></p>`
        : `<p style="margin:.5rem 0">${qi + 1}. ${esc(qu.text)}<br><em style="background:#f8fafc;padding:.3rem .6rem;display:inline-block;border-radius:8px">“${esc(r.answers[qi])}”</em><br>
           <select id="qm_${ri}_${qi}" class="form-control" style="max-width:200px;margin-top:.3rem"><option value="">Not marked</option><option value="1" ${r.marks && r.marks[qi] === true ? 'selected' : ''}>✔ Correct</option><option value="0" ${r.marks && r.marks[qi] === false ? 'selected' : ''}>✖ Incorrect</option></select></p>`).join('')}
      ${counts(q).open ? `<div class="grading-controls-row"><input id="qf_${ri}\" class=\"form-control\" placeholder=\"Message for the student (optional)\" value=\"${esc(r.feedback && r.feedback !== 'Automatic grading' ? r.feedback : '')}"><button class="btn-primary btn-sm" onclick="scQuizSave('${q.id}',${ri})">⭐ ${r.reviewed ? 'Update score' : 'Save score'}</button></div>` : ''}</div>`).join('');
    page('#db2777,#f472b6', 'Results', q.title, `<p>${(q.responses || []).length} response(s). ABCD questions are graded automatically; you mark the open ones and the student gets their score instantly.</p>${blocks || '<em>Nobody has answered this quiz yet.</em>'}`);
  };
  window.scQuizSave = function (qid, ri) {
    const l = getQ(), q = l.find(x => x.id === qid), r = q?.responses[ri]; if (!r) return;
    const marks = {}; let missing = false;
    q.questions.forEach((qu, qi) => { if (qu.type !== 'open') return; const v = $(`qm_${ri}_${qi}`).value; if (v === '') missing = true; else marks[qi] = v === '1'; });
    if (missing) return showToast('Mark each open question as correct or incorrect.', 'warning');
    r.marks = marks; r.gradeMark = finalGrade(q, r); r.reviewed = true; r.feedback = $(`qf_${ri}`).value.trim() || 'Quiz reviewed by the teacher.'; r.notified = false;
    saveQ(l); showToast(`Score ${r.gradeMark} saved for ${r.name}. It has already reached them.`, 'success'); scQuizResults(qid);
  };

  /* ---- Estudiante ---- */
  const myQuizzes = (u) => getQ().filter(q => q.published && String(q.grade) === String(u.grade));
  const myResp = (q, u) => (q.responses || []).find(r => r.email === u.email);
  function renderSQuizzes(c) {
    const u = me(), list = myQuizzes(u);
    c.innerHTML = `<div class="content-card"><div class="card-top-bar"><div class="card-title-group"><div class="card-title-icon" style="background:#fce7f3;color:#db2777">❓</div>
      <div class="card-title-text"><h2>Your teacher's Quizzes (Grade ${esc(u.grade)}</h2><span>Answer and get your score as soon as it is graded</span></div></div></div>
      <div style="margin-top:1rem">${list.length ? list.map(q => { const r = myResp(q, u), n = counts(q);
        return `<div class="mat-item" style="flex-wrap:wrap"><div><strong>${esc(q.title)}</strong><div style="font-size:.78rem;color:var(--text-muted)">${esc(q.subject || 'General')} • ${q.questions.length} question(s) • ${esc(q.createdBy)}</div></div>
          ${!r ? `<button class="btn-primary btn-sm" onclick="scQuizTake('${q.id}')">✍️ Answer</button>` : r.reviewed ? `<div class="dt-actions"><span class="submission-status-badge submitted">✅ Score ${esc(r.gradeMark)}</span><button class="btn-secondary btn-sm" onclick="scQuizView('${q.id}')">See result</button></div>` : '<span class="submission-status-badge pending">⏳ Under review</span>'}</div>`; }).join('')
        : '<em>Your teacher hasn\'t published any quizzes yet.</em>'}</div></div>`;
  }
  window.scQuizTake = function (id) {
    const q = getQ().find(x => x.id === id), u = me(); if (!q || myResp(q, u)) return;
    page('#db2777,#f472b6', 'Quiz', q.title, `<p>Answer all the questions and press send. You can only send it once.</p>
      ${q.questions.map((qu, i) => `<div class="qb-card"><b>${i + 1}. ${esc(qu.text)}</b>${qu.type === 'abcd'
        ? qu.options.map((o, k) => `<label class="qt-opt"><input type="radio" name="qa_${i}" value="${k}"> <b>${'ABCD'[k]}.</b> ${esc(o)}</label>`).join('')
        : `<textarea id="qa_${i}" class="form-control" rows="3" placeholder="Write your answer in your own words…"></textarea>`}</div>`).join('')}
      <button class="btn-primary" onclick="scQuizSubmit('${q.id}')">📤 Send quiz</button>`);
  };
  window.scQuizSubmit = function (id) {
    const l = getQ(), q = l.find(x => x.id === id), u = me(); if (!q || myResp(q, u)) return;
    const answers = []; let missing = false;
    q.questions.forEach((qu, i) => {
      if (qu.type === 'abcd') { const v = document.querySelector(`input[name="qa_${i}"]:checked`); if (!v) missing = true; answers.push(v ? parseInt(v.value) : null); }
      else { const t = $(`qa_${i}`).value.trim(); if (!t) missing = true; answers.push(t); }
    });
    if (missing) return showToast('Answer all the questions before sending.', 'warning');
    const r = { email: u.email, name: u.name, date: new Date().toLocaleDateString('en-US'), answers, marks: {}, reviewed: false, gradeMark: '', feedback: '' };
    if (!counts(q).open) { r.reviewed = true; r.gradeMark = finalGrade(q, r); r.feedback = 'Automatic grading'; r.notified = true; }
    (q.responses = q.responses || []).push(r); saveQ(l); closeDetailPage();
    showToast(r.reviewed ? `Done! Your score: ${r.gradeMark}` : 'Quiz sent. Your teacher will review the open questions and you will get your score.', 'success'); renderApp();
    if (r.reviewed) scQuizView(id);
  };
  window.scQuizView = function (id) {
    const q = getQ().find(x => x.id === id), r = q && myResp(q, me()); if (!r) return;
    page('#db2777,#f472b6', 'Result', q.title, `<div class="dt-status ok">🎉 Your score: <b>${esc(r.gradeMark)}</b> — ${esc(r.feedback)}</div>${q.questions.map((qu, i) => qu.type === 'abcd'
      ? `<p>${i + 1}. ${esc(qu.text)}<br><small>Your answer: <b>${esc(qu.options[r.answers[i]] ?? '—')}</b> ${r.answers[i] === qu.correct ? '✅' : `❌ (correct: ${esc(qu.options[qu.correct])})`}</small></p>`
      : `<p>${i + 1}. ${esc(qu.text)}<br><em>“${esc(r.answers[i])}”</em> ${r.marks && r.marks[i] === true ? '✅ Correct' : '❌ Wrong'}</p>`).join('')}`);
  };

  /* =====================================================================
     3) DUELOS DEL PROFESOR
     ===================================================================== */
  let presetQuiz = null;
  const toGameQs = (q) => q.questions.filter(x => x.type === 'abcd').map(x => ({ q: esc(x.text), options: x.options.map(esc), correct: x.correct, explanation: '' }));

  function launcherHtml() {
    const grade = String(state.activeGrade), students = state.getStudentsByGrade(grade);
    const quizzes = getQ().filter(q => String(q.grade) === grade && counts(q).abcd);
    const topics = (window.scTopics ? scTopics() : []).map(t => `<option>${esc(t)}</option>`).join('');
    const useQuiz = presetQuiz || (quizzes.length ? 'quiz' : null);
    return `<div class="duel-launcher">
      <span style="font-size:.8rem;font-weight:800;text-transform:uppercase;color:var(--yellow-glow)">Class duel • Grade ${esc(grade)}</span>
      <h3 style="font-size:1.35rem;font-weight:900;margin:.25rem 0 .8rem">⚔️ Launch a duel to your students</h3>
      <div class="tt-radios"><label><input type="radio" name="gSrc" value="quiz" ${useQuiz ? 'checked' : ''} ${quizzes.length ? '' : 'disabled'} onchange="scGameSrc()"> With my quiz (my questions)</label>
        <label><input type="radio" name="gSrc" value="topic" ${useQuiz ? '' : 'checked'} onchange="scGameSrc()"> Random questions from the page (by topic)</label></div>
      <div id="gSrcQuiz" style="display:${useQuiz ? 'block' : 'none'}"><select id="gQuiz" class="form-control">${quizzes.map(q => `<option value="${q.id}" ${q.id === presetQuiz ? 'selected' : ''}>${esc(q.title)} (${counts(q).abcd} ABCD)</option>`).join('')}</select><small style="opacity:.85">In the duel only the quiz's ABCD questions are used.</small></div>
      <div id="gSrcTopic" style="display:${useQuiz ? 'none' : 'grid'};grid-template-columns:2fr 1fr;gap:.6rem"><select id="gTopic" class="form-control">${topics}</select><select id="gCount" class="form-control"><option>5</option><option>10</option><option>15</option></select></div>
      <div class="tt-radios" style="margin-top:.8rem"><label><input type="radio" name="gTarget" value="all" checked onchange="scGameSrc()"> The whole grade (${students.length})</label><label><input type="radio" name="gTarget" value="some" onchange="scGameSrc()"> Specific students</label></div>
      <div id="gTargets" class="tt-list" style="display:none;color:var(--text-main)">${students.map(s => `<label class="tt-item"><input type="checkbox" value="${esc(s.email)}"> ${esc(s.name)}</label>`).join('') || '<em>There are no students in this grade.</em>'}</div>
      <button class="btn-yellow" style="margin-top:.9rem" onclick="scLaunchGame()">🚀 Launch duel and send invitation</button>
      <p style="font-size:.78rem;opacity:.9;margin-top:.5rem">Each student receives the invitation. When they accept, the game opens right away. Their score (0 to 5) becomes stars.</p></div>`;
  }
  window.scGameSrc = function () {
    const src = document.querySelector('input[name="gSrc"]:checked')?.value;
    $('gSrcQuiz').style.display = src === 'quiz' ? 'block' : 'none'; $('gSrcTopic').style.display = src === 'quiz' ? 'none' : 'grid';
    $('gTargets').style.display = document.querySelector('input[name="gTarget"]:checked')?.value === 'some' ? 'grid' : 'none';
  };
  window.scLaunchGame = function () {
    const grade = String(state.activeGrade), src = document.querySelector('input[name="gSrc"]:checked')?.value;
    let questions, title;
    if (src === 'quiz') { const q = getQ().find(x => x.id === $('gQuiz')?.value); if (!q) return showToast('Choose a quiz.', 'warning'); questions = toGameQs(q); title = q.title; }
    else { const t = $('gTopic').value, n = parseInt($('gCount').value) || 5; questions = scBuild(t, n); title = t; }
    if (!questions.length) return showToast('There are no questions for the duel.', 'warning');
    let targets = [];
    if (document.querySelector('input[name="gTarget"]:checked')?.value === 'some') { targets = [...document.querySelectorAll('#gTargets input:checked')].map(i => i.value); if (!targets.length) return showToast('Choose at least one student.', 'warning'); }
    const g = getG(); g.unshift({ id: 'game-' + Date.now(), title, grade, questions, targets, createdBy: me().email, createdByName: me().name, createdAt: Date.now(), status: 'open', players: {} });
    saveG(g); presetQuiz = null; showToast(`⚔️ Duel launched! The invitation reached ${targets.length || state.getStudentsByGrade(grade).length} student(s).`, 'success'); renderApp();
  };
  window.scCloseGame = (id) => { const g = getG(), x = g.find(y => y.id === id); if (x) { x.status = x.status === 'open' ? 'closed' : 'open'; saveG(g); renderApp(); } };
  window.scDelGame = (id) => { if (!confirm('Delete this duel and its results?')) return; saveG(getG().filter(x => x.id !== id)); renderApp(); };
  function gamesListHtml() {
    const grade = String(state.activeGrade), games = getG().filter(g => String(g.grade) === grade);
    if (!games.length) return '<p style="margin-top:1.2rem"><em>You haven\'t launched any duels in this grade yet.</em></p>';
    const roster = state.getStudentsByGrade(grade);
    return `<h3 style="margin:1.4rem 0 .6rem;color:var(--navy)">📡 Launched duels</h3>${games.map(g => {
      const who = (g.targets && g.targets.length) ? roster.filter(s => g.targets.includes(s.email)) : roster;
      const rows = who.map(s => { const p = (g.players || {})[s.email]; return { s, p }; }).sort((a, b) => ((b.p?.pct ?? -1) - (a.p?.pct ?? -1)));
      const done = rows.filter(r => r.p && r.p.status === 'done').length;
      return `<div class="content-card" style="margin-top:.8rem;padding:1rem"><div class="card-top-bar"><div><strong>${esc(g.title)}</strong> <span class="dt-kind" style="margin-left:.3rem">${g.status === 'open' ? '🟢 Open' : '🔒 Closed'}</span>
        <div style="font-size:.78rem;color:var(--text-muted)">${g.questions.length} questions • ${done}/${who.length} terminaron</div></div>
        <div class="dt-actions"><button class="btn-secondary btn-sm" onclick="scCloseGame('${g.id}')">${g.status === 'open' ? '🔒 Close' : '🔓 Reopen'}</button><button class="btn-secondary btn-sm" onclick="scDelGame('${g.id}')">🗑️</button></div></div>
        <table class="gradebook-table" style="margin-top:.6rem"><thead><tr><th>Rank</th><th>Student</th><th>Status</th><th>Score</th><th>Score</th><th>Stars</th></tr></thead><tbody>${rows.map((r, i) => {
          const p = r.p, d = p && p.status === 'done';
          return `<tr><td>${d ? (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 + '') : '—'}</td><td>${esc(r.s.name)}</td><td>${d ? '✅ Finished' : p ? '🎮 Playing' : '⏳ Not answered'}</td><td>${d ? p.pct + '/100' : '—'}</td><td>${d ? p.nota : '—'}</td><td>${d ? '⭐ ' + p.stars : '—'}</td></tr>`; }).join('')}</tbody></table></div>`;
    }).join('')}`;
  }
  const _comp = window.renderTeacherCompetitionsSection;
  window.renderTeacherCompetitionsSection = function (c) {
    _comp(c);
    const banner = c.querySelector('.duel-arena-banner');
    if (banner) { banner.outerHTML = `<div class="duel-arena-banner" style="display:block">${launcherHtml()}</div>${gamesListHtml()}`; }
    else c.insertAdjacentHTML('afterbegin', launcherHtml() + gamesListHtml());
  };

  /* ---- Estudiante: invitación y juego ---- */
  const dismissed = new Set(); let popupId = null;
  function showGamePopup(g) {
    popupId = g.id;
    overlay('liveGamePopup', `<div class="modal-body" style="text-align:center;padding:1.5rem"><div style="font-size:3.5rem">🎮</div>
      <h3 style="margin:.4rem 0">${esc(g.createdByName)} launched a duel!</h3><p><b>${esc(g.title)}</b> • ${g.questions.length} questions</p>
      <p style="font-size:.85rem;color:var(--text-muted)">Your score becomes stars ⭐ (up to 5).</p>
      <div class="dt-actions" style="justify-content:center;margin-top:1rem"><button class="btn-primary" onclick="scJoinGame('${g.id}')">🎮 Accept and play</button><button class="btn-secondary" onclick="scDismissGame('${g.id}')">Not now</button></div></div>`);
  }
  window.scDismissGame = (id) => { dismissed.add(id); popupId = null; hide('liveGamePopup'); };
  window.scJoinGame = function (id) {
    hide('liveGamePopup'); popupId = null;
    const gs = getG(), g = gs.find(x => x.id === id), u = me();
    if (!g || g.status !== 'open') { showToast('This duel is already closed.', 'info'); return renderApp(); }
    if (g.players[u.email] && g.players[u.email].status === 'done') return showToast('You already played this duel.', 'info');
    g.players[u.email] = { name: u.name, status: 'accepted', at: Date.now() }; saveG(gs);
    scPlay(`⚔️ ${g.title}`, g.questions, (pct) => {
      const l = getG(), x = l.find(y => y.id === id); if (!x) return;
      const stars = Math.round(pct / 20), n = (pct / 20).toFixed(1);
      x.players[u.email] = { name: u.name, status: 'done', pct, nota: n, stars, at: Date.now() }; saveG(l);
      if (stars > 0) state.addPointsAndStars(0, stars);
      showToast(`You scored ${pct}/100 → score ${n}. ${stars > 0 ? `You won +${stars} ⭐!` : 'No stars this time, keep practicing!'}`, 'success'); renderApp();
    });
  };
  const _duels = window.renderStudentDuelsSection;
  window.renderStudentDuelsSection = function (c) {
    _duels(c);
    const u = me(), games = getG().filter(g => forMe(g, u));
    if (!games.length) return;
    c.insertAdjacentHTML('afterbegin', `<div class="content-card" style="margin-bottom:1.25rem;border:2px solid var(--yellow-accent)"><div class="card-top-bar"><div class="card-title-text"><h2>👩‍🏫 Your teacher's duels</h2><span>Enter the game and compete with your classmates. Your score becomes stars ⭐</span></div></div>
      ${games.map(g => { const p = g.players[u.email];
        return `<div class="mat-item"><div><strong>${esc(g.title)}</strong><div style="font-size:.78rem;color:var(--text-muted)">${g.questions.length} questions • ${esc(g.createdByName)}</div></div>
        ${p && p.status === 'done' ? `<span class="submission-status-badge submitted">${p.pct}/100 • score ${p.nota} • ⭐ ${p.stars}</span>` : g.status === 'open' ? `<button class="btn-primary btn-sm" onclick="scJoinGame('${g.id}')">🎮 ${p ? 'Continue' : 'Join and play'}</button>` : '<span class="submission-status-badge pending">🔒 Closed</span>'}</div>`; }).join('')}</div>`);
  };

  /* =====================================================================
     4) RULETA
     ===================================================================== */
  const W = { mode: 'students', grade: null, excluded: new Set(), removed: new Set(), custom: [], rot: 0, spinning: false, history: [] };
  const PAL = ['#0284c7', '#f59e0b', '#7c3aed', '#059669', '#ea580c', '#0d9488', '#db2777', '#1e3a8a'];
  const wItems = () => W.mode === 'custom' ? W.custom.map(l => ({ label: l })) : state.getStudentsByGrade(state.activeGrade).filter(s => !W.excluded.has(s.email) && !W.removed.has(s.email)).map(s => ({ label: s.name, s }));
  function wheelSvg(items) {
    const n = items.length, C = 150, R = 144;
    if (!n) return `<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="144" fill="#e2e8f0"/><text x="150" y="155" text-anchor="middle" fill="#64748b" font-size="16" font-family="sans-serif">No options</text></svg>`;
    const pt = (deg, r) => [C + r * Math.sin(deg * Math.PI / 180), C - r * Math.cos(deg * Math.PI / 180)], s = 360 / n, fs = n <= 8 ? 15 : n <= 16 ? 12 : n <= 24 ? 10 : 8;
    const short = (t) => { const w = String(t).split(' '); const x = w.length > 1 ? w[0] + ' ' + w[1][0] + '.' : w[0]; return x.length > 15 ? x.slice(0, 14) + '…' : x; };
    const parts = items.map((it, i) => {
      const col = PAL[i % PAL.length], mid = i * s + s / 2;
      const slice = n === 1 ? `<circle cx="${C}" cy="${C}" r="${R}" fill="${col}"/>` : (() => { const [x0, y0] = pt(i * s, R), [x1, y1] = pt((i + 1) * s, R); return `<path d="M ${C} ${C} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${s > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${col}" stroke="#fff" stroke-width="1.5"/>`; })();
      return slice + `<text transform="rotate(${mid - 90} ${C} ${C}) translate(34 ${fs / 3})" font-size="${fs}" font-weight="700" fill="#fff" font-family="sans-serif">${esc(short(it.label))}</text>`;
    }).join('');
    return `<svg viewBox="0 0 300 300">${parts}<circle cx="150" cy="150" r="16" fill="#fff" stroke="#1e3a8a" stroke-width="4"/></svg>`;
  }
  function renderRuleta(c) {
    const g = String(state.activeGrade); if (W.grade !== g) { W.grade = g; W.excluded = new Set(); W.removed = new Set(); W.history = []; W.rot = 0; }
    const students = state.getStudentsByGrade(g), items = wItems();
    c.innerHTML = `<div class="content-card"><div class="card-top-bar"><div class="card-title-group"><div class="card-title-icon" style="background:#fef3c7;color:#d97706">🎡</div>
      <div class="card-title-text"><h2>Class wheel (Grade ${esc(g)}</h2><span>To choose whose turn it is, draw turns, prizes… whatever you need!</span></div></div></div>
      <div class="tt-radios"><label><input type="radio" name="wMode" value="students" ${W.mode === 'students' ? 'checked' : ''} onchange="scWheelMode('students')"> Students of my grade</label><label><input type="radio" name="wMode" value="custom" ${W.mode === 'custom' ? 'checked' : ''} onchange="scWheelMode('custom')"> My own options</label></div>
      <div class="wheel-layout"><div><div class="wheel-box"><div class="wheel-pointer">▼</div><div id="wheelRot" class="wheel-rot" style="transform:rotate(${W.rot}deg)">${wheelSvg(items)}</div></div>
        <button class="btn-primary" id="wheelSpin" style="width:100%;margin-top:1rem;font-size:1.1rem" onclick="scWheelSpin()">🎡 Spin the wheel!</button><div id="wheelWin" class="wheel-win"></div></div>
      <div>${W.mode === 'students' ? `<div style="font-weight:700;margin-bottom:.4rem">Who takes part (tap to include or remove):</div><div class="wheel-chips">${students.map(s => { const off = W.excluded.has(s.email) || W.removed.has(s.email); return `<button class="wheel-chip ${off ? 'off' : ''}" onclick="scWheelToggle('${esc(s.email)}')">${off ? '✖' : '✔'} ${esc(s.name)}</button>`; }).join('') || '<em>There are no students in this grade.</em>'}</div>
        <label style="display:block;margin:.8rem 0"><input type="checkbox" id="wRemove" ${W.noRemove ? '' : 'checked'} onchange="W_noRemove(this.checked)"> Remove from the wheel whoever comes up (so it doesn't repeat)</label>
        <button class="btn-secondary btn-sm" onclick="scWheelReset()">🔄 Include everyone again</button>`
        : `<div style="font-weight:700;margin-bottom:.4rem">Write one option per line:</div><textarea id="wCustom" class="form-control" rows="8" placeholder="E.g.\nRead aloud\nGo to the board\nExtra point">${esc(W.custom.join('\n'))}</textarea><button class="btn-yellow" style="margin-top:.6rem" onclick="scWheelCustom()">✔ Load options into the wheel</button>`}
        <div style="margin-top:1rem"><b>History:</b> ${W.history.length ? W.history.map(h => `<span class="wheel-hist">${esc(h)}</span>`).join('') : '<em>nothing yet</em>'}</div></div></div></div>`;
  }
  window.W_noRemove = (on) => { W.noRemove = !on; };
  window.scWheelMode = (m) => { W.mode = m; W.rot = 0; renderApp(); };
  window.scWheelToggle = (email) => { if (W.excluded.has(email) || W.removed.has(email)) { W.excluded.delete(email); W.removed.delete(email); } else W.excluded.add(email); W.rot = 0; renderApp(); };
  window.scWheelReset = () => { W.excluded = new Set(); W.removed = new Set(); W.rot = 0; renderApp(); };
  window.scWheelCustom = () => { W.custom = ($('wCustom').value || '').split('\n').map(s => s.trim()).filter(Boolean); if (W.custom.length < 2) { showToast('Write at least 2 options.', 'warning'); } W.rot = 0; renderApp(); };
  window.scWheelSpin = function () {
    const items = wItems(); if (W.spinning) return; if (items.length < 1) return showToast('There are no options in the wheel.', 'warning');
    W.spinning = true; $('wheelWin').innerHTML = '';
    const n = items.length, s = 360 / n, k = Math.floor(Math.random() * n), mid = k * s + s / 2;
    W.rot += 360 * 6 + (((-mid - W.rot) % 360) + 360) % 360;
    const el = $('wheelRot'); el.style.transition = 'transform 5s cubic-bezier(.12,.7,.15,1)'; el.style.transform = `rotate(${W.rot}deg)`;
    setTimeout(() => {
      W.spinning = false; const it = items[k]; W.history.unshift(it.label);
      const av = it.s ? `<span class="wheel-av">${generateAvatarSvg(it.s.avatar || {}, 70)}</span>` : '<span style="font-size:3rem">🎉</span>';
      $('wheelWin').innerHTML = `<div class="wheel-winner">${av}<div><small>It's …'s turn!</small><h2>${esc(it.label)}</h2></div></div>`;
      if (it.s && !W.noRemove) { W.removed.add(it.s.email); setTimeout(() => { if (!W.spinning && state.currentSection === 'ruleta') { const keep = $('wheelWin').innerHTML; W.rot = 0; renderApp(); $('wheelWin').innerHTML = keep; } }, 2500); }
    }, 5150);
  };

  /* =====================================================================
     5) LISTA DE TODOS LOS ESTUDIANTES
     ===================================================================== */
  const _roster = window.renderTeacherStudentsRosterSection;
  window.renderTeacherStudentsRosterSection = function (c) {
    _roster(c);
    const all = state.getStudents().slice().sort((a, b) => (+a.grade - +b.grade) || a.name.localeCompare(b.name));
    c.insertAdjacentHTML('beforeend', `<div class="content-card" style="margin-top:1.25rem"><div class="card-top-bar"><div class="card-title-text"><h2>👥 All SmartClass students (${all.length})</h2><span>From all grades</span></div></div>
      <div style="overflow:auto"><table class="gradebook-table"><thead><tr><th>Student</th><th>Grade</th><th>Email</th><th>Level</th><th>⭐</th><th>Points</th></tr></thead><tbody>${all.map(s => `<tr><td><div style="display:flex;align-items:center;gap:.5rem"><span class="student-avatar-sm" style="width:30px;height:30px">${generateAvatarSvg(s.avatar || {}, 30)}</span><strong>${esc(s.name)}</strong></div></td><td>${esc(s.grade)}</td><td>${esc(s.email)}</td><td>${esc(s.level || 'Apprentice')}</td><td>${s.stars || 0}</td><td>${s.points || 0}</td></tr>`).join('') || '<tr><td colspan="6"><em>No students yet.</em></td></tr>'}</tbody></table></div></div>`);
  };

  /* =====================================================================
     Pestañas, rutas y avisos
     ===================================================================== */
  const _tabs = window.renderSubnavTabs;
  window.renderSubnavTabs = function (isTeacher) {
    _tabs(isTeacher);
    const box = $('subnavTabsContainer'); if (!box) return;
    const av = [...box.querySelectorAll('button')].find(x => /switchSection\('avatar'\)/.test(x.getAttribute('onclick') || ''));
    const add = (sec, label, badge) => {
      const b = document.createElement('button'); b.className = 'subnav-tab-btn' + (state.currentSection === sec ? ' active' : ''); b.setAttribute('onclick', `switchSection('${sec}')`);
      b.innerHTML = `<span>${label}</span>${badge ? `<span class="tab-badge-counter" style="background:#ef4444;color:#fff">${badge}</span>` : ''}`; av ? box.insertBefore(b, av) : box.appendChild(b);
    };
    if (isTeacher) {
      add('quizzes', '❓ Quizzes', getQ().reduce((n, q) => n + pendingReviews(q), 0));
      add('ruleta', '🎡 Wheel');
    } else if (me()) {
      const u = me(); add('quizzes', '❓ Quizzes', myQuizzes(u).filter(q => !myResp(q, u)).length);
    }
  };
  const _sec = window.renderActiveSection;
  window.renderActiveSection = function (t) {
    const v = $('mainViewContainer'), s = state.currentSection;
    if (v) {
      if (t && s === 'quizzes') return renderTQuizzes(v);
      if (t && s === 'ruleta') return renderRuleta(v);
      if (!t && s === 'quizzes') return renderSQuizzes(v);
    }
    return _sec(t);
  };
  // la tarjeta de “Competir” y las notas también cuentan para el boletín del estudiante (ver app.js)

  /* ---- Vigilante: invitaciones, notas que llegan y refresco en vivo ---- */
  let lastSig = null;
  const typing = () => { const a = document.activeElement; return !!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && $('mainViewContainer')?.contains(a)); };
  function tick() {
    const u = me(); if (!u) { hide('liveGamePopup'); return; }
    if (isS()) {
      let changed = false;
      const tasks = state.getTasks();
      tasks.forEach(t => (t.submissions || []).forEach(s => { if (s.studentEmail === u.email && s.reviewed && !s.notified) { s.notified = true; changed = true; showToast(`🎉 Your teacher graded the homework \"${t.title}\": score ${s.gradeMark}`, 'success'); } }));
      if (changed) state.saveTasks(tasks);
      const qs = getQ(); let qch = false;
      qs.forEach(q => (q.responses || []).forEach(r => { if (r.email === u.email && r.reviewed && r.notified === false) { r.notified = true; qch = true; showToast(`🎉 Your teacher graded the quiz \"${q.title}\": score ${r.gradeMark}`, 'success'); } }));
      if (qch) saveQ(qs);
      const open = getG().filter(g => g.status === 'open' && forMe(g, u));
      const inv = open.find(g => !(g.players && g.players[u.email]) && !dismissed.has(g.id));
      if (inv && popupId !== inv.id && !gameActive() && !$('duelInvitePopup')?.classList.contains('active')) showGamePopup(inv);
      if (popupId && !open.some(g => g.id === popupId)) { popupId = null; hide('liveGamePopup'); }
      const sig = JSON.stringify([getQ().filter(q => q.published && String(q.grade) === String(u.grade)).map(q => [q.id, (q.responses || []).length]), getG().filter(g => forMe(g, u)).map(g => [g.id, g.status])]);
      if ((changed || qch || (lastSig !== null && sig !== lastSig)) && ['tareas', 'quizzes', 'calificaciones', 'competir'].includes(state.currentSection) && !gameActive() && !$('detailPage') && !typing()) renderApp();
      lastSig = sig;
    } else if (isT()) {
      const sig = JSON.stringify([getG().map(g => [g.id, g.status, Object.values(g.players || {}).map(p => p.status + (p.pct ?? ''))]), getQ().map(q => (q.responses || []).length), state.getTasks().map(t => (t.submissions || []).length)]);
      if (lastSig !== null && sig !== lastSig && ['competencias', 'quizzes', 'calificaciones'].includes(state.currentSection) && !$('detailPage') && !typing() && !$('quizBuilder')?.classList.contains('active')) renderApp();
      lastSig = sig;
    }
  }
  setInterval(tick, 1500);
  window.addEventListener('storage', tick);
})();
