/**
 * SMARTCLASS - Plataforma Educativa Interactiva
 * Módulos:
 * - Pantalla de Inicio Aislada y Acceso Directo por Grado
 * - Secciones de Docente: Actividades Interactivas por Tema, Creador de Exámenes,
 *   Competencias de Curso / Duelos de Alumnos, Calificaciones y Revisión,
 *   Lista Oficial de Estudiantes de Grado, Avatar Docente.
 * - Secciones de Estudiante: Montar Tareas y Descargas de Guías, Mis Calificaciones,
 *   Actividades Continuas con Repetición al Fallar, Competir e Invitar Compañeros,
 *   Tutorías Grupales con Invitación, Crear Mi Avatar.
 */

// =============================================================================
// 1. ESTADO Y LOCALSTORAGE
// =============================================================================

const STORAGE_KEYS = {
  CURRENT_USER: 'smartclass_current_user',
  STUDENTS: 'smartclass_students_list',
  TEACHERS: 'smartclass_teachers_list',
  TASKS: 'smartclass_tasks_list',
  MATERIALS: 'smartclass_materials_list',
  TUTORS: 'smartclass_grade_tutors',
  EXAMS: 'smartclass_custom_exams',
  ACTIVITIES: 'smartclass_topic_activities',
  DUELS: 'smartclass_student_duels',
  TUTORING_SESSIONS: 'smartclass_tutoring_sessions'
};

// =============================================================================
// CATÁLOGO DE MATERIAS / ASIGNATURAS POR GRADO (1° A 11°)
// Grados 10° y 11° tienen materias avanzadas y especializadas (Física, Química,
// Cálculo, Filosofía, Ciencias Políticas, etc.)
// =============================================================================
const SUBJECTS_BY_GRADE = {
  '1': [
    'Math and Counting',
    'Spanish Language and Writing',
    'Natural Sciences and Exploration',
    'Social Studies and My Community',
    'Beginner English',
    'Arts and Drawing',
    'Physical Education and Coordination',
    'Technology and Computing for Kids',
    'Ethics and Values',
    'Religious Education'
  ],
  '2': [
    'Math and Basic Operations',
    'Spanish Language and Comprehension',
    'Natural Sciences and Living Things',
    'Social Studies and Environment',
    'Basic English',
    'Arts Education',
    'Physical Education',
    'Technology and Computing',
    'Ethics and Coexistence',
    'Religious Education'
  ],
  '3': [
    'Math and Multiplication',
    'Spanish Language and Composition',
    'Natural Sciences and Ecosystems',
    'Social Studies and Local History',
    'English',
    'Arts Education',
    'Physical Education',
    'Technology and Computing',
    'Peace Studies',
    'Ethics and Values'
  ],
  '4': [
    'Math and Fractions',
    'Spanish Language and Literature',
    'Natural Sciences and Environment',
    'Social Studies and Geography',
    'Primary English',
    'Arts Education',
    'Physical Education and Sports',
    'Technology and Computing',
    'Ethics and Values',
    'Peace Studies'
  ],
  '5': [
    'Math and Logical Reasoning',
    'Spanish Language and Critical Reading',
    'Natural Sciences and Body Systems',
    'Social Studies and Colombian History',
    'Intermediate English',
    'Arts Education',
    'Physical Education and Sports',
    'Technology, Robotics and Computing',
    'Ethics and Citizenship',
    'Peace Studies'
  ],
  '6': [
    'Math and Arithmetic',
    'Spanish Language and Text Types',
    'Biology and Natural Sciences',
    'Social Studies (History and Geography)',
    'English A1-A2',
    'Technology and Computing',
    'Arts Education',
    'Physical Education',
    'Ethics and Human Values',
    'Peace Studies',
    'Entrepreneurship'
  ],
  '7': [
    'Math and Introductory Algebra',
    'Spanish Language and Oral Expression',
    'Biology and Ecology',
    'Social Studies (History and Civilizations)',
    'English',
    'Technology and Systems',
    'Arts Education',
    'Physical Education',
    'Ethics and Values',
    'Entrepreneurship'
  ],
  '8': [
    'Algebra and Factoring',
    'Spanish Language and Latin American Literature',
    'Natural Sciences (Genetics and the Cell)',
    'Social Studies (World Geography and Revolutions)',
    'English B1',
    'Technology and Innovation',
    'Physical Education',
    'Arts Education',
    'Ethics and Introductory Philosophy',
    'Peace Studies and Democracy'
  ],
  '9': [
    'Advanced Algebra and Analytic Geometry',
    'Spanish Language and World Literature',
    'Natural Sciences (Introductory Chemistry and Physics)',
    'Social Studies and Geopolitics',
    'English B1+',
    'Technology, Programming and Computing',
    'Physical Education',
    'Arts Education',
    'Ethics and Human Rights',
    'Entrepreneurship and Leadership'
  ],
  '10': [
    'Trigonometry and Analytic Geometry',
    'Mechanical Physics and Kinematics',
    'General and Inorganic Chemistry',
    'Classical and Modern Philosophy',
    'Political and Economic Sciences',
    'Spanish Language and Critical Literature',
    'Academic English / B2',
    'Technology, Computing and Design',
    'Statistics and Probability',
    'Research Methodology',
    'Physical Education and Sports',
    'Ethics and Bioethics',
    'Saber 10 Exam Preparation'
  ],
  '11': [
    'Differential and Integral Calculus',
    'Quantum Physics, Optics and Waves',
    'Organic Chemistry and Biochemistry',
    'Contemporary Philosophy and Epistemology',
    'Global Economic and Political Sciences',
    'Spanish Language and Argumentative Essay',
    'Advanced English / Bilingualism B2-C1',
    'Technology, Web Development and Systems',
    'Inferential Statistics',
    'Graduation Project / School Thesis',
    'Physical Education and Training',
    'Vocational and College Guidance',
    'Saber 11 / ICFES Exam Preparation'
  ]
};

function getSubjectsForGrade(grade) {
  const g = String(grade || '5');
  return SUBJECTS_BY_GRADE[g] || SUBJECTS_BY_GRADE['5'];
}

function populateSubjectDropdown(selectId, grade, selectedVal = null) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const subjects = getSubjectsForGrade(grade);
  let html = subjects.map(s => `
    <option value="${s}" ${selectedVal === s ? 'selected' : ''}>${s}</option>
  `).join('');

  html += `<option value="__custom__">➕ Other custom subject...</option>`;
  select.innerHTML = html;
}

function updateSubjectDropdown(gradeSelectId, subjectSelectId) {
  const grade = document.getElementById(gradeSelectId)?.value || state.activeGrade;
  populateSubjectDropdown(subjectSelectId, grade);

  const customInputId = subjectSelectId.replace('Select', 'CustomInput');
  const customInput = document.getElementById(customInputId);
  if (customInput) {
    customInput.style.display = 'none';
    customInput.value = '';
  }
}

function checkCustomSubjectOption(selectId, customInputId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(customInputId);
  if (select && input) {
    if (select.value === '__custom__') {
      input.style.display = 'block';
      input.focus();
    } else {
      input.style.display = 'none';
      input.value = '';
    }
  }
}

function getSelectedSubjectValue(selectId, customInputId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(customInputId);
  if (select && select.value === '__custom__' && input && input.value.trim()) {
    return input.value.trim();
  }
  return select ? select.value : 'General';
}

// Estudiantes por defecto en grados
const DEFAULT_STUDENTS = [
  { id: 'std-1', name: 'Valeria Gomez', email: 'valeria.gomez@estudiante.edu', grade: '5', points: 0, stars: 0, level: 'Apprentice', isTutor: true, avatar: { skin: '#ffd1a4', hair: 'ponytail', hairColor: '#4a2c11', clothes: 'hoodie', clothesColor: '#0284c7', expression: 'smile', accessory: 'glasses' } },
  { id: 'std-2', name: 'Mateo Rodriguez', email: 'mateo.rodriguez@estudiante.edu', grade: '5', points: 0, stars: 0, level: 'Apprentice', isTutor: false, avatar: { skin: '#fcd34d', hair: 'short', hairColor: '#1e293b', clothes: 'tshirt', clothesColor: '#f59e0b', expression: 'cool', accessory: 'headphones' } },
  { id: 'std-3', name: 'Camila Morales', email: 'camila.morales@estudiante.edu', grade: '5', points: 0, stars: 0, level: 'Apprentice', isTutor: false, avatar: { skin: '#fcd34d', hair: 'curly', hairColor: '#78350f', clothes: 'polo', clothesColor: '#10b981', expression: 'wink', accessory: 'star' } },
  { id: 'std-4', name: 'Santiago Perez', email: 'santiago.perez@estudiante.edu', grade: '7', points: 0, stars: 0, level: 'Apprentice', isTutor: true, avatar: { skin: '#e2a76f', hair: 'spiky', hairColor: '#1e293b', clothes: 'hoodie', clothesColor: '#8b5cf6', expression: 'cool', accessory: 'none' } },
  { id: 'std-5', name: 'Lucia Fernandez', email: 'lucia.f@estudiante.edu', grade: '7', points: 0, stars: 0, level: 'Apprentice', isTutor: false, avatar: { skin: '#ffd1a4', hair: 'bob', hairColor: '#991b1b', clothes: 'tshirt', clothesColor: '#ec4899', expression: 'smile', accessory: 'glasses' } },
  { id: 'std-6', name: 'Daniel Ortiz', email: 'daniel.ortiz@estudiante.edu', grade: '11', points: 0, stars: 0, level: 'Apprentice', isTutor: true, avatar: { skin: '#ffd1a4', hair: 'short', hairColor: '#1e293b', clothes: 'polo', clothesColor: '#0284c7', expression: 'cool', accessory: 'gradcap' } },
  { id: 'std-7', name: 'Mariana Castro', email: 'mariana.castro@estudiante.edu', grade: '11', points: 0, stars: 0, level: 'Apprentice', isTutor: false, avatar: { skin: '#fcd34d', hair: 'long', hairColor: '#4a2c11', clothes: 'hoodie', clothesColor: '#f59e0b', expression: 'smile', accessory: 'none' } },
  { id: 'std-8', name: 'Samuel Rojas', email: 'samuel.rojas@estudiante.edu', grade: '3', points: 0, stars: 0, level: 'Apprentice', isTutor: false, avatar: { skin: '#ffd1a4', hair: 'spiky', hairColor: '#b45309', clothes: 'tshirt', clothesColor: '#38bdf8', expression: 'smile', accessory: 'none' } },
  { id: 'std-9', name: 'Isabella Duarte', email: 'isabella.d@estudiante.edu', grade: '1', points: 0, stars: 0, level: 'Apprentice', isTutor: true, avatar: { skin: '#ffd1a4', hair: 'curly', hairColor: '#1e293b', clothes: 'tshirt', clothesColor: '#ec4899', expression: 'smile', accessory: 'star' } },
  { id: 'std-10', name: 'Lucas Benitez', email: 'lucas.b@estudiante.edu', grade: '1', points: 0, stars: 0, level: 'Apprentice', isTutor: false, avatar: { skin: '#fcd34d', hair: 'short', hairColor: '#334155', clothes: 'tshirt', clothesColor: '#10b981', expression: 'cool', accessory: 'none' } }
];

const DEFAULT_TEACHER = {
  id: 'tch-1',
  name: 'Prof. Roberto Mendoza',
  email: 'roberto.mendoza@smartclass.edu',
  role: 'docente',
  subject: 'Science and Math',
  avatar: { skin: '#ffd1a4', hair: 'short', hairColor: '#334155', clothes: 'blazer', clothesColor: '#1e3a8a', expression: 'smile', accessory: 'glasses' }
};

const DEFAULT_TASKS = [];

// Exámenes creados por profesores (Evaluaciones oficiales con soporte de entrega y calificación)
const DEFAULT_EXAMS = [];

// Actividades Interactivas Iniciales
const DEFAULT_ACTIVITIES = [];

// Duelos entre estudiantes
const DEFAULT_DUELS = [];

// Sesiones de tutoría
const DEFAULT_TUTORING_SESSIONS = [];

// Banco de Preguntas Continuas (Si se equivoca, siguen saliendo más)
const INFINITE_QUESTION_POOL = [
  { q: 'What is 7 × 8?', options: ['54', '56', '58', '64'], correct: 1, explanation: '7 times 8 is exactly 56.' },
  { q: 'Which organ of the human body pumps blood?', options: ['The lungs', 'The heart', 'The brain', 'The stomach'], correct: 1, explanation: 'The heart is the muscle that pumps blood throughout the body.' },
  { q: 'What state is water in when it freezes at 0°C?', options: ['Liquid', 'Gaseous', 'Solid', 'Plasma'], correct: 2, explanation: 'When it freezes at 0°C, water becomes solid, forming ice.' },
  { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correct: 1, explanation: 'A hexagon is a regular polygon with 6 sides.' },
  { q: 'What is the capital of Colombia?', options: ['Medellin', 'Cali', 'Bogota', 'Cartagena'], correct: 2, explanation: 'Bogota is the capital of the Republic of Colombia.' },
  { q: 'What type of word is \"quickly\"?', options: ['Noun', 'Adverb', 'Verb', 'Pronoun'], correct: 1, explanation: '\"Quickly\" is an adverb of manner.' },
  { q: 'What is 120 divided by 4?', options: ['25', '30', '35', '40'], correct: 1, explanation: '120 divided into 4 equal parts is 30.' },
  { q: 'Which gas do plants absorb during the day for photosynthesis?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], correct: 1, explanation: 'Plants absorb carbon dioxide (CO₂) and release oxygen.' }
];

// =============================================================================
// 2. GESTOR DE ESTADO GLOBAL
// =============================================================================

class SmartClassState {
  constructor() {
    this.initDatabase();
    this.currentUser = this.load(STORAGE_KEYS.CURRENT_USER) || null;
    if (this.currentUser && !this.currentUser.role) this.currentUser.role = 'estudiante';
    this.activeGrade = this.currentUser && this.currentUser.role === 'estudiante' 
      ? String(this.currentUser.grade) 
      : '5';
    
    // Pestaña modular activa
    this.currentSection = this.currentUser && this.currentUser.role === 'docente' 
      ? 'calificaciones' 
      : 'menu';
    
    // Variables para la práctica de preguntas infinitas
    this.quizIndex = 0;
    this.quizStreak = 0;
  }

  initDatabase() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) this.save(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) this.save(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) this.save(STORAGE_KEYS.TEACHERS, [DEFAULT_TEACHER]);
    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) this.save(STORAGE_KEYS.EXAMS, DEFAULT_EXAMS);
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) this.save(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES);
    if (!localStorage.getItem(STORAGE_KEYS.DUELS)) this.save(STORAGE_KEYS.DUELS, DEFAULT_DUELS);
    if (!localStorage.getItem(STORAGE_KEYS.TUTORING_SESSIONS)) this.save(STORAGE_KEYS.TUTORING_SESSIONS, DEFAULT_TUTORING_SESSIONS);
    if (!localStorage.getItem(STORAGE_KEYS.TUTORS)) {
      this.save(STORAGE_KEYS.TUTORS, {
        '1': 'isabella.d@estudiante.edu',
        '5': 'valeria.gomez@estudiante.edu',
        '7': 'santiago.perez@estudiante.edu',
        '11': 'daniel.ortiz@estudiante.edu'
      });
    }
  }

  save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  load(key) {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; }
    catch (e) { return null; }
  }

  getStudents() { return this.load(STORAGE_KEYS.STUDENTS) || []; }
  saveStudents(s) { this.save(STORAGE_KEYS.STUDENTS, s); }
  getStudentsByGrade(grade) { return this.getStudents().filter(s => String(s.grade) === String(grade)); }

  getTasks() { return this.load(STORAGE_KEYS.TASKS) || []; }
  saveTasks(t) { this.save(STORAGE_KEYS.TASKS, t); }
  getTasksByGrade(grade) { return this.getTasks().filter(t => String(t.grade) === String(grade)); }

  getExams() { return this.load(STORAGE_KEYS.EXAMS) || []; }
  saveExams(e) { this.save(STORAGE_KEYS.EXAMS, e); }
  getExamsByGrade(grade) { return this.getExams().filter(e => String(e.grade) === String(grade)); }

  getActivities() { return this.load(STORAGE_KEYS.ACTIVITIES) || []; }
  saveActivities(a) { this.save(STORAGE_KEYS.ACTIVITIES, a); }
  getActivitiesByGrade(grade) { return this.getActivities().filter(a => String(a.grade) === String(grade)); }

  getDuels() { return this.load(STORAGE_KEYS.DUELS) || []; }
  saveDuels(d) { this.save(STORAGE_KEYS.DUELS, d); }
  getDuelsByGrade(grade) { return this.getDuels().filter(d => String(d.grade) === String(grade)); }

  getTutorings() { return this.load(STORAGE_KEYS.TUTORING_SESSIONS) || []; }
  saveTutorings(t) { this.save(STORAGE_KEYS.TUTORING_SESSIONS, t); }
  getTutoringsByGrade(grade) { return this.getTutorings().filter(t => String(t.grade) === String(grade)); }

  getTutorForGrade(grade) {
    const tutors = this.load(STORAGE_KEYS.TUTORS) || {};
    const email = tutors[grade];
    if (!email) return null;
    return this.getStudents().find(s => s.email === email) || null;
  }

  setTutorForGrade(grade, studentEmail) {
    const tutors = this.load(STORAGE_KEYS.TUTORS) || {};
    tutors[grade] = studentEmail;
    this.save(STORAGE_KEYS.TUTORS, tutors);

    const students = this.getStudents();
    students.forEach(s => {
      if (String(s.grade) === String(grade)) s.isTutor = (s.email === studentEmail);
    });
    this.saveStudents(students);
  }

  setCurrentUser(u) {
    if (u && !u.role) u = { ...u, role: 'estudiante' };
    this.currentUser = u;
    if (u) {
      this.save(STORAGE_KEYS.CURRENT_USER, u);
      this.activeGrade = String(u.grade || '5');
      this.currentSection = u.role === 'docente' ? 'calificaciones' : 'menu';
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  updateCurrentUserProfile(data) {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...data };
    this.save(STORAGE_KEYS.CURRENT_USER, this.currentUser);

    if (this.currentUser.role === 'estudiante') {
      const students = this.getStudents();
      const idx = students.findIndex(s => s.email === this.currentUser.email);
      if (idx !== -1) {
        students[idx] = { ...students[idx], ...data };
        this.saveStudents(students);
      }
    }
  }

  addPointsAndStars(pts, stars) {
    if (!this.currentUser || this.currentUser.role !== 'estudiante') return;
    this.currentUser.points = (this.currentUser.points || 0) + pts;
    this.currentUser.stars = (this.currentUser.stars || 0) + stars;

    if (this.currentUser.points >= 300) this.currentUser.level = 'Subject Expert';
    else if (this.currentUser.points >= 100) this.currentUser.level = 'Explorer';
    else this.currentUser.level = 'Apprentice';

    this.updateCurrentUserProfile({
      points: this.currentUser.points,
      stars: this.currentUser.stars,
      level: this.currentUser.level
    });
  }
}

const state = new SmartClassState();

// =============================================================================
// 3. GENERADOR DE AVATARES VECTORIALES SVG
// =============================================================================

function generateAvatarSvg(config = {}, size = 120) {
  const skin = config.skin || '#ffd1a4';
  const hair = config.hair || 'short';
  const hairColor = config.hairColor || '#334155';
  const clothes = config.clothes || 'tshirt';
  const clothesColor = config.clothesColor || '#0284c7';
  const expression = config.expression || 'smile';
  const accessory = config.accessory || 'none';

  let clothesSvg = '';
  if (clothes === 'hoodie') {
    clothesSvg = `
      <path d="M 15 110 Q 50 82 85 110 L 85 120 L 15 120 Z" fill="${clothesColor}" />
      <path d="M 40 88 Q 50 102 60 88" stroke="#ffffff" stroke-width="2.5" fill="none" />
    `;
  } else if (clothes === 'blazer') {
    clothesSvg = `
      <path d="M 12 110 Q 50 80 88 110 L 88 120 L 12 120 Z" fill="${clothesColor}" />
      <polygon points="50,86 42,120 58,120" fill="#ffffff" />
      <polygon points="48,94 50,105 52,94" fill="#ef4444" />
    `;
  } else if (clothes === 'polo') {
    clothesSvg = `
      <path d="M 15 110 Q 50 84 85 110 L 85 120 L 15 120 Z" fill="${clothesColor}" />
      <polygon points="50,88 38,94 50,100" fill="#ffffff" />
      <polygon points="50,88 62,94 50,100" fill="#ffffff" />
    `;
  } else {
    clothesSvg = `
      <path d="M 15 110 Q 50 82 85 110 L 85 120 L 15 120 Z" fill="${clothesColor}" />
      <path d="M 38 86 Q 50 96 62 86" stroke="${clothesColor}" stroke-width="3" fill="#ffffff" />
    `;
  }

  let hairSvg = '';
  if (hair === 'curly') {
    hairSvg = `
      <circle cx="34" cy="34" r="14" fill="${hairColor}" />
      <circle cx="50" cy="25" r="15" fill="${hairColor}" />
      <circle cx="66" cy="34" r="14" fill="${hairColor}" />
    `;
  } else if (hair === 'ponytail') {
    hairSvg = `
      <path d="M 32 45 C 30 25, 70 25, 68 45 C 72 32, 60 22, 50 22 C 40 22, 28 32, 32 45 Z" fill="${hairColor}" />
      <path d="M 68 38 C 82 30, 85 45, 82 60 C 80 50, 75 42, 68 38 Z" fill="${hairColor}" />
    `;
  } else if (hair === 'spiky') {
    hairSvg = `
      <polygon points="30,42 35,22 42,32 50,18 58,32 65,22 70,42" fill="${hairColor}" />
    `;
  } else {
    hairSvg = `
      <path d="M 30 45 C 28 26, 72 26, 70 45 C 65 32, 55 30, 50 30 C 45 30, 35 32, 30 45 Z" fill="${hairColor}" />
    `;
  }

  let faceSvg = '';
  if (expression === 'cool') {
    faceSvg = `
      <path d="M 38 48 Q 44 46 48 48" stroke="#1e293b" stroke-width="2" />
      <path d="M 54 48 Q 58 46 64 48" stroke="#1e293b" stroke-width="2" />
      <ellipse cx="43" cy="53" rx="2.5" ry="1.5" fill="#1e293b" />
      <ellipse cx="59" cy="53" rx="2.5" ry="1.5" fill="#1e293b" />
      <path d="M 44 65 Q 52 70 58 64" stroke="#1e293b" stroke-width="2" fill="none" />
    `;
  } else {
    faceSvg = `
      <ellipse cx="42" cy="52" rx="3.5" ry="3.5" fill="#1e293b" />
      <ellipse cx="58" cy="52" rx="3.5" ry="3.5" fill="#1e293b" />
      <path d="M 42 63 Q 50 71 58 63" stroke="#1e293b" stroke-width="2.5" fill="none" />
    `;
  }

  let accSvg = '';
  if (accessory === 'glasses') {
    accSvg = `
      <circle cx="42" cy="52" r="7" stroke="#1e293b" stroke-width="2" fill="rgba(255,255,255,0.25)" />
      <circle cx="58" cy="52" r="7" stroke="#1e293b" stroke-width="2" fill="rgba(255,255,255,0.25)" />
      <line x1="49" y1="52" x2="51" y2="52" stroke="#1e293b" stroke-width="2" />
    `;
  } else if (accessory === 'headphones') {
    accSvg = `
      <path d="M 28 55 C 26 28, 74 28, 72 55" stroke="#475569" stroke-width="3" fill="none" />
      <rect x="25" y="47" width="5" height="15" rx="2.5" fill="#ef4444" />
      <rect x="70" y="47" width="5" height="15" rx="2.5" fill="#ef4444" />
    `;
  } else if (accessory === 'star') {
    accSvg = `
      <polygon points="68,26 70,31 75,31 71,34 73,39 68,36 63,39 65,34 61,31 66,31" fill="#f59e0b" />
    `;
  }

  return `
    <svg viewBox="0 0 100 120" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:hidden;">
      <defs>
        <radialGradient id="avGlow_${size}" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#e0f2fe" stop-opacity="0.4" />
        </radialGradient>
      </defs>
      <rect width="100" height="120" fill="url(#avGlow_${size})" />
      <ellipse cx="32" cy="54" rx="4" ry="6" fill="${skin}" />
      <ellipse cx="68" cy="54" rx="4" ry="6" fill="${skin}" />
      <circle cx="50" cy="54" r="20" fill="${skin}" />
      <rect x="44" y="70" width="12" height="15" fill="${skin}" />
      ${clothesSvg}
      ${hairSvg}
      ${faceSvg}
      ${accSvg}
    </svg>
  `;
}

// =============================================================================
// 4. NOTIFICACIONES TOAST
// =============================================================================

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `smart-toast ${type}`;
  let icon = '✨';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =============================================================================
// 5. PANTALLA DE INICIO (PORTAL GATEWAY Y LOGIN AISLADO SmartClass )
// =============================================================================

function showPortalGateway() {
  const gateway = document.getElementById('portalGatewayView');
  const stdCard = document.getElementById('studentLoginCardView');
  const tchCard = document.getElementById('teacherLoginCardView');

  if (gateway) gateway.style.display = 'block';
  if (stdCard) stdCard.style.display = 'none';
  if (tchCard) tchCard.style.display = 'none';
}

function showLoginRole(role) {
  const gateway = document.getElementById('portalGatewayView');
  const stdCard = document.getElementById('studentLoginCardView');
  const tchCard = document.getElementById('teacherLoginCardView');

  if (gateway) gateway.style.display = 'none';

  if (role === 'estudiante') {
    if (stdCard) stdCard.style.display = 'flex';
    if (tchCard) tchCard.style.display = 'none';
  } else if (role === 'docente') {
    if (stdCard) stdCard.style.display = 'none';
    if (tchCard) tchCard.style.display = 'flex';
  } else if (role === 'admin') {
    showToast('Administrative Portal: Management of admissions, certificates and SmartClass registrar.', 'info');
    // Para conveniencia de prueba, puede acceder al docente o estudiante
    if (tchCard) tchCard.style.display = 'flex';
  }
}

function handleDedicatedStudentLogin(e) {
  e.preventDefault();
  const name = document.getElementById('cbnStudentName').value.trim();
  const email = document.getElementById('cbnStudentEmail').value.trim().toLowerCase();
  const grade = document.getElementById('cbnStudentGrade').value;

  if (!name || !email) {
    showToast('Please enter your name and email.', 'warning');
    return;
  }

  let students = state.getStudents();
  let student = students.find(s => s.email === email);
  if (!student) {
    student = {
      id: 'std-' + Date.now(),
      name,
      email,
      grade: String(grade),
      points: 0,
      stars: 0,
      level: 'Apprentice',
      isTutor: false,
      avatar: { skin: '#ffd1a4', hair: 'short', hairColor: '#4a2c11', clothes: 'hoodie', clothesColor: '#0284c7', expression: 'smile', accessory: 'none' }
    };
    students.push(student);
    state.saveStudents(students);
  } else {
    student.name = name;
    student.grade = String(grade);
    state.saveStudents(students);
  }

  state.setCurrentUser(student);
  state.activeGrade = String(grade);
  state.currentSection = 'menu';
  showToast(`Welcome ${student.name}! You have entered Grade ${student.grade} in SmartClass.`, 'success');
  renderApp();
}

function handleDedicatedTeacherLogin(e) {
  e.preventDefault();
  const name = document.getElementById('cbnTeacherName').value.trim();
  const email = document.getElementById('cbnTeacherEmail').value.trim().toLowerCase();

  let teachers = state.load(STORAGE_KEYS.TEACHERS) || [];
  let teacher = teachers.find(t => t.email === email);
  if (!teacher) {
    teacher = {
      id: 'tch-' + Date.now(),
      name,
      email,
      role: 'docente',
      subject: 'Science and Math',
      avatar: { skin: '#ffd1a4', hair: 'short', hairColor: '#334155', clothes: 'blazer', clothesColor: '#1e3a8a', expression: 'smile', accessory: 'glasses' }
    };
    teachers.push(teacher);
    state.save(STORAGE_KEYS.TEACHERS, teachers);
  }

  state.setCurrentUser(teacher);
  state.activeGrade = '5';
  state.currentSection = 'calificaciones';
  showToast(`Welcome teacher ${teacher.name}! Managing the SmartClass platform.`, 'success');
  renderApp();
}

function quickLoginDemo(type) {
  if (type === 'student1') {
    const s1 = state.getStudents().find(s => s.email === 'isabella.d@estudiante.edu') || DEFAULT_STUDENTS[8];
    state.setCurrentUser(s1);
    state.currentSection = 'menu';
  } else if (type === 'student5') {
    const s5 = state.getStudents().find(s => s.email === 'camila.morales@estudiante.edu') || DEFAULT_STUDENTS[2];
    state.setCurrentUser(s5);
    state.currentSection = 'menu';
  } else if (type === 'student11') {
    const s11 = state.getStudents().find(s => s.email === 'daniel.ortiz@estudiante.edu') || DEFAULT_STUDENTS[5];
    state.setCurrentUser(s11);
    state.currentSection = 'menu';
  } else if (type === 'teacher') {
    const t = state.load(STORAGE_KEYS.TEACHERS)?.[0] || DEFAULT_TEACHER;
    state.setCurrentUser(t);
    state.activeGrade = '5';
    state.currentSection = 'calificaciones';
  }
  showToast(`Signed in successfully`, 'success');
  renderApp();
}

function logoutUser() {
  state.setCurrentUser(null);
  showPortalGateway();
  showToast('You have logged out of SmartClass.', 'success');
  renderApp();
}

function handleLogoClick() {
  if (state.currentUser) {
    if (state.currentUser.role === 'estudiante') state.currentSection = 'menu';
    renderApp();
  } else {
    showPortalGateway();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// =============================================================================
// 6. RENDERIZADO PRINCIPAL Y NAVEGACIÓN MODULAR POR PESTAÑAS
// =============================================================================

function renderApp() {
  const loginView = document.getElementById('loginScreenView');
  const dashboardView = document.getElementById('appDashboardView');
  const navUserPanel = document.getElementById('navUserPanel');
  const gradeStrip = document.getElementById('gradeStripContainer');
  const navBadge = document.getElementById('navBrandBadge');

  if (!state.currentUser) {
    if (loginView) loginView.style.display = 'block';
    if (dashboardView) dashboardView.style.display = 'none';
    if (navUserPanel) navUserPanel.style.display = 'none';
    if (navBadge) navBadge.textContent = 'SmartClass Access ';
    showPortalGateway();
    return;
  }

  if (loginView) loginView.style.display = 'none';
  if (dashboardView) dashboardView.style.display = 'block';
  if (navUserPanel) navUserPanel.style.display = 'flex';

  const user = state.currentUser;
  const isTeacher = user.role === 'docente';

  const navUserName = document.getElementById('navUserName');
  const navUserRole = document.getElementById('navUserRole');
  const navMiniAvatar = document.getElementById('navMiniAvatar');

  if (navUserName) navUserName.textContent = user.name;
  if (navUserRole) {
    navUserRole.textContent = isTeacher ? '👨‍🏫 SmartClass Head Teacher' : `🎒 Grade ${user.grade} ${user.level || 'Explorer'}`;
  }
  if (navMiniAvatar) navMiniAvatar.innerHTML = generateAvatarSvg(user.avatar, 36);
  if (navBadge) navBadge.textContent = isTeacher ? 'Teacher Panel' : `Grade Classroom ${user.grade}`;

  // Barra de grados 1° a 11°: visible únicamente para el docente
  if (isTeacher) {
    if (gradeStrip) gradeStrip.style.display = 'block';
    renderGradeSelector();
  } else {
    if (gradeStrip) gradeStrip.style.display = 'none';
    state.activeGrade = String(user.grade);
  }

  // Renderizar pestañas de subnavegación modulares
  renderSubnavTabs(isTeacher);

  // Renderizar la sección modular activa
  renderActiveSection(isTeacher);
}

function renderGradeSelector() {
  const container = document.getElementById('gradePillsContainer');
  if (!container) return;

  const currentGrade = state.activeGrade;
  const allTasks = state.getTasks();
  const allStudents = state.getStudents();
  const allExams = state.getExams();

  let html = '';
  for (let g = 1; g <= 11; g++) {
    const gradeStr = String(g);
    const isActive = gradeStr === currentGrade;
    const taskCount = allTasks.filter(t => String(t.grade) === gradeStr).length;
    const examCount = allExams.filter(e => String(e.grade) === gradeStr).length;
    const studentCount = allStudents.filter(s => String(s.grade) === gradeStr).length;

    html += `
      <button class="grade-pill ${isActive ? 'active' : ''}" onclick="selectGradeTeacher('${gradeStr}')">
        <span>Grade ${gradeStr}</span>
        <span class="pill-counter">${studentCount} students • ${taskCount} hw • ${examCount} ex.</span>
      </button>
    `;
  }
  container.innerHTML = html;

  const titleBadge = document.getElementById('activeGradeTitleBadge');
  if (titleBadge) titleBadge.textContent = `Managing Grade ${state.activeGrade}`;
}

function selectGradeTeacher(g) {
  state.activeGrade = String(g);
  renderApp();
}

function renderSubnavTabs(isTeacher) {
  const container = document.getElementById('subnavTabsContainer');
  if (!container) return;

  const currentSec = state.currentSection;
  let html = '';

  if (isTeacher) {
    const tasksInGrade = state.getTasksByGrade(state.activeGrade);
    let pendingReviews = 0;
    tasksInGrade.forEach(t => {
      if (t.submissions) pendingReviews += t.submissions.filter(s => !s.reviewed).length;
    });

    const examsInGrade = state.getExamsByGrade(state.activeGrade);
    let pendingExamReviews = 0;
    examsInGrade.forEach(e => {
      if (e.submissions) pendingExamReviews += e.submissions.filter(s => !s.reviewed).length;
    });

    const totalPendingReviews = pendingReviews + pendingExamReviews;
    const studentsCount = state.getStudentsByGrade(state.activeGrade).length;

    html = `
      <button class="subnav-tab-btn ${currentSec === 'calificaciones' ? 'active' : ''}" onclick="switchSection('calificaciones')">
        <span>📥 Grading and Review</span>
        ${totalPendingReviews > 0 ? `<span class="tab-badge-counter" style="background:#ef4444; color:#fff;">${totalPendingReviews}</span>` : ''}
      </button>

      <button class="subnav-tab-btn ${currentSec === 'actividades' ? 'active' : ''}" onclick="switchSection('actividades')">
        <span>💡 Interactive Activities</span>
        ${pendingExamReviews > 0 ? `<span class="tab-badge-counter" style="background:#f59e0b; color:#000;">${pendingExamReviews} exam.</span>` : ''}
      </button>

      <button class="subnav-tab-btn ${currentSec === 'examenes' ? 'active' : ''}" onclick="switchSection('examenes')">
        <span>📋 Create Own Exams</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'competencias' ? 'active' : ''}" onclick="switchSection('competencias')">
        <span>🏆 Class Competitions</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'tareas' ? 'active' : ''}" onclick="switchSection('tareas')">
        <span>📝 Assigned Homework</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'estudiantes' ? 'active' : ''}" onclick="switchSection('estudiantes')">
        <span>👥 Student List (${studentsCount})</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'avatar' ? 'active' : ''}" onclick="switchSection('avatar')">
        <span>🎨 My Teacher Avatar</span>
      </button>
    `;
  } else {
    // Estudiante
    const grade = state.currentUser.grade;
    const tasksForMe = state.getTasksByGrade(grade);
    const pendingTasks = tasksForMe.filter(t => !t.submissions || !t.submissions.some(s => s.studentEmail === state.currentUser.email)).length;

    const myDuels = state.getDuelsByGrade(grade).filter(d => d.opponentEmail === state.currentUser.email && d.status === 'pending').length;

    const examsForMe = state.getExamsByGrade(grade);
    const pendingExams = examsForMe.filter(e => !e.submissions || !e.submissions.some(s => s.studentEmail === state.currentUser.email)).length;

    html = `
      <button class="subnav-tab-btn ${currentSec === 'menu' ? 'active' : ''}" onclick="switchSection('menu')" style="border-left: 3px solid var(--yellow-accent);">
        <span>🏠 Main Menu (SmartClass)</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'examenes' ? 'active' : ''}" onclick="switchSection('examenes')">
        <span>📋 My Exams</span>
        ${pendingExams > 0 ? `<span class="tab-badge-counter" style="background:#ef4444; color:#fff;">${pendingExams}</span>` : ''}
      </button>

      <button class="subnav-tab-btn ${currentSec === 'tareas' ? 'active' : ''}" onclick="switchSection('tareas')">
        <span>📤 My Homework</span>
        ${pendingTasks > 0 ? `<span class="tab-badge-counter">${pendingTasks}</span>` : ''}
      </button>

      <button class="subnav-tab-btn ${currentSec === 'calificaciones' ? 'active' : ''}" onclick="switchSection('calificaciones')">
        <span>📊 My Grades</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'actividades' ? 'active' : ''}" onclick="switchSection('actividades')">
        <span>🎮 Activities and Practice</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'competir' ? 'active' : ''}" onclick="switchSection('competir')">
        <span>⚔️ Compete and Invite</span>
        ${myDuels > 0 ? `<span class="tab-badge-counter" style="background:#f59e0b; color:#000;">${myDuels} reto!</span>` : ''}
      </button>

      <button class="subnav-tab-btn ${currentSec === 'tutoria' ? 'active' : ''}" onclick="switchSection('tutoria')">
        <span>🤝 Tutoring and Groups</span>
      </button>

      <button class="subnav-tab-btn ${currentSec === 'avatar' ? 'active' : ''}" onclick="switchSection('avatar')">
        <span>🎨 My Avatar</span>
      </button>
    `;
  }

  container.innerHTML = html;
}

function switchSection(secName) {
  state.currentSection = secName;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderApp();
}

function renderActiveSection(isTeacher) {
  const mainView = document.getElementById('mainViewContainer');
  if (!mainView) return;

  if (isTeacher) {
    switch (state.currentSection) {
      case 'calificaciones': renderTeacherGradingSection(mainView); break;
      case 'actividades': renderTeacherActivitiesSection(mainView); break;
      case 'examenes': renderTeacherExamsSection(mainView); break;
      case 'competencias': renderTeacherCompetitionsSection(mainView); break;
      case 'tareas': renderTeacherTasksSection(mainView); break;
      case 'estudiantes': renderTeacherStudentsRosterSection(mainView); break;
      case 'avatar': renderTeacherAvatarSection(mainView); break;
      default: renderTeacherGradingSection(mainView);
    }
  } else {
    switch (state.currentSection) {
      case 'menu': renderStudentMainMenu(mainView); break;
      case 'examenes': renderStudentExamsSection(mainView); break;
      case 'tareas': renderStudentTasksSection(mainView); break;
      case 'calificaciones': renderStudentGradebookSection(mainView); break;
      case 'actividades': renderStudentInfinitePracticeSection(mainView); break;
      case 'competir': renderStudentDuelsSection(mainView); break;
      case 'tutoria': renderStudentTutoringSection(mainView); break;
      case 'avatar': renderStudentAvatarSection(mainView); break;
      default: renderStudentMainMenu(mainView);
    }
  }
}

// =============================================================================
// 7. SECCIONES DEL DOCENTE
// =============================================================================

// =============================================================================
// 7. SECCIONES DEL DOCENTE
// =============================================================================

let teacherGradingActiveTab = 'tareas'; // 'tareas' o 'examenes'

function setTeacherGradingTab(tab) {
  teacherGradingActiveTab = tab;
  renderApp();
}

// 7.1 SECCIÓN DOCENTE: CALIFICACIONES Y REVISIÓN (TAREAS Y EXÁMENES)
function renderTeacherGradingSection(container) {
  const grade = state.activeGrade;
  const tasksInGrade = state.getTasksByGrade(grade);
  const examsInGrade = state.getExamsByGrade(grade);

  // Recopilar entregas de tareas
  const allTaskSubmissions = [];
  tasksInGrade.forEach(task => {
    if (task.submissions && task.submissions.length > 0) {
      task.submissions.forEach((sub, subIdx) => {
        allTaskSubmissions.push({ ...sub, taskTitle: task.title, taskId: task.id, subIdx });
      });
    }
  });

  // Recopilar entregas de exámenes
  const allExamSubmissions = [];
  examsInGrade.forEach(exam => {
    if (exam.submissions && exam.submissions.length > 0) {
      exam.submissions.forEach((sub, subIdx) => {
        allExamSubmissions.push({ ...sub, examTitle: exam.title, examSubject: exam.subject, examId: exam.id, subIdx, questions: exam.questions || [] });
      });
    }
  });

  const pendingTasks = allTaskSubmissions.filter(s => !s.reviewed).length;
  const pendingExams = allExamSubmissions.filter(s => !s.reviewed).length;
  const totalPending = pendingTasks + pendingExams;

  container.innerHTML = `
    <div class="content-card" style="border: 2px solid var(--primary-blue);">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon" style="background:#e0f2fe; color:#0284c7;">📥</div>
          <div class="card-title-text">
            <h2>Grading and Assessment Inbox (Grade ${grade}</h2>
            <span>Review each student who submitted photo homework or solved exams and give them their official grade</span>
          </div>
        </div>
        <span class="brand-badge" style="background:${totalPending > 0 ? '#ef4444' : '#10b981'}; color:#fff; font-size:0.8rem;">
          ${totalPending > 0 ? `⚠️ ${totalPending} pending submissions` : '✅ All caught up'}
        </span>
      </div>

      <!-- Pestañas de Selección: Tareas con Foto vs Exámenes Oficiales -->
      <div style="display:flex; gap:0.75rem; margin-bottom:1.5rem; border-bottom:2px solid #e2e8f0; padding-bottom:0.75rem;">
        <button class="btn-secondary ${teacherGradingActiveTab === 'tareas' ? 'active' : ''}" onclick="setTeacherGradingTab('tareas')" style="font-weight:800; ${teacherGradingActiveTab === 'tareas' ? 'background:var(--navy); color:#fff; border-color:var(--navy);' : ''}">
          📸 Homework with Photos (${pendingTasks} pending)
        </button>
        <button class="btn-secondary ${teacherGradingActiveTab === 'examenes' ? 'active' : ''}" onclick="setTeacherGradingTab('examenes')" style="font-weight:800; ${teacherGradingActiveTab === 'examenes' ? 'background:var(--navy); color:#fff; border-color:var(--navy);' : ''}">
          📋 Student Exams (${pendingExams} pending)
        </button>
      </div>

      ${teacherGradingActiveTab === 'tareas' ? `
        <!-- LISTA DE TAREAS ENTREGADAS -->
        ${allTaskSubmissions.length === 0 ? `
          <div class="empty-state">
            <span class="empty-state-icon">📭</span>
            <h4>No homework has been submitted yet in Grade ${grade}</h4>
            <p>When the students of ${grade} complete their homework and upload their photos, they will appear here to be graded.</p>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            ${allTaskSubmissions.map((item, idx) => `
              <div class="grading-item-box ${item.reviewed ? 'reviewed-done' : 'pending-review'}">
                <div class="reviewing-header">
                  <div class="reviewing-student-info">
                    <div style="font-size:1.5rem;">👨‍🎓</div>
                    <div>
                      <div style="font-size:1.05rem; font-weight:800; color:var(--navy);">
                        Reviewing Student: <span style="color:var(--primary-blue);">${item.studentName}</span>
                      </div>
                      <div style="font-size:0.78rem; color:var(--text-muted);">
                        Email: ${item.studentEmail} • Due Date: ${item.date} • Homework: <strong>${item.taskTitle}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span class="reviewing-badge ${item.reviewed ? 'graded' : ''}">
                      ${item.reviewed ? `✅ Graded: Score ${item.gradeMark}` : '⏳ Pending Grading'}
                    </span>
                  </div>
                </div>

                <div class="reviewing-content-grid">
                  <div class="reviewing-photo-thumb" onclick="viewPhotoFullscreen('${item.photoUrl}')" title="Click to enlarge evidence photo">
                    <img src="${item.photoUrl}\" alt=\"Evidence of ${item.studentName}" />
                    <span class="photo-zoom-hint">🔍 Enlarge Photo</span>
                  </div>

                  <div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); padding:0.85rem; margin-bottom:0.85rem;">
                      <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.25rem;">
                        Student's Comments:
                      </div>
                      <p style="font-size:0.88rem; color:var(--text-main); font-style:italic;">"${item.comments || 'No comments.'}"</p>
                      ${item.fileUrl ? `<a class="btn-secondary btn-sm" style="margin-top:0.6rem; display:inline-block;" href="${item.fileUrl}" download="${item.fileName || 'entrega'}">📎 Download document: ${item.fileName || 'entrega'}</a>` : ''}
                    </div>

                    <div class="grading-controls-row">
                      <div class="grade-score-input-wrap">
                        <label for="gradeInput_${idx}">Score:</label>
                        <input type="text" id="gradeInput_${idx}" placeholder="E.g. 5.0" value="${item.gradeMark || ''}" />
                      </div>

                      <div class="grade-feedback-input">
                        <input type="text" id="feedbackInput_${idx}\" class=\"form-control\" placeholder=\"Teacher's message (e.g. Excellent drawing and clarity!)...\" value=\"${item.feedback || ''}" />
                      </div>

                      <button class="btn-primary btn-sm" onclick="submitTeacherGrade('${item.taskId}', '${item.studentEmail}', ${idx})">
                        ⭐ ${item.reviewed ? 'Update Score' : 'Save Score'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      ` : `
        <!-- LISTA DE EXÁMENES ENTREGADOS POR ESTUDIANTES -->
        ${allExamSubmissions.length === 0 ? `
          <div class="empty-state">
            <span class="empty-state-icon">📋</span>
            <h4>No exams have been submitted yet in Grade ${grade}</h4>
            <p>When students open and solve their official exams, they will appear here to be reviewed and graded.</p>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            ${allExamSubmissions.map((sub, idx) => {
              const totalQ = sub.questions.length;
              let correctCount = 0;
              sub.questions.forEach((q, qIndex) => {
                if (sub.answers && sub.answers[qIndex] === q.correct) correctCount++;
              });
              const suggestedGrade = totalQ > 0 ? ((correctCount / totalQ) * 5.0).toFixed(1) : '5.0';

              return `
                <div class="grading-item-box ${sub.reviewed ? 'reviewed-done' : 'pending-review'}" style="border-left: 5px solid ${sub.reviewed ? '#10b981' : '#f59e0b'};">
                  <div class="reviewing-header">
                    <div class="reviewing-student-info">
                      <div style="font-size:1.6rem;">📝</div>
                      <div>
                        <div style="font-size:1.1rem; font-weight:800; color:var(--navy);">
                          Exam of: <span style="color:var(--primary-blue);">${sub.studentName}</span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">
                          Assessment: <strong>${sub.examTitle}</strong> • Subject: <span class="task-subject-tag">${sub.examSubject}</span> • Submitted: ${sub.date} (${sub.time || 'Recent'})
                        </div>
                      </div>
                    </div>

                    <div style="text-align:right;">
                      <span class="reviewing-badge ${sub.reviewed ? 'graded' : ''}">
                        ${sub.reviewed ? `✅ Graded: Score ${sub.gradeMark}` : '⏳ Pending Grading'}
                      </span>
                      <div style="font-size:0.78rem; font-weight:700; color:var(--navy); margin-top:0.25rem;">
                        Correct Answers: ${correctCount} of ${totalQ} (${sub.scoreAuto || 0}%)
                      </div>
                    </div>
                  </div>

                  <!-- Desglose de Preguntas y Respuestas del Alumno -->
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); padding:1rem; margin-bottom:1rem;">
                    <div style="font-size:0.82rem; font-weight:800; color:var(--navy); text-transform:uppercase; margin-bottom:0.75rem;">
                      Breakdown of the Student's Answers:
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.65rem;">
                      ${sub.questions.map((q, qIndex) => {
                        const stdAns = sub.answers ? sub.answers[qIndex] : null;
                        const isCorrect = stdAns === q.correct;
                        return `
                          <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:var(--radius-sm); padding:0.65rem 0.85rem; font-size:0.85rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                              <strong>#${qIndex + 1}. ${q.text}</strong>
                              <span style="font-size:0.75rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:4px; ${isCorrect ? 'background:#dcfce7; color:#166534;' : 'background:#fee2e2; color:#991b1b;'}">
                                ${isCorrect ? '✅ Correct Answer' : '❌ Wrong Answer'}
                              </span>
                            </div>
                            <div style="font-size:0.8rem; color:#475569;">
                              Answer given: <strong style="${isCorrect ? 'color:#166534;' : 'color:#dc2626;'}">${stdAns !== null ? q.options[stdAns] : 'Not answered'}</strong>
                              ${!isCorrect ? ` • <span style="color:#166534;">Correct: <strong>${q.options[q.correct]}</strong></span>` : ''}
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>

                    ${sub.comments ? `
                      <div style="margin-top:0.75rem; padding-top:0.5rem; border-top:1px dashed #cbd5e1; font-size:0.82rem; color:#475569;">
                        <strong>Student's message:</strong> <em>"${sub.comments}"</em>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Controles de Calificación Oficial del Examen -->
                  <div class="grading-controls-row">
                    <div class="grade-score-input-wrap">
                      <label for="examGradeInput_${idx}">Official Score:</label>
                      <input type="text" id="examGradeInput_${idx}" placeholder="E.g. 5.0" value="${sub.gradeMark || suggestedGrade}" />
                    </div>

                    <div class="grade-feedback-input">
                      <input type="text" id="examFeedbackInput_${idx}\" class=\"form-control\" placeholder=\"Write congratulations or pedagogical recommendations for the student...\" value=\"${sub.feedback || ''}" />
                    </div>

                    <button class="btn-primary btn-sm" onclick="submitTeacherExamGrade('${sub.examId}', '${sub.studentEmail}', ${idx})">
                      ⭐ ${sub.reviewed ? 'Update Score' : 'Save Score'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `}
    </div>
  `;
}

function submitTeacherExamGrade(examId, studentEmail, idx) {
  const gradeInput = document.getElementById(`examGradeInput_${idx}`);
  const feedbackInput = document.getElementById(`examFeedbackInput_${idx}`);
  const gradeScore = gradeInput?.value.trim();
  const feedbackText = feedbackInput?.value.trim() || 'Exam reviewed and graded by the head teacher.';

  if (!gradeScore) {
    showToast('Please type the exam grade (e.g. 5.0, 4.5).', 'warning');
    return;
  }

  const exams = state.getExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return;

  const sub = exam.submissions?.find(s => s.studentEmail === studentEmail);
  if (sub) {
    sub.gradeMark = gradeScore;
    sub.feedback = feedbackText;
    sub.reviewed = true;
    state.saveExams(exams);


    showToast(`⭐ Exam graded successfully! You assigned the score ${gradeScore} to ${sub.studentName}.`, 'success');
    renderApp();
  }
}

// Recompensa: solo se gana al sacar 5.0 en una tarea (una única vez por entrega)
function awardPerfectTask(task, sub, studentEmail, gradeScore, tasks) {
  const num = parseFloat(String(gradeScore).replace(',', '.'));
  if (isNaN(num) || num < 5 || sub.rewarded) return '';
  sub.rewarded = true;
  state.saveTasks(tasks);
  const pts = Number(task.points) || 40, stars = 3;
  const students = state.getStudents();
  const std = students.find(s => s.email === studentEmail);
  if (!std) return '';
  std.points = (std.points || 0) + pts;
  std.stars = (std.stars || 0) + stars;
  std.level = std.points >= 300 ? 'Subject Expert' : std.points >= 100 ? 'Explorer' : 'Apprentice';
  state.saveStudents(students);
  return ` • 5.0! The student earned +${pts} pts and +${stars} ⭐`;
}

function submitTeacherGrade(taskId, studentEmail, idx) {
  const gradeInput = document.getElementById(`gradeInput_${idx}`);
  const feedbackInput = document.getElementById(`feedbackInput_${idx}`);
  const gradeScore = gradeInput?.value.trim();
  const feedbackText = feedbackInput?.value.trim() || 'Homework reviewed by the teacher.';

  if (!gradeScore) {
    showToast('Please type the grade obtained (e.g. 5.0, 4.5).', 'warning');
    return;
  }

  const tasks = state.getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const sub = task.submissions?.find(s => s.studentEmail === studentEmail);
  if (sub) {
    sub.gradeMark = gradeScore;
    sub.feedback = feedbackText;
    sub.reviewed = true;
    state.saveTasks(tasks);

    const rewardMsg = awardPerfectTask(task, sub, studentEmail, gradeScore, tasks);

    showToast(`Score saved! You graded ${sub.studentName} with: ${gradeScore}${rewardMsg}`, 'success');
    renderApp();
  }
}

// 7.2 SECCIÓN DOCENTE: ACTIVIDADES INTERACTIVAS POR TEMA Y CALIFICACIÓN DE EXÁMENES
function renderTeacherActivitiesSection(container) {
  const grade = state.activeGrade;
  const currentActivities = state.getActivitiesByGrade(grade);

  // Recopilar exámenes entregados en este grado para calificar directamente aquí (requisito explícito del usuario)
  const examsInGrade = state.getExamsByGrade(grade);
  const examSubmissions = [];
  examsInGrade.forEach(exam => {
    if (exam.submissions && exam.submissions.length > 0) {
      exam.submissions.forEach((sub, sIdx) => {
        examSubmissions.push({ ...sub, examTitle: exam.title, examSubject: exam.subject, examId: exam.id, sIdx, questions: exam.questions || [] });
      });
    }
  });

  const pendingExams = examSubmissions.filter(s => !s.reviewed);

  container.innerHTML = `
    <!-- BLOQUE 1: CALIFICACIÓN RÁPIDA DE EXÁMENES ENTREGADOS POR ESTUDIANTES (TAL COMO PIDIÓ EL USUARIO) -->
    <div class="content-card" style="border: 2px solid #f59e0b; margin-bottom: 2rem;">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon" style="background:#fef3c7; color:#b45309;">📋</div>
          <div class="card-title-text">
            <h2>Grading of Exams Submitted by Students (Grade ${grade}</h2>
            <span>Here you can review and grade the exams your students have solved and sent</span>
          </div>
        </div>
        <span class="brand-badge" style="background:${pendingExams.length > 0 ? '#ef4444' : '#10b981'}; color:#fff; font-size:0.8rem;">
          ${pendingExams.length > 0 ? `⚠️ ${pendingExams.length} exams to grade` : '✅ No pending exams'}
        </span>
      </div>

      ${examSubmissions.length === 0 ? `
        <div class="empty-state" style="padding:1.5rem;">
          <p>No exams have been submitted yet by the students of Grade ${grade}. When students open and submit their assessments, they will appear here to be graded.</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:1.15rem;">
          ${examSubmissions.map((sub, idx) => {
            const totalQ = sub.questions.length;
            let correctCount = 0;
            sub.questions.forEach((q, qIndex) => {
              if (sub.answers && sub.answers[qIndex] === q.correct) correctCount++;
            });
            const suggestedGrade = totalQ > 0 ? ((correctCount / totalQ) * 5.0).toFixed(1) : '5.0';

            return `
              <div style="background:#ffffff; border:1.5px solid ${sub.reviewed ? '#86efac' : '#fde047'}; border-radius:var(--radius-md); padding:1.15rem; box-shadow:var(--shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
                  <div>
                    <span class="task-subject-tag">${sub.examSubject}</span>
                    <span class="task-grade-tag">Grade ${grade}</span>
                    <h3 style="font-size:1.1rem; font-weight:800; color:var(--navy); margin-top:0.35rem;">
                      ${sub.examTitle}
                    </h3>
                    <div style="font-size:0.82rem; color:var(--text-muted);">
                      Student: <strong>${sub.studentName}</strong> (${sub.studentEmail}) • Submitted: ${sub.date}
                    </div>
                  </div>
                  <div>
                    <span class="reviewing-badge ${sub.reviewed ? 'graded' : ''}">
                      ${sub.reviewed ? `✅ Graded: Score ${sub.gradeMark}` : '⏳ Pending Grading'}
                    </span>
                  </div>
                </div>

                <div style="background:#f8fafc; padding:0.75rem 1rem; border-radius:var(--radius-sm); margin-bottom:0.85rem; font-size:0.82rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                  <span><strong>Correct answers:</strong> ${correctCount} of ${totalQ} (${sub.scoreAuto || 0}%)</span>
                  <button type="button" class="btn-secondary btn-sm" onclick="openTeacherGradeExamModal('${sub.examId}', '${sub.studentEmail}')">
                    🔍 View Full Question Breakdown
                  </button>
                </div>

                <!-- Input para asignar nota directo en la sección de actividades -->
                <div class="grading-controls-row">
                  <div class="grade-score-input-wrap">
                    <label for="actExamGrade_${idx}">Official Score:</label>
                    <input type="text" id="actExamGrade_${idx}" placeholder="5.0" value="${sub.gradeMark || suggestedGrade}" />
                  </div>

                  <div class="grade-feedback-input">
                    <input type="text" id="actExamFeedback_${idx}\" class=\"form-control\" placeholder=\"Pedagogical feedback message for the student...\" value=\"${sub.feedback || ''}" />
                  </div>

                  <button class="btn-primary btn-sm" onclick="submitTeacherExamGradeFromActivities('${sub.examId}', '${sub.studentEmail}', ${idx})">
                    ⭐ ${sub.reviewed ? 'Update Score' : 'Grade Exam'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>

    <!-- BLOQUE 2: GENERADOR DE ACTIVIDADES INTERACTIVAS POR TEMA -->
    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">💡</div>
          <div class="card-title-text">
            <h2>Interactive Activity Generator by Topic (Grade ${grade}</h2>
            <span>Type the topic you are going to teach and the system will generate several interactive options for your class</span>
          </div>
        </div>
      </div>

      <div class="topic-generator-container">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:0.85rem;" class="topic-grid-responsive">
          <div>
            <label style="font-weight:800; font-size:0.9rem; color:var(--navy); display:block; margin-bottom:0.35rem;">
              Official Subject for Grade ${grade}
            </label>
            <select id="teacherSubjectActivitySelect" class="form-control" onchange="document.getElementById('teacherTopicInput').value = this.value" style="font-weight:700; color:var(--navy);">
              ${getSubjectsForGrade(grade).map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-weight:800; font-size:0.9rem; color:var(--navy); display:block; margin-bottom:0.35rem;">
              Topic or Subtopic to Teach:
            </label>
            <input type="text" id="teacherTopicInput" class="form-control" placeholder="Type a topic..." value="${getSubjectsForGrade(grade)[0]}" style="font-weight:700;" />
          </div>
        </div>
        <button class="btn-primary" onclick="generateInteractiveActivitiesForTopic()" style="width:100%; justify-content:center; padding:0.75rem;">
          ⚡ Generate Interactive Activity Options for this Subject
        </button>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">
          The options adapt to the current subjects for Grade ${grade}
        </div>
      </div>

      <div id="generatedActivitiesContainer">
        <!-- Renderizado al hacer clic en generar o previsualización -->
        <h3 style="font-size:1.05rem; font-weight:800; color:var(--navy); margin-bottom:1rem;">Active Interactive Activities in Grade ${grade}</h3>
        ${currentActivities.length === 0 ? `
          <div class="empty-state" style="padding:1.5rem;">
            <p>You have not activated any interactive activities for this class yet. Type a topic above and click generate.</p>
          </div>
        ` : `
          <div class="activities-options-grid">
            ${currentActivities.map(act => `
              <div class="activity-option-card">
                <div>
                  <span class="activity-type-badge" style="background:#e0f2fe; color:#0284c7;">
                    ${act.type === 'trivia' ? '🎯 Quick Trivia' : '🧩 Concept Matching'}
                  </span>
                  <h4 style="font-size:1.05rem; font-weight:800; color:var(--navy); margin-bottom:0.4rem;">${act.title}</h4>
                  <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">${act.desc}</p>
                  <div style="font-size:0.75rem; color:var(--primary-blue); font-weight:700;">Topic: ${act.topic}</div>
                </div>
                <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; color:var(--yellow-accent);">⭐ +${act.points} pts</span>
                  <span class="submission-status-badge submitted">Active in Grade ${grade}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function submitTeacherExamGradeFromActivities(examId, studentEmail, idx) {
  const gradeInput = document.getElementById(`actExamGrade_${idx}`);
  const feedbackInput = document.getElementById(`actExamFeedback_${idx}`);
  const gradeScore = gradeInput?.value.trim();
  const feedbackText = feedbackInput?.value.trim() || 'Exam graded in the activities section.';

  if (!gradeScore) {
    showToast('Please type the exam grade (e.g. 5.0, 4.5).', 'warning');
    return;
  }

  const exams = state.getExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return;

  const sub = exam.submissions?.find(s => s.studentEmail === studentEmail);
  if (sub) {
    sub.gradeMark = gradeScore;
    sub.feedback = feedbackText;
    sub.reviewed = true;
    state.saveExams(exams);


    showToast(`⭐ Exam graded successfully in Activities! Score ${gradeScore} assigned to ${sub.studentName}.`, 'success');
    renderApp();
  }
}

function generateInteractiveActivitiesForTopic() {
  const topicInput = document.getElementById('teacherTopicInput');
  const topic = topicInput?.value.trim() || 'The Solar System';
  const grade = state.activeGrade;

  const generated = [
    {
      id: 'act-' + Date.now() + '-1',
      topic,
      grade,
      type: 'trivia',
      title: `🎯 Quick Trivia: ${topic}`,
      desc: `Timed challenge with 4-option questions about ${topic}.`,
      points: 30
    },
    {
      id: 'act-' + Date.now() + '-2',
      topic,
      grade,
      type: 'memory',
      title: `🧩 Concept Matching Game: ${topic}`,
      desc: `Students flip cards and match terms with their definitions about ${topic}.`,
      points: 25
    },
    {
      id: 'act-' + Date.now() + '-3',
      topic,
      grade,
      type: 'ruleta',
      title: `🎡 Knowledge Wheel: ${topic}`,
      desc: `Spin the wheel and answer random challenges to earn stars in the classroom.`,
      points: 35
    },
    {
      id: 'act-' + Date.now() + '-4',
      topic,
      grade,
      type: 'duelo',
      title: `⚔️ Team Duel about ${topic}`,
      desc: `Cooperative competition where groups of students compete for the best score.`,
      points: 50
    }
  ];

  const container = document.getElementById('generatedActivitiesContainer');
  if (container) {
    container.innerHTML = `
      <div style="background:#fff; border:2px dashed var(--primary-blue); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">
        <h3 style="font-size:1.15rem; font-weight:800; color:var(--navy); margin-bottom:0.25rem;">
          ✨ Activity Options Generated for: \"${topic}"
        </h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
          Select which one you want to activate and publish for the students of Grade ${grade}
        </p>

        <div class="activities-options-grid">
          ${generated.map((act, idx) => `
            <div class="activity-option-card">
              <div>
                <span class="activity-type-badge" style="background:var(--yellow-light); color:#b45309;">
                  Option #${idx + 1}
                </span>
                <h4 style="font-size:1.05rem; font-weight:800; color:var(--navy); margin-bottom:0.4rem;">${act.title}</h4>
                <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">${act.desc}</p>
                <div style="font-size:0.78rem; font-weight:700; color:var(--yellow-accent);">Reward: ⭐ +${act.points} pts</div>
              </div>
              <button class="btn-primary" style="margin-top:1rem; width:100%; justify-content:center;" onclick="activateActivityForGrade('${encodeURIComponent(JSON.stringify(act))}')">
                🚀 Activate and Publish in Grade ${grade}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

function activateActivityForGrade(encodedAct) {
  const act = JSON.parse(decodeURIComponent(encodedAct));
  const activities = state.getActivities();
  activities.unshift(act);
  state.saveActivities(activities);
  showToast(`Activity \"${act.title}\" activated for Grade ${state.activeGrade}`, 'success');
  renderApp();
}

// 7.3 SECCIÓN DOCENTE: CREADOR DE EXÁMENES PROPIOS
function renderTeacherExamsSection(container) {
  const grade = state.activeGrade;
  const exams = state.getExamsByGrade(grade);

  container.innerHTML = `
    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">📋</div>
          <div class="card-title-text">
            <h2>Own Exam Creator (Grade ${grade}</h2>
            <span>Design custom assessments with your own questions, options and scores</span>
          </div>
        </div>
        <button class="btn-primary" onclick="openCreateExamModal()">
          ➕ Create New Exam
        </button>
      </div>

      ${exams.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon">📝</span>
          <h4>No exams have been created yet for Grade ${grade}</h4>
          <p>Click \"Create New Exam\" to design a test with multiple-choice questions.</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          ${exams.map(ex => `
            <div style="border:1.5px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem; background:#fff;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                <div>
                  <span class="task-subject-tag">${ex.subject}</span>
                  <span class="task-grade-tag">Grade ${ex.grade}</span>
                  <h3 style="font-size:1.15rem; font-weight:800; color:var(--navy); margin-top:0.35rem;">${ex.title}</h3>
                </div>
                <span class="submission-status-badge submitted">Published</span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">${ex.instructions}</p>
              <div style="background:#f8fafc; padding:0.75rem 1rem; border-radius:var(--radius-sm); font-size:0.82rem; margin-bottom:0.75rem;">
                <strong>${ex.questions ? ex.questions.length : 0} Configured questions</strong> • Total points: 50 pts
              </div>
              <div style="display:flex; justify-content:flex-end;">
                <button class="btn-secondary btn-sm" onclick="showToast('The exam is active and visible to the students of this grade.', 'success')">
                  View Answer Status
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// 7.4 SECCIÓN DOCENTE: COMPETENCIAS DEL CURSO
function renderTeacherCompetitionsSection(container) {
  const grade = state.activeGrade;
  const students = state.getStudentsByGrade(grade);
  const duels = state.getDuelsByGrade(grade);

  container.innerHTML = `
    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon" style="background:#ede9fe; color:#8b5cf6;">🏆</div>
          <div class="card-title-text">
            <h2>Class Competitions and Tournaments (Grade ${grade}</h2>
            <span>Make the whole class compete or pair up the students you choose in a duel</span>
          </div>
        </div>
      </div>

      <!-- Banner de Duelo Escogido por el Docente -->
      <div class="duel-arena-banner">
        <div>
          <span style="font-size:0.8rem; font-weight:800; text-transform:uppercase; color:var(--yellow-glow);">School Competition Arena</span>
          <h3 style="font-size:1.4rem; font-weight:900; margin:0.25rem 0;">Make Selected Students Compete</h3>
          <p style="font-size:0.88rem; opacity:0.9;">Select two students from Grade ${grade} to start a live challenge.</p>
        </div>

        <div style="background:rgba(255,255,255,0.12); padding:1rem; border-radius:var(--radius-md); display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
          <select id="teacherDuelP1" class="form-control" style="width:160px; font-weight:700;">
            ${students.map(s => `<option value="${s.name}">${s.name.split(' ')[0]}</option>`).join('')}
          </select>

          <span style="font-weight:900; color:var(--yellow-glow); font-size:1.1rem;">VS</span>

          <select id="teacherDuelP2" class="form-control" style="width:160px; font-weight:700;">
            ${students.map((s, i) => `<option value="${s.name}" ${i === 1 ? 'selected' : ''}>${s.name.split(' ')[0]}</option>`).join('')}
          </select>

          <button class="btn-yellow" onclick="launchTeacherMatch()">
            ⚔️ Launch Live Duel
          </button>
        </div>
      </div>

      <!-- Tabla de Posiciones / Ranking del Curso -->
      <div style="margin-top:1.5rem;">
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--navy); margin-bottom:1rem;">
          🥇 Leaderboard and Competition Points (Grade ${grade}
        </h3>
        <table class="gradebook-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Accumulated Points</th>
              <th>Stars</th>
              <th>Rank</th>
              <th>Teacher Reward</th>
            </tr>
          </thead>
          <tbody>
            ${[...students].sort((a,b) => (b.points || 0) - (a.points || 0)).map((s, idx) => `
              <tr>
                <td>
                  <strong style="font-size:1.1rem; color:${idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--navy)'};">
                    ${idx === 0 ? '🥇 1°' : idx === 1 ? '🥈 2°' : idx === 2 ? '🥉 3°' : `${idx + 1}`}
                  </strong>
                </td>
                <td>
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    <div class="student-avatar-sm" style="width:32px; height:32px;">
                      ${generateAvatarSvg(s.avatar, 32)}
                    </div>
                    <strong>${s.name}</strong>
                  </div>
                </td>
                <td><strong style="color:var(--primary-blue); font-size:1rem;">${s.points || 0} pts</strong></td>
                <td><span style="color:var(--yellow-accent); font-weight:800;">⭐ ${s.stars || 0}</span></td>
                <td><span class="level-badge ${s.level === 'Subject Expert' ? 'expert' : 'explorer'}">${s.level || 'Apprentice'}</span></td>
                <td>
                  <button class="btn-secondary btn-sm" onclick="awardBonusStars('${s.email}')">
                    ⭐ Award +5 Stars
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function launchTeacherMatch() {
  const p1 = document.getElementById('teacherDuelP1')?.value;
  const p2 = document.getElementById('teacherDuelP2')?.value;
  if (!p1 || !p2 || p1 === p2) {
    showToast('Select two different students for the duel.', 'warning');
    return;
  }
  showToast(`Duel launched! ${p1} VS ${p2}. The challenge has been sent to their screens.`, 'success');
}

function awardBonusStars(studentEmail) {
  const students = state.getStudents();
  const std = students.find(s => s.email === studentEmail);
  if (std) {
    std.stars = (std.stars || 0) + 5;
    std.points = (std.points || 0) + 25;
    std.level = std.points >= 300 ? 'Subject Expert' : std.points >= 100 ? 'Explorer' : 'Apprentice';
    state.saveStudents(students);
    showToast(`Awarded +5 stars to ${std.name}!`, 'success');
    renderApp();
  }
}

// 7.5 SECCIÓN DOCENTE: TAREAS ASIGNADAS
function renderTeacherTasksSection(container) {
  const grade = state.activeGrade;
  const tasksInGrade = state.getTasksByGrade(grade);

  container.innerHTML = `
    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">📚</div>
          <div class="card-title-text">
            <h2>Homework Assigned for Grade ${grade}</h2>
            <span>Only students enrolled in Grade ${grade} will see and receive this homework</span>
          </div>
        </div>
        <button class="btn-primary" onclick="openNewTaskModal()">
          ➕ Create New Homework
        </button>
      </div>

      ${tasksInGrade.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon">📋</span>
          <h4>No homework has been created for Grade ${grade}</h4>
          <p>Click \"Create New Homework\" to publish activities exclusive to this class.</p>
        </div>
      ` : `
        <div class="tasks-grid">
          ${tasksInGrade.map(task => renderTeacherTaskCard(task)).join('')}
        </div>
      `}
    </div>
  `;
}

function renderTeacherTaskCard(task) {
  const submissionCount = task.submissions ? task.submissions.length : 0;
  return `
    <div class="task-item-card">
      <div>
        <div class="task-header-row">
          <span class="task-subject-tag">📖 ${task.subject}</span>
          <span class="task-grade-tag">Grade ${task.grade}</span>
        </div>
        <h3 class="task-title">${task.title}</h3>
        <p class="task-desc">${task.description}</p>
      </div>

      <div>
        <div class="task-footer-info">
          <div class="task-due-date">📅 Due: ${task.dueDate}</div>
          <div style="font-weight:700; color:var(--yellow-accent);">⭐ +${task.points} pts</div>
        </div>

        <div class="task-actions-row">
          <button class="btn-secondary btn-sm" style="flex:1;" onclick="openEditTaskGradeModal('${task.id}')" title="Update or change the grade">
            🔄 Change Grade (${task.grade}
          </button>
          <button class="btn-primary btn-sm" onclick="switchSection('calificaciones')">
            📥 Review (${submissionCount})
          </button>
        </div>
      </div>
    </div>
  `;
}

// 7.6 SECCIÓN DOCENTE: LISTA COMPLETA DE ESTUDIANTES DEL GRADO
function renderTeacherStudentsRosterSection(container) {
  const grade = state.activeGrade;
  const studentsInGrade = state.getStudentsByGrade(grade);
  const currentTutor = state.getTutorForGrade(grade);

  container.innerHTML = `
    <!-- Banner de Tutor del Grado -->
    <div class="grade-tutor-banner">
      <div class="grade-tutor-left">
        <div class="tutor-icon-big">🎓</div>
        <div class="grade-tutor-info">
          <h3>Designated Tutor for Grade ${grade} ${currentTutor ? currentTutor.name : 'None assigned yet'}</h3>
          <p>${currentTutor 
              ? `The tutor supports classmates in ${grade} with questions and study sessions. Email: ${currentTutor.email}` 
              : `You can select one of the students in the list below to assign them as the official Grade Tutor.`}</p>
        </div>
      </div>
      <div>
        <button class="btn-yellow" onclick="openAssignTutorModal()">
          ⭐ ${currentTutor ? 'Change Grade Tutor' : 'Assign Grade Tutor'}
        </button>
      </div>
    </div>

    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">👥</div>
          <div class="card-title-text">
            <h2>Official Student List - Grade ${grade}</h2>
            <span>${studentsInGrade.length} registered students who receive the homework and activities of this grade</span>
          </div>
        </div>
        <button class="btn-primary" onclick="openAddStudentModal()">
          ➕ Enroll Student in ${grade}
        </button>
      </div>

      ${studentsInGrade.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon">🎒</span>
          <h4>There are no students in Grade ${grade} yet</h4>
          <p>You can enroll students in this grade so they receive the corresponding homework.</p>
        </div>
      ` : `
        <div style="overflow-x:auto;">
          <table class="student-roster-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Level</th>
                <th>Points and Stars</th>
                <th>Role</th>
                <th>Tutor Action</th>
              </tr>
            </thead>
            <tbody>
              ${studentsInGrade.map(std => `
                <tr>
                  <td>
                    <div class="student-cell-info">
                      <div class="student-avatar-sm">
                        ${generateAvatarSvg(std.avatar, 38)}
                      </div>
                      <div>
                        <strong>${std.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td style="color:var(--text-muted); font-size:0.82rem;">${std.email}</td>
                  <td>
                    <span class="level-badge ${std.level === 'Subject Expert' ? 'expert' : std.level === 'Explorer' ? 'explorer' : 'apprentice'}">
                      ${std.level || 'Apprentice'}
                    </span>
                  </td>
                  <td>
                    <strong style="color:var(--primary-blue);">${std.points || 0} pts</strong> • 
                    <span style="color:var(--yellow-accent);">⭐ ${std.stars || 0}</span>
                  </td>
                  <td>
                    ${std.isTutor ? '<span class="tutor-badge-tag">⭐ Grade Tutor</span>' : '<span style="color:var(--text-muted); font-size:0.8rem;">Student</span>'}
                  </td>
                  <td>
                    <button class="btn-secondary btn-sm" onclick="setTutorDirect('${std.email}')">
                      ${std.isTutor ? 'Keep Tutor' : 'Make Tutor'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

// 7.7 SECCIÓN DOCENTE: AVATAR DEL PROFESOR
function renderTeacherAvatarSection(container) {
  container.innerHTML = `
    <div class="content-card" style="max-width:700px; margin:0 auto;">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">🎨</div>
          <div class="card-title-text">
            <h2>My Teacher Avatar</h2>
            <span>Design and customize your teacher character</span>
          </div>
        </div>
      </div>

      <div class="avatar-customizer-box">
        <div class="avatar-stage" id="teacherAvatarStage">
          ${generateAvatarSvg(state.currentUser.avatar, 130)}
        </div>

        <div class="avatar-options-grid">
          <div class="avatar-field">
            <label>Skin</label>
            <select id="avSkin" onchange="previewUserAvatar()">
              <option value="#ffd1a4" ${state.currentUser.avatar?.skin === '#ffd1a4' ? 'selected' : ''}>Light</option>
              <option value="#fcd34d" ${state.currentUser.avatar?.skin === '#fcd34d' ? 'selected' : ''}>Warm</option>
              <option value="#e2a76f" ${state.currentUser.avatar?.skin === '#e2a76f' ? 'selected' : ''}>Tan</option>
            </select>
          </div>

          <div class="avatar-field">
            <label>Hairstyle</label>
            <select id="avHair" onchange="previewUserAvatar()">
              <option value="short" ${state.currentUser.avatar?.hair === 'short' ? 'selected' : ''}>Formal Short</option>
              <option value="curly" ${state.currentUser.avatar?.hair === 'curly' ? 'selected' : ''}>Curly</option>
              <option value="ponytail" ${state.currentUser.avatar?.hair === 'ponytail' ? 'selected' : ''}>Updo</option>
            </select>
          </div>

          <div class="avatar-field">
            <label>Hair Color</label>
            <select id="avHairColor" onchange="previewUserAvatar()">
              <option value="#334155" ${state.currentUser.avatar?.hairColor === '#334155' ? 'selected' : ''}>Chestnut</option>
              <option value="#1e293b" ${state.currentUser.avatar?.hairColor === '#1e293b' ? 'selected' : ''}>Black</option>
              <option value="#78350f" ${state.currentUser.avatar?.hairColor === '#78350f' ? 'selected' : ''}>Light Brown</option>
            </select>
          </div>

          <div class="avatar-field">
            <label>Outfit</label>
            <select id="avClothes" onchange="previewUserAvatar()">
              <option value="blazer" ${state.currentUser.avatar?.clothes === 'blazer' ? 'selected' : ''}>Teacher Blazer</option>
              <option value="polo" ${state.currentUser.avatar?.clothes === 'polo' ? 'selected' : ''}>Teacher Polo</option>
              <option value="hoodie" ${state.currentUser.avatar?.clothes === 'hoodie' ? 'selected' : ''}>Casual Hoodie</option>
            </select>
          </div>

          <div class="avatar-field" style="grid-column: span 2;">
            <label>Accessory</label>
            <select id="avAccessory" onchange="previewUserAvatar()">
              <option value="glasses" ${state.currentUser.avatar?.accessory === 'glasses' ? 'selected' : ''}>Reading Glasses</option>
              <option value="gradcap" ${state.currentUser.avatar?.accessory === 'gradcap' ? 'selected' : ''}>Graduation Cap</option>
              <option value="star" ${state.currentUser.avatar?.accessory === 'star' ? 'selected' : ''}>Golden Badge</option>
              <option value="none" ${state.currentUser.avatar?.accessory === 'none' ? 'selected' : ''}>None</option>
            </select>
          </div>
        </div>

        <button class="btn-primary" style="width:100%;" onclick="saveUserAvatar()">
          💾 Save My Teacher Avatar
        </button>
      </div>
    </div>
  `;
}

// =============================================================================
// 8. SECCIONES DEL ESTUDIANTE
// =============================================================================

// =============================================================================
// 8. SECCIONES DEL ESTUDIANTE (PORTAL INTERACTIVO SmartClass )
// =============================================================================

// 8.0 MENÚ PRINCIPAL INSTITUCIONAL (Imágenes 3 y 4 de referencia SmartClass )
function renderStudentMainMenu(container) {
  const user = state.currentUser;
  const grade = user.grade || '5';

  const examsForMe = state.getExamsByGrade(grade);
  const pendingExams = examsForMe.filter(e => !e.submissions || !e.submissions.some(s => s.studentEmail === user.email)).length;

  const tasksForMe = state.getTasksByGrade(grade);
  const pendingTasks = tasksForMe.filter(t => !t.submissions || !t.submissions.some(s => s.studentEmail === user.email)).length;

  const duelsForMe = state.getDuelsByGrade(grade).filter(d => d.opponentEmail === user.email && d.status === 'pending').length;

  container.innerHTML = `
    <div class="student-menu-wrapper">
      <!-- Fila de Encabezado y Barra de Búsqueda -->
      <div class="student-menu-header-row">
        <div class="student-menu-title">
          <h2>Main menu</h2>
          <p>Select the service you need.</p>
        </div>

        <div class="menu-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="menuSearchInput" placeholder="Search for an option..." oninput="filterStudentMenuOptions()" />
        </div>
      </div>

      <!-- Alerta interactiva de exámenes pendientes -->
      ${pendingExams > 0 ? `
        <div style="background:#fffbeb; border:1.5px solid #fde047; border-radius:var(--radius-md); padding:1rem 1.25rem; margin-bottom:1.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="font-size:1.8rem;">📝</div>
            <div>
              <strong style="color:var(--navy); font-size:1rem;">You have ${pendingExams} official exam(s) pending to solve in Grade ${grade}</strong>
              <div style="font-size:0.8rem; color:var(--text-muted);">Open it, answer the questions and send it so your teacher can grade it.</div>
            </div>
          </div>
          <button class="btn-primary btn-sm" onclick="switchSection('examenes')">
            🚀 Go Solve Exams
          </button>
        </div>
      ` : ''}

      <!-- SECCIÓN 1: ACADÉMICO -->
      <div class="menu-category-section" data-category="academico">
        <div class="menu-category-title">
          <span>Academic</span>
        </div>
        <div class="menu-cards-grid">
          <!-- 1.1 Polígrafo (Consulta Tus Notas) -->
          <div class="service-card-item" onclick="switchSection('calificaciones')" data-title="transcript check your grades report card">
            <div class="service-card-left">
              <div class="service-icon-box">📊</div>
              <div class="service-card-texts">
                <h3>Transcript</h3>
                <p>Check Your Grades</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 1.2 Solicitudes De Certificados -->
          <div class="service-card-item" onclick="openModalCertificados()" data-title="certificate requests send your certification requests">
            <div class="service-card-left">
              <div class="service-icon-box">📜</div>
              <div class="service-card-texts">
                <h3>Certificate Requests</h3>
                <p>Send Your Certification Requests</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 1.3 Solicitud Exámenes Especiales / Mis Exámenes (DESTACADO CON EXÁMENES) -->
          <div class="service-card-item highlight-gold-card" onclick="switchSection('examenes')" data-title="request special exams assessments tests solve open exam">
            <div class="service-card-left">
              <div class="service-icon-box" style="background:#fef3c7; color:#b45309;">📝</div>
              <div class="service-card-texts">
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <h3>Special Exam Requests</h3>
                  ${pendingExams > 0 ? `<span class="menu-badge-pill pending">${pendingExams} Pending</span>` : '<span class="menu-badge-pill active">Active</span>'}
                </div>
                <p>Open, Solve and Send Your Assessments</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 1.4 Planes Curriculares -->
          <div class="service-card-item" onclick="openModalPlanesCurriculares()" data-title="curriculum plans see the curriculum plans of your courses subjects grade">
            <div class="service-card-left">
              <div class="service-icon-box">📖</div>
              <div class="service-card-texts">
                <h3>Curriculum Plans</h3>
                <p>See the Curriculum Plans of Your Courses</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 1.5 Registro De Calificaciones -->
          <div class="service-card-item" onclick="openModalRegistroCalificaciones()" data-title="grade records the student's grades in previous periods">
            <div class="service-card-left">
              <div class="service-icon-box">📋</div>
              <div class="service-card-texts">
                <h3>Grade Records</h3>
                <p>The Student's Grades in Previous Periods</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 1.6 Horario Exámenes -->
          <div class="service-card-item" onclick="openModalHorarioExamenes()" data-title="exam schedule students exam schedule dates">
            <div class="service-card-left">
              <div class="service-icon-box">⏰</div>
              <div class="service-card-texts">
                <h3>Exam Schedule</h3>
                <p>Students' Exam Schedule</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 1.7 Horario de Clases -->
          <div class="service-card-item" onclick="openModalHorarioClases()" data-title="schedule class schedules students weekly">
            <div class="service-card-left">
              <div class="service-icon-box">📅</div>
              <div class="service-card-texts">
                <h3>Schedule</h3>
                <p>Students' Class Schedules</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: ACTIVIDADES Y PRÁCTICA CONTINUA -->
      <div class="menu-category-section" data-category="actividades">
        <div class="menu-category-title">
          <span>Interactive Activities and Learning</span>
        </div>
        <div class="menu-cards-grid">
          <!-- 2.1 Tareas Asignadas -->
          <div class="service-card-item" onclick="switchSection('tareas')" data-title="assigned homework download guides upload notebook photos submissions">
            <div class="service-card-left">
              <div class="service-icon-box">📤</div>
              <div class="service-card-texts">
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <h3>Assigned Homework</h3>
                  ${pendingTasks > 0 ? `<span class="menu-badge-pill pending">${pendingTasks} Pending</span>` : ''}
                </div>
                <p>Download Guides and Upload Notebook Photos</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 2.2 Práctica Continua Interactiva -->
          <div class="service-card-item" onclick="switchSection('actividades')" data-title="continuous practice interactive trivia infinite questions repeat failing">
            <div class="service-card-left">
              <div class="service-icon-box">🎮</div>
              <div class="service-card-texts">
                <h3>Continuous Practice</h3>
                <p>Trivia and Infinite Questions When You Fail</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 2.3 Competencias y Duelos -->
          <div class="service-card-item" onclick="switchSection('competir')" data-title="competitions duels challenge grade classmates points stars">
            <div class="service-card-left">
              <div class="service-icon-box">⚔️</div>
              <div class="service-card-texts">
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <h3>Compete and Invite</h3>
                  ${duelsForMe > 0 ? `<span class="menu-badge-pill pending">${duelsForMe} Challenge</span>` : ''}
                </div>
                <p>Knowledge Duels Between Classmates</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 2.4 Sesiones de Tutoría -->
          <div class="service-card-item" onclick="switchSection('tutoria')" data-title="tutoring study groups official grade tutor classmates">
            <div class="service-card-left">
              <div class="service-icon-box">🤝</div>
              <div class="service-card-texts">
                <h3>Tutoring and Connect</h3>
                <p>Study Groups with the Grade Tutor</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 3: TRÁMITES Y SERVICIOS -->
      <div class="menu-category-section" data-category="tramites">
        <div class="menu-category-title">
          <span>Procedures and services</span>
        </div>
        <div class="menu-cards-grid">
          <!-- 3.1 Solicitudes Académicas -->
          <div class="service-card-item" onclick="openModalSolicitudesAcademicas()" data-title="academic requests enter your requests certificates validation">
            <div class="service-card-left">
              <div class="service-icon-box">📄</div>
              <div class="service-card-texts">
                <h3>Academic Requests</h3>
                <p>Enter Your Requests</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 3.2 Cartera Histórico -->
          <div class="service-card-item" onclick="openModalCartera()" data-title="billing history shows the billing history by period payments tuition">
            <div class="service-card-left">
              <div class="service-icon-box">🔄</div>
              <div class="service-card-texts">
                <h3>Billing History</h3>
                <p>Shows the Billing History by Period</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 3.3 Estado De Apelaciones -->
          <div class="service-card-item" onclick="openModalApelaciones()" data-title="appeals status check the status of your appeals review grades">
            <div class="service-card-left">
              <div class="service-icon-box">⚖️</div>
              <div class="service-card-texts">
                <h3>Appeals Status</h3>
                <p>Check the Status of Your Appeals</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 3.4 Pqr -->
          <div class="service-card-item" onclick="openModalPQR()" data-title="pqr requests complaints claims contact support">
            <div class="service-card-left">
              <div class="service-icon-box">💬</div>
              <div class="service-card-texts">
                <h3>Requests and Claims</h3>
                <p>Send Us Your Requests, Complaints or Claims</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 3.5 Cartera -->
          <div class="service-card-item" onclick="openModalCartera()" data-title="billing student billing status payments receipts">
            <div class="service-card-left">
              <div class="service-icon-box">💳</div>
              <div class="service-card-texts">
                <h3>Billing</h3>
                <p>Student Billing Status</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 3.6 Solicitud De Mantenimiento -->
          <div class="service-card-item" onclick="openModalMantenimiento()" data-title="maintenance request technical support classrooms">
            <div class="service-card-left">
              <div class="service-icon-box">🛠️</div>
              <div class="service-card-texts">
                <h3>Maintenance Request</h3>
                <p>Maintenance Request</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 4: CALIDAD Y EVALUACIÓN -->
      <div class="menu-category-section" data-category="calidad">
        <div class="menu-category-title">
          <span>Quality and evaluation</span>
        </div>
        <div class="menu-cards-grid">
          <!-- 4.1 Evaluación Calidad -->
          <div class="service-card-item" onclick="openModalEvaluacionDocente()" data-title="quality evaluation evaluate teaching and administrative staff teachers">
            <div class="service-card-left">
              <div class="service-icon-box">📝</div>
              <div class="service-card-texts">
                <h3>Quality Evaluation</h3>
                <p>Evaluate Teaching and Administrative Staff...</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 4.2 Encuesta Eon -->
          <div class="service-card-item" onclick="openModalEncuestaEon()" data-title="survey satisfaction wellbeing institutional">
            <div class="service-card-left">
              <div class="service-icon-box">📊</div>
              <div class="service-card-texts">
                <h3>Satisfaction Survey</h3>
                <p>Satisfaction Survey</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 5: RECURSOS -->
      <div class="menu-category-section" data-category="recursos">
        <div class="menu-category-title">
          <span>Resources</span>
        </div>
        <div class="menu-cards-grid">
          <!-- 5.1 Biblioteca -->
          <div class="service-card-item" onclick="openModalBiblioteca()" data-title="library request library books guides notes">
            <div class="service-card-left">
              <div class="service-icon-box">📚</div>
              <div class="service-card-texts">
                <h3>Shared Notes</h3>
                <p>Upload and download your classmates' notes</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 6: MI CUENTA -->
      <div class="menu-category-section" data-category="cuenta">
        <div class="menu-category-title">
          <span>My account</span>
        </div>
        <div class="menu-cards-grid">
          <!-- 6.1 Mi Avatar Virtual -->
          <div class="service-card-item" onclick="switchSection('avatar')" data-title="my virtual avatar customize character clothes hairstyle">
            <div class="service-card-left">
              <div class="service-icon-box">🎨</div>
              <div class="service-card-texts">
                <h3>My Student Avatar</h3>
                <p>Customize Your Style, Clothes and Accessories</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 6.2 Cambia Tu Contraseña -->
          <div class="service-card-item" onclick="openModalCambiarPassword()" data-title="change your password security key">
            <div class="service-card-left">
              <div class="service-icon-box">🔑</div>
              <div class="service-card-texts">
                <h3>Change Your Password</h3>
                <p>Change Your Password</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 6.3 Actualización De Datos -->
          <div class="service-card-item" onclick="openModalActualizarDatos()" data-title="basic data update profile email mobile address">
            <div class="service-card-left">
              <div class="service-icon-box">👤</div>
              <div class="service-card-texts">
                <h3>Data Update</h3>
                <p>Update Your Basic Data</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 7: OTRAS OPCIONES -->
      <div class="menu-category-section" data-category="otras">
        <div class="menu-category-title">
          <span>Other options</span>
        </div>
        <div class="menu-cards-grid">
          <!-- 7.1 Curriculum -->
          <div class="service-card-item" onclick="openModalCurriculum()" data-title="resume student academic profile curriculum vitae">
            <div class="service-card-left">
              <div class="service-icon-box">📁</div>
              <div class="service-card-texts">
                <h3>Resume</h3>
                <p>Student Resume</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 7.2 Etapa Práctica -->
          <div class="service-card-item" onclick="openModalEtapaPractica()" data-title="internship stage supports apprenticeship contract or internships">
            <div class="service-card-left">
              <div class="service-icon-box">💼</div>
              <div class="service-card-texts">
                <h3>Internship Stage</h3>
                <p>Apprenticeship Contract or Internship Supports</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>

          <!-- 7.3 Inscripción Mod -->
          <div class="service-card-item" onclick="openModalModalidadGrado()" data-title="graduation mode registration modality project thesis monograph diploma">
            <div class="service-card-left">
              <div class="service-icon-box">🎓</div>
              <div class="service-card-texts">
                <h3>Graduation Mode Registration</h3>
                <p>Graduation Modality Registration</p>
              </div>
            </div>
            <div class="service-chevron">›</div>
          </div>
        </div>
      </div>

      <!-- Mensaje cuando la búsqueda no coincide -->
      <div id="noMenuSearchResults" style="display:none; text-align:center; padding:3rem 1rem; color:var(--text-muted);">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔍</div>
        <h4 style="color:var(--navy); font-size:1.1rem; margin-bottom:0.25rem;">No services found</h4>
        <p>Try searching with another word such as \"grades\", \"exam\", \"schedule\", \"homework\" or \"teacher\".</p>
      </div>

    </div>
  `;
}

// Filtro en tiempo real del menú principal
function filterStudentMenuOptions() {
  const input = document.getElementById('menuSearchInput');
  const query = (input?.value || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.service-card-item');
  const sections = document.querySelectorAll('.menu-category-section');
  const noResults = document.getElementById('noMenuSearchResults');

  let matchTotal = 0;

  cards.forEach(card => {
    const textData = (card.getAttribute('data-title') || '') + ' ' + (card.innerText || '');
    if (!query || textData.toLowerCase().includes(query)) {
      card.style.display = 'flex';
      matchTotal++;
    } else {
      card.style.display = 'none';
    }
  });

  // Ocultar categorías enteras si no tienen tarjetas visibles
  sections.forEach(sec => {
    const visibleCards = sec.querySelectorAll('.service-card-item[style*="display: flex"], .service-card-item:not([style*="display: none"])');
    let hasVisible = false;
    sec.querySelectorAll('.service-card-item').forEach(c => {
      if (c.style.display !== 'none') hasVisible = true;
    });
    sec.style.display = hasVisible ? 'block' : 'none';
  });

  if (noResults) {
    noResults.style.display = (matchTotal === 0 && query !== '') ? 'block' : 'none';
  }
}

// =============================================================================
// 8.1 SECCIÓN ESTUDIANTE: MIS EXÁMENES Y EVALUACIONES (ABRIR, RESOLVER Y ENVIAR)
// =============================================================================

let currentExamFilter = 'all'; // 'all', 'pending', 'review', 'graded'

function setExamFilter(filter) {
  currentExamFilter = filter;
  const container = document.getElementById('mainViewContainer');
  if (container) renderStudentExamsSection(container);
}

function renderStudentExamsSection(container) {
  const user = state.currentUser;
  const grade = user.grade || '5';
  const exams = state.getExamsByGrade(grade);

  const pendingCount = exams.filter(e => !e.submissions || !e.submissions.some(s => s.studentEmail === user.email)).length;
  const inReviewCount = exams.filter(e => e.submissions?.some(s => s.studentEmail === user.email && !s.reviewed)).length;
  const gradedCount = exams.filter(e => e.submissions?.some(s => s.studentEmail === user.email && s.reviewed)).length;

  // Filtrado
  const filteredExams = exams.filter(exam => {
    const mySub = exam.submissions?.find(s => s.studentEmail === user.email);
    if (currentExamFilter === 'pending') return !mySub;
    if (currentExamFilter === 'review') return mySub && !mySub.reviewed;
    if (currentExamFilter === 'graded') return mySub && mySub.reviewed;
    return true;
  });

  container.innerHTML = `
    <!-- Barra de Navegación Rápida -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem;">
      <button class="btn-secondary btn-sm" onclick="switchSection('menu')" style="display:flex; align-items:center; gap:0.4rem;">
        <span>⬅️ Back to Main Menu</span>
      </button>
      <div style="font-size:0.85rem; color:var(--text-muted);">
        SmartClass Campus • Official Assessments Grade <strong>${grade}</strong>
      </div>
    </div>

    <div class="content-card" style="border: 2px solid var(--primary-blue);">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon" style="background:#e0f2fe; color:#0284c7;">📋</div>
          <div class="card-title-text">
            <h2>My Exams and Official Assessments (Grade ${grade}</h2>
            <span>Open your grade's assessments, solve them and send them directly so your teacher can grade them</span>
          </div>
        </div>
      </div>

      <!-- Pestañas de Filtro Rápido -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem; flex-wrap:wrap; border-bottom:1.5px solid #e2e8f0; padding-bottom:0.75rem;">
        <button class="btn-secondary btn-sm ${currentExamFilter === 'all' ? 'active' : ''}" onclick="setExamFilter('all')" style="${currentExamFilter === 'all' ? 'background:var(--navy); color:#fff; border-color:var(--navy);' : ''}">
          All (${exams.length})
        </button>
        <button class="btn-secondary btn-sm ${currentExamFilter === 'pending' ? 'active' : ''}" onclick="setExamFilter('pending')" style="${currentExamFilter === 'pending' ? 'background:var(--navy); color:#fff; border-color:var(--navy);' : ''}">
          ⏳ Pending to Solve (${pendingCount})
        </button>
        <button class="btn-secondary btn-sm ${currentExamFilter === 'review' ? 'active' : ''}" onclick="setExamFilter('review')" style="${currentExamFilter === 'review' ? 'background:var(--navy); color:#fff; border-color:var(--navy);' : ''}">
          📤 Under Teacher Review (${inReviewCount})
        </button>
        <button class="btn-secondary btn-sm ${currentExamFilter === 'graded' ? 'active' : ''}" onclick="setExamFilter('graded')" style="${currentExamFilter === 'graded' ? 'background:var(--navy); color:#fff; border-color:var(--navy);' : ''}">
          ✅ Graded (${gradedCount})
        </button>
      </div>

      ${filteredExams.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon">🎉</span>
          <h4>There are no assessments in this category</h4>
          <p>Check the other tabs or go back to the main menu to see your other subjects.</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          ${filteredExams.map(exam => {
            const mySub = exam.submissions?.find(s => s.studentEmail === user.email);
            const totalQuestions = exam.questions ? exam.questions.length : 0;

            return `
              <div style="background:#ffffff; border:1.5px solid ${mySub ? (mySub.reviewed ? '#86efac' : '#fde047') : 'var(--border-color)'}; border-radius:var(--radius-md); padding:1.25rem; box-shadow:var(--shadow-sm); transition:transform 0.2s ease;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                  <div>
                    <span class="task-subject-tag">📖 ${exam.subject}</span>
                    <span class="task-grade-tag">Grade ${exam.grade}</span>
                    <h3 style="font-size:1.15rem; font-weight:800; color:var(--navy); margin-top:0.35rem;">
                      ${exam.title}
                    </h3>
                  </div>

                  <div>
                    ${mySub ? (
                      mySub.reviewed 
                        ? `<span class="submission-status-badge submitted" style="font-size:0.85rem; padding:0.3rem 0.75rem;">⭐ Graded: Score ${mySub.gradeMark}</span>` 
                        : `<span class="submission-status-badge pending" style="font-size:0.85rem; padding:0.3rem 0.75rem;">⏳ Under Teacher Review</span>`
                    ) : `<span class="submission-status-badge pending" style="background:#fee2e2; color:#b91c1c; font-size:0.85rem; padding:0.3rem 0.75rem;">⚠️ Pending to Solve</span>`}
                  </div>
                </div>

                <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:0.85rem;">
                  ${exam.instructions}
                </p>

                <!-- Estado del examen para el alumno -->
                ${mySub ? `
                  <div style="background:${mySub.reviewed ? '#f0fdf4' : '#fffbeb'}; border:1px solid ${mySub.reviewed ? '#86efac' : '#fde047'}; border-radius:var(--radius-sm); padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.85rem;">
                    ${mySub.reviewed ? `
                      <div style="color:#166534; font-weight:800; font-size:1rem; margin-bottom:0.35rem;">
                        🎉 Exam Graded by the Teacher! Your Official Score: <span style="background:#ffffff; border:1.5px solid #22c55e; padding:0.15rem 0.55rem; border-radius:4px; color:#15803d;">${mySub.gradeMark}</span>
                      </div>
                      <div style="color:#15803d; margin-bottom:0.25rem;">
                        <strong>Teacher's Feedback:</strong> "${mySub.feedback || 'Excellent presentation and correct answers.'}"
                      </div>
                      <div style="font-size:0.78rem; color:#475569;">
                        Automatic test score: <strong>${mySub.scoreAuto || 100}%</strong> • Evaluated by: ${exam.createdBy}
                      </div>
                    ` : `
                      <div style="color:#b45309; font-weight:700;">
                        ⏳ <strong>Exam Submitted on ${mySub.date} (${mySub.time || 'Recent'}).</strong>
                      </div>
                      <div style="color:#78350f; font-size:0.8rem; margin-top:0.2rem;">
                        Your exam is already in the teacher's inbox. You will receive your official score and pedagogical comments very soon.
                      </div>
                    `}
                  </div>
                ` : ''}

                <div style="background:#f8fafc; padding:0.65rem 0.85rem; border-radius:var(--radius-sm); font-size:0.82rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                  <span>📋 <strong>${totalQuestions} Questions</strong> multiple choice</span>
                  <span style="color:var(--text-muted);">📅 Due date: <strong>${exam.dueDate || '2026-11-25'}</strong></span>
                  <span style="font-weight:700; color:var(--yellow-accent);">⭐ Reward: +50 pts</span>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.75rem; flex-wrap:wrap;">
                  ${!mySub ? `
                    <button class="btn-primary" style="padding:0.75rem 1.5rem; font-weight:800;" onclick="openStudentExamRunnerModal('${exam.id}')">
                      📝 Open and Solve Exam
                    </button>
                  ` : `
                    <button class="btn-secondary btn-sm" onclick="viewStudentExamCorrection('${exam.id}', '${user.email}')">
                      🔍 ${mySub.reviewed ? 'View Detailed Correction and Answers' : 'View Submitted Answers'}
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

// Variables para el runner de examen del estudiante
let activeExamRunnerId = null;
let activeExamAnswers = {};
let examRunnerTimerInterval = null;
let examRunnerSeconds = 0;

function openStudentExamRunnerModal(examId) {
  const exams = state.getExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return;

  activeExamRunnerId = examId;
  activeExamAnswers = {};
  examRunnerSeconds = 0;

  // Título e instrucciones
  document.getElementById('examRunnerTitle').textContent = exam.title;
  document.getElementById('examRunnerMeta').textContent = `${exam.subject} • Grade ${exam.grade} • Teacher: ${exam.createdBy}`;
  document.getElementById('examRunnerInstructions').textContent = exam.instructions;
  document.getElementById('examRunnerComments').value = '';

  // Iniciar Cronómetro
  if (examRunnerTimerInterval) clearInterval(examRunnerTimerInterval);
  const timerEl = document.getElementById('examRunnerTimer');
  examRunnerTimerInterval = setInterval(() => {
    examRunnerSeconds++;
    const mins = String(Math.floor(examRunnerSeconds / 60)).padStart(2, '0');
    const secs = String(examRunnerSeconds % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `⏱️ ${mins}:${secs} min`;
  }, 1000);

  // Renderizar Preguntas Interactivas
  renderExamQuestionsRunner(exam);

  const modal = document.getElementById('studentExamRunnerModal');
  if (modal) modal.classList.add('active');
}

function renderExamQuestionsRunner(exam) {
  const container = document.getElementById('examRunnerQuestionsContainer');
  if (!container) return;

  const questions = exam.questions || [];
  const letters = ['A', 'B', 'C', 'D', 'E'];

  let html = '';
  questions.forEach((q, qIdx) => {
    html += `
      <div class="exam-runner-q-card" id="examQCard_${qIdx}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-weight:900; font-size:0.95rem; color:var(--navy);">
            Question #${qIdx + 1}
          </span>
          <span style="font-size:0.75rem; font-weight:700; color:var(--primary-blue); background:var(--light-blue); padding:0.2rem 0.5rem; border-radius:4px;">
            ${q.points || 25} Points
          </span>
        </div>

        <p style="font-size:0.95rem; font-weight:600; color:var(--text-main); margin-bottom:1rem; line-height:1.4;">
          ${q.text}
        </p>

        <div class="exam-options-list">
          ${q.options.map((opt, optIdx) => `
            <div class="exam-runner-opt-btn" id="optBtn_${qIdx}_${optIdx}" onclick="selectExamOption(${qIdx}, ${optIdx}, ${questions.length})">
              <span class="opt-letter-badge">${letters[optIdx] || optIdx}</span>
              <span style="flex:1;">${opt}</span>
              <input type="radio" name="examRadio_${qIdx}" value="${optIdx}" style="display:none;" />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  updateExamProgress(0, questions.length);
}

function selectExamOption(qIdx, optIdx, totalQuestions) {
  activeExamAnswers[qIdx] = optIdx;

  // Actualizar estilos activos de las opciones de esa pregunta
  const parentCard = document.getElementById(`examQCard_${qIdx}`);
  if (parentCard) {
    parentCard.querySelectorAll('.exam-runner-opt-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.getElementById(`optBtn_${qIdx}_${optIdx}`);
    if (selectedBtn) selectedBtn.classList.add('active');
  }

  // Actualizar radio oculto
  const radio = document.querySelector(`input[name="examRadio_${qIdx}"][value="${optIdx}"]`);
  if (radio) radio.checked = true;

  // Actualizar barra de progreso
  const answeredCount = Object.keys(activeExamAnswers).length;
  updateExamProgress(answeredCount, totalQuestions);
}

function updateExamProgress(answered, total) {
  const label = document.getElementById('examRunnerProgressLabel');
  const bar = document.getElementById('examRunnerProgressBar');
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  if (label) label.textContent = `Progress: ${answered} of ${total} questions answered (${pct}%)`;
  if (bar) bar.style.width = `${pct}%`;
}

function closeStudentExamModal() {
  if (examRunnerTimerInterval) clearInterval(examRunnerTimerInterval);
  const modal = document.getElementById('studentExamRunnerModal');
  if (modal) modal.classList.remove('active');
  activeExamRunnerId = null;
  activeExamAnswers = {};
}

function handleSubmitStudentExam(e) {
  e.preventDefault();
  if (!activeExamRunnerId) return;

  const exams = state.getExams();
  const exam = exams.find(e => e.id === activeExamRunnerId);
  if (!exam) return;

  const user = state.currentUser;
  const questions = exam.questions || [];
  const answeredCount = Object.keys(activeExamAnswers).length;

  // Si falta alguna pregunta, advertir al estudiante
  if (answeredCount < questions.length) {
    const confirmSend = confirm(`You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to send the incomplete exam to the teacher?`);
    if (!confirmSend) return;
  }

  // Calcular aciertos y pre-puntaje
  let correctCount = 0;
  const answersArray = [];
  questions.forEach((q, idx) => {
    const selected = activeExamAnswers[idx] !== undefined ? activeExamAnswers[idx] : null;
    answersArray.push(selected);
    if (selected === q.correct) correctCount++;
  });

  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const comments = document.getElementById('examRunnerComments')?.value.trim() || '';

  if (!exam.submissions) exam.submissions = [];

  const existingIdx = exam.submissions.findIndex(s => s.studentEmail === user.email);
  const submissionData = {
    studentEmail: user.email,
    studentName: user.name,
    grade: String(user.grade),
    date: new Date().toLocaleDateString('en-US'),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    answers: answersArray,
    comments,
    scoreAuto: percentage,
    gradeMark: '', // Queda pendiente para la calificación oficial del docente
    feedback: '',
    reviewed: false,
    submittedAt: Date.now()
  };

  if (existingIdx !== -1) exam.submissions[existingIdx] = submissionData;
  else exam.submissions.push(submissionData);

  state.saveExams(exams);

  closeStudentExamModal();
  showToast('🎉 Exam finished and sent successfully to the teacher! Your submission will appear in the teacher\'s inbox to be graded.', 'success');
  renderApp();
}

// Modal: Ver Corrección y Respuestas del Examen
function viewStudentExamCorrection(examId, studentEmail) {
  const exams = state.getExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return;

  const sub = exam.submissions?.find(s => s.studentEmail === studentEmail);
  if (!sub) return;

  document.getElementById('correctionExamTitle').textContent = exam.title;
  document.getElementById('correctionExamMeta').textContent = `${exam.subject} • Student: ${sub.studentName} • Submitted: ${sub.date}`;

  const body = document.getElementById('correctionExamBody');
  const questions = exam.questions || [];
  const letters = ['A', 'B', 'C', 'D', 'E'];

  let html = `
    <!-- Resumen de Nota y Estado -->
    <div style="background:${sub.reviewed ? '#f0fdf4' : '#fffbeb'}; border:1.5px solid ${sub.reviewed ? '#86efac' : '#fde047'}; border-radius:var(--radius-md); padding:1rem 1.25rem; margin-bottom:1.5rem;">
      ${sub.reviewed ? `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
          <span style="font-size:1.15rem; font-weight:900; color:#166534;">
            🎉 Official Score Assigned: <span style="background:#fff; border:2px solid #22c55e; padding:0.2rem 0.65rem; border-radius:6px;">${sub.gradeMark}</span>
          </span>
          <span style="font-size:0.85rem; font-weight:800; color:#15803d;">Correct answers: ${sub.scoreAuto || 0}%</span>
        </div>
        <p style="color:#15803d; font-size:0.9rem; margin-top:0.35rem;">
          <strong>Teacher's Message:</strong> "${sub.feedback || 'Assessment reviewed successfully.'}"
        </p>
      ` : `
        <div style="color:#b45309; font-weight:800; font-size:1rem; margin-bottom:0.25rem;">
          ⏳ Exam submitted to the teacher on ${sub.date} at ${sub.time || 'Recent'}.
        </div>
        <p style="color:#78350f; font-size:0.85rem;">
          Your exam is under review. The teacher is reviewing your answers and will soon assign your official score.
        </p>
      `}
    </div>

    <h4 style="font-size:1.05rem; font-weight:800; color:var(--navy); margin-bottom:1rem;">
      Question-by-Question Review:
    </h4>
  `;

  questions.forEach((q, qIdx) => {
    const stdAnswer = sub.answers ? sub.answers[qIdx] : null;
    const isCorrect = stdAnswer === q.correct;

    html += `
      <div class="correction-q-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <strong>#${qIdx + 1}. ${q.text}</strong>
          <span style="font-size:0.75rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:4px; ${isCorrect ? 'background:#dcfce7; color:#166534;' : 'background:#fee2e2; color:#991b1b;'}">
            ${isCorrect ? '✅ Correct (+25 pts)' : '❌ Wrong (0 pts)'}
          </span>
        </div>

        <div style="margin-top:0.6rem;">
          ${q.options.map((opt, optIdx) => {
            const isUserChoice = stdAnswer === optIdx;
            const isCorrectOption = q.correct === optIdx;

            let optClass = 'correction-opt-item';
            if (isUserChoice && isCorrect) optClass += ' user-correct';
            else if (isUserChoice && !isCorrect) optClass += ' user-incorrect';
            else if (isCorrectOption && !isCorrect) optClass += ' correct-answer';

            return `
              <div class="${optClass}">
                <span class="opt-letter-badge">${letters[optIdx] || optIdx}</span>
                <span style="flex:1;">${opt}</span>
                ${isUserChoice ? `<span style="font-size:0.75rem; font-weight:800;">${isCorrect ? '(Your answer ✓)' : '(Your answer ✗)'}</span>` : ''}
                ${isCorrectOption && !isCorrect ? `<span style="font-size:0.75rem; font-weight:800; color:#166534;">(Correct Answer)</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  body.innerHTML = html;
  const modal = document.getElementById('viewExamCorrectionModal');
  if (modal) modal.classList.add('active');
}

function closeExamCorrectionModal() {
  const modal = document.getElementById('viewExamCorrectionModal');
  if (modal) modal.classList.remove('active');
}

// Modal: Calificar Examen del Estudiante (Docentes)
function openTeacherGradeExamModal(examId, studentEmail) {
  const exams = state.getExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return;

  const sub = exam.submissions?.find(s => s.studentEmail === studentEmail);
  if (!sub) return;

  document.getElementById('teacherGradeModalTitle').textContent = `Grade Exam: ${exam.title}`;
  document.getElementById('teacherGradeModalMeta').textContent = `Student: ${sub.studentName} (${sub.studentEmail}) • Subject: ${exam.subject}`;

  const body = document.getElementById('teacherGradeModalBody');
  const questions = exam.questions || [];

  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (sub.answers && sub.answers[idx] === q.correct) correctCount++;
  });
  const suggested = questions.length > 0 ? ((correctCount / questions.length) * 5.0).toFixed(1) : '5.0';

  body.innerHTML = `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); padding:1rem; margin-bottom:1.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <strong>Calculated correct answers:</strong> ${correctCount} of ${questions.length} (${sub.scoreAuto || 0}%)
        </div>
        <div>
          <span class="reviewing-badge ${sub.reviewed ? 'graded' : ''}">
            ${sub.reviewed ? `✅ Graded: Score ${sub.gradeMark}` : '⏳ Pending Grading'}
          </span>
        </div>
      </div>
    </div>

    <!-- Desglose de Preguntas -->
    <div style="margin-bottom:1.5rem; display:flex; flex-direction:column; gap:0.75rem;">
      ${questions.map((q, idx) => {
        const stdAns = sub.answers ? sub.answers[idx] : null;
        const isRight = stdAns === q.correct;
        return `
          <div style="background:#fff; border:1px solid #cbd5e1; border-radius:var(--radius-sm); padding:0.75rem 1rem; font-size:0.85rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
              <strong>#${idx + 1}. ${q.text}</strong>
              <span style="font-size:0.75rem; font-weight:800; ${isRight ? 'color:#166534;' : 'color:#dc2626;'}">
                ${isRight ? '✅ Correct' : '❌ Wrong'}
              </span>
            </div>
            <div style="font-size:0.8rem; color:#475569;">
              Student's answer: <strong style="${isRight ? 'color:#166534;' : 'color:#dc2626;'}">${stdAns !== null ? q.options[stdAns] : 'Not answered'}</strong>
              ${!isRight ? ` • <span style="color:#166534;">Correct: <strong>${q.options[q.correct]}</strong></span>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Formulario de Calificación -->
    <form onsubmit="handleTeacherGradeExamModalSubmit(event, '${exam.id}', '${sub.studentEmail}')">
      <div class="form-group">
        <label style="font-weight:800; color:var(--navy);">Assigned Official Score (1.0 to 5.0):</label>
        <input type="text" id="modalGradeMarkInput" class="form-control" style="font-size:1.1rem; font-weight:800; color:#1e40af;" value="${sub.gradeMark || suggested}" required />
      </div>

      <div class="form-group">
        <label style="font-weight:800; color:var(--navy);">Teacher's Pedagogical Feedback:</label>
        <textarea id="modalGradeFeedbackInput" class="form-control" rows="3" placeholder="Write congratulations or recommendations for the student..." required>${sub.feedback || 'Excellent work on the exam. Keep practicing.'}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
        <button type="button" class="btn-secondary" onclick="closeTeacherGradeExamModal()">Cancel</button>
        <button type="submit" class="btn-primary" style="padding:0.75rem 1.5rem; font-weight:800;">
          ⭐ Save and Send Score to the Student
        </button>
      </div>
    </form>
  `;

  const modal = document.getElementById('teacherGradeExamModal');
  if (modal) modal.classList.add('active');
}

function handleTeacherGradeExamModalSubmit(e, examId, studentEmail) {
  e.preventDefault();
  const gradeScore = document.getElementById('modalGradeMarkInput')?.value.trim();
  const feedbackText = document.getElementById('modalGradeFeedbackInput')?.value.trim();

  if (!gradeScore) return;

  const exams = state.getExams();
  const exam = exams.find(e => e.id === examId);
  if (!exam) return;

  const sub = exam.submissions?.find(s => s.studentEmail === studentEmail);
  if (sub) {
    sub.gradeMark = gradeScore;
    sub.feedback = feedbackText;
    sub.reviewed = true;
    state.saveExams(exams);


    closeTeacherGradeExamModal();
    showToast(`⭐ Exam graded successfully! Official score ${gradeScore} guardada.`, 'success');
    renderApp();
  }
}

function closeTeacherGradeExamModal() {
  const modal = document.getElementById('teacherGradeExamModal');
  if (modal) modal.classList.remove('active');
}

// 8.2 SECCIÓN ESTUDIANTE: MONTAR TAREAS Y DESCARGAS
function renderStudentTasksSection(container) {
  const user = state.currentUser;
  const grade = user.grade || '5';
  const tasksForMyGrade = state.getTasksByGrade(grade);

  container.innerHTML = `
    <!-- Barra de Navegación Rápida -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem;">
      <button class="btn-secondary btn-sm" onclick="switchSection('menu')" style="display:flex; align-items:center; gap:0.4rem;">
        <span>⬅️ Back to Main Menu</span>
      </button>
      <div style="font-size:0.85rem; color:var(--text-muted);">
        SmartClass Campus • Assigned Homework Grade <strong>${grade}</strong>
      </div>
    </div>

    <div class="smart-hero-banner">
      <div class="hero-info">
        <h1>🎒 Grade Classroom ${grade}</h1>
        <p>Here is your assigned homework. You can <strong>download the study guide</strong> at any time or <strong>upload your photos</strong> to send them to your teacher.</p>
      </div>
      <div class="hero-stats-row">
        <div class="stat-chip">
          <div class="stat-chip-icon yellow">⭐</div>
          <div class="stat-chip-data">
            <span class="stat-chip-num">${user.points || 0} pts</span>
            <span class="stat-chip-lbl">Points</span>
          </div>
        </div>
        <div class="stat-chip">
          <div class="stat-chip-icon blue">🌟</div>
          <div class="stat-chip-data">
            <span class="stat-chip-num">${user.stars || 0}</span>
            <span class="stat-chip-lbl">Stars</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">📤</div>
          <div class="card-title-text">
            <h2>Homework Assigned for Grade ${grade}</h2>
            <span>Download the guides and upload your notebook or model photos</span>
          </div>
        </div>
      </div>

      ${tasksForMyGrade.length === 0 ? `
        <div class="empty-state">
          <span class="empty-state-icon">🎉</span>
          <h4>You have no pending homework in Grade ${grade}</h4>
          <p>Your teacher has not published new homework for this class yet.</p>
        </div>
      ` : `
        <div class="tasks-grid">
          ${tasksForMyGrade.map(t => renderStudentTaskCardWithDownload(t, user.email)).join('')}
        </div>
      `}
    </div>
  `;
}

function renderStudentTaskCardWithDownload(task, userEmail) {
  const mySub = task.submissions ? task.submissions.find(s => s.studentEmail === userEmail) : null;

  return `
    <div class="task-item-card" data-kind="task" data-id="${task.id}">
      <div>
        <div class="task-header-row">
          <span class="task-subject-tag">📖 ${task.subject}</span>
          ${mySub ? (
            mySub.reviewed 
              ? '<span class="submission-status-badge submitted">✅ Graded</span>' 
              : '<span class="submission-status-badge pending">⏳ Under Review</span>'
          ) : '<span class="submission-status-badge pending">Pending</span>'}
        </div>
        <h3 class="task-title">${task.title}</h3>
        <p class="task-desc">${task.description}</p>
      </div>

      <div>
        ${mySub ? `
          <div style="background:${mySub.reviewed ? '#f0fdf4' : '#fffbeb'}; border:1px solid ${mySub.reviewed ? '#bbf7d0' : '#fef08a'}; border-radius:var(--radius-sm); padding:0.75rem; margin-bottom:0.75rem; font-size:0.82rem;">
            ${mySub.reviewed ? `
              <div style="color:#166534; font-weight:800; font-size:0.95rem; margin-bottom:0.35rem;">
                🎉 Graded! Your Score: <span style="background:#fff; padding:0.2rem 0.5rem; border-radius:4px; border:1px solid #86efac;">${mySub.gradeMark}</span>
              </div>
              <div style="color:#15803d;"><strong>Teacher:</strong> "${mySub.feedback}"</div>
            ` : `
              <div style="color:#b45309; font-weight:700;">
                ⏳ Homework sent. Your teacher is reviewing it.
              </div>
            `}
            ${mySub.photoUrl ? `
              <div style="margin-top:0.4rem;">
                📸 <a href="javascript:void(0)" onclick="viewPhotoFullscreen('${mySub.photoUrl}')" style="color:var(--primary-blue); font-weight:700; text-decoration:underline;">View submitted photo</a>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="task-footer-info">
          <div class="task-due-date">📅 Due: ${task.dueDate}</div>
          <div style="font-weight:700; color:var(--yellow-accent);">⭐ +${task.points} pts</div>
        </div>

        <div class="task-actions-row" style="flex-direction:column; gap:0.5rem;">
          <button class="btn-primary" style="width:100%; justify-content:center;" onclick="openSubmitHomeworkModal('${task.id}')">
            ${mySub ? '🔄 Upload Photo Again' : '📤 Upload Photo and Submit'}
          </button>

          <button class="btn-secondary btn-sm" style="width:100%; justify-content:center;" onclick="downloadTaskGuide('${task.id}')">
            📥 Download homework (Word)
          </button>
        </div>
      </div>
    </div>
  `;
}

// Descarga de Guía de Tarea en archivo formateado
function downloadTaskGuide(taskId) {
  const tasks = state.getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const content = `=====================================================
SMARTCLASS - SmartClass
OFFICIAL SCHOOL HOMEWORK GUIDE
=====================================================
Title: ${task.title}
Subject: ${task.subject}
Grade: Grade ${task.grade} 
Due Date: ${task.dueDate}
Points: ${task.points} pts
Teacher: ${task.createdBy}

-----------------------------------------------------
ACTIVITY INSTRUCTIONS:
-----------------------------------------------------
${task.description}

-----------------------------------------------------
RECOMMENDATIONS FOR THE STUDENT:
-----------------------------------------------------
1. Complete the activity in your notebook clearly and neatly.
2. Take a sharp, well-lit photo of your work.
3. Go to SmartClass, press \"Upload Photo and Submit\" and add your comments.
4. Your teacher will review the photo and give you the official score.
=====================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Homework_Guide_${task.subject}_Grado${task.grade}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Guide \"${task.title}\" downloaded successfully!`, 'success');
}

// 8.3 SECCIÓN ESTUDIANTE: MIS CALIFICACIONES Y POLÍGRAFO (TAREAS Y EXÁMENES)
function renderStudentGradebookSection(container) {
  const user = state.currentUser;
  const grade = user.grade || '5';
  const tasks = state.getTasksByGrade(grade);
  const exams = state.getExamsByGrade(grade);

  // Compilar todos los registros de notas (tanto tareas como exámenes)
  const gradeItems = [];

  tasks.forEach(t => {
    const sub = t.submissions?.find(s => s.studentEmail === user.email);
    gradeItems.push({
      type: '📸 Targeted Homework',
      title: t.title,
      subject: t.subject,
      date: sub ? sub.date : t.dueDate,
      submitted: !!sub,
      reviewed: sub ? sub.reviewed : false,
      gradeMark: sub?.gradeMark || '',
      feedback: sub?.feedback || ''
    });
  });

  exams.forEach(e => {
    const sub = e.submissions?.find(s => s.studentEmail === user.email);
    gradeItems.push({
      type: '📝 Official Exam',
      title: e.title,
      subject: e.subject,
      date: sub ? sub.date : (e.dueDate || '2026-11-25'),
      submitted: !!sub,
      reviewed: sub ? sub.reviewed : false,
      gradeMark: sub?.gradeMark || '',
      feedback: sub?.feedback || ''
    });
  });

  // Quizzes publicados por el profesor
  (state.load('smartclass_quizzes') || []).filter(q => q.published && String(q.grade) === String(grade)).forEach(q => {
    const r = (q.responses || []).find(x => x.email === user.email);
    gradeItems.push({
      type: '❓ Quiz',
      title: q.title,
      subject: q.subject || 'General',
      date: r ? r.date : '—',
      submitted: !!r,
      reviewed: r ? r.reviewed : false,
      gradeMark: r?.gradeMark || '',
      feedback: r?.feedback || ''
    });
  });

  // Calcular Promedio General (GPA)
  let numericGrades = [];
  gradeItems.forEach(item => {
    if (item.reviewed && item.gradeMark) {
      const num = parseFloat(item.gradeMark);
      if (!isNaN(num)) numericGrades.push(num);
    }
  });

  const averageScore = numericGrades.length > 0 
    ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1)
    : '—';
  const perf = numericGrades.length === 0 ? ['No scores yet', 'You don\'t have any grades yet'] : (parseFloat(averageScore) >= 4.5 ? ['Outstanding', 'Excellent work'] : parseFloat(averageScore) >= 4.0 ? ['High', 'Very good work'] : parseFloat(averageScore) >= 3.0 ? ['Basic', 'Keep improving'] : ['Low', 'Needs support']);

  container.innerHTML = `
    <!-- Barra de Navegación Rápida -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem;">
      <button class="btn-secondary btn-sm" onclick="switchSection('menu')" style="display:flex; align-items:center; gap:0.4rem;">
        <span>⬅️ Back to Main Menu</span>
      </button>
      <div style="font-size:0.85rem; color:var(--text-muted);">
        SmartClass Campus • Transcript and Grades Grade <strong>${grade}</strong>
      </div>
    </div>

    <!-- Tarjeta de Resumen Académico del Polígrafo -->
    <div style="background:linear-gradient(135deg, #1e3a8a, #0284c7); border-radius:var(--radius-lg); color:#fff; padding:1.75rem; margin-bottom:1.75rem; box-shadow:var(--shadow-md);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.25rem;">
        <div>
          <span style="font-size:0.78rem; text-transform:uppercase; letter-spacing:1px; color:#fde68a; font-weight:800;">
            OFFICIAL ACADEMIC TRANSCRIPT • SMARTCLASS
          </span>
          <h2 style="font-size:1.6rem; font-weight:900; margin:0.35rem 0 0.2rem 0;">${user.name}</h2>
          <div style="font-size:0.88rem; opacity:0.9;">
            Student of Grade <strong>${grade}</strong> • Active Enrollment at SmartClass
          </div>
        </div>

        <div style="display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;">
          <div style="background:rgba(255,255,255,0.15); padding:0.85rem 1.25rem; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:0.75rem; font-weight:700; color:#fde68a;">CUMULATIVE AVERAGE</div>
            <div style="font-size:1.8rem; font-weight:900; color:#fff;">${averageScore}</div>
            <div style="font-size:0.7rem; opacity:0.85;">Scale 1.0 - 5.0</div>
          </div>

          <div style="background:rgba(255,255,255,0.15); padding:0.85rem 1.25rem; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:0.75rem; font-weight:700; color:#fde68a;">PERFORMANCE</div>
            <div style="font-size:1.3rem; font-weight:800; color:#fff;">${perf[0]}</div>
            <div style="font-size:0.7rem; opacity:0.85;">${perf[1]}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon" style="background:#d1fae5; color:#065f46;">📊</div>
          <div class="card-title-text">
            <h2>Detailed Grade Report (Grade ${grade}</h2>
            <span>Official scores of homework and exams graded by your teachers</span>
          </div>
        </div>
        <button class="btn-secondary btn-sm" onclick="downloadTranscriptGuide()">
          📥 Download Transcript (.TXT)
        </button>
      </div>

      <table class="gradebook-table">
        <thead>
          <tr>
            <th>Type / Mode</th>
            <th>Activity / Assessment</th>
            <th>Official Subject</th>
            <th>Date</th>
            <th>Status</th>
            <th>Official Score</th>
            <th>Teacher's Comments</th>
          </tr>
        </thead>
        <tbody>
          ${gradeItems.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);"><em>There is no homework or exams yet. When your teacher publishes and grades them, your scores will appear here.</em></td></tr>' : ''}
          ${gradeItems.map(item => `
            <tr>
              <td><span style="font-weight:700; font-size:0.8rem; color:var(--navy);">${item.type}</span></td>
              <td><strong>${item.title}</strong></td>
              <td><span class="task-subject-tag">${item.subject}</span></td>
              <td>${item.date}</td>
              <td>
                ${item.submitted ? (
                  item.reviewed 
                    ? '<span class="submission-status-badge submitted">✅ Graded</span>' 
                    : '<span class="submission-status-badge pending">⏳ Under Review</span>'
                ) : '<span style="color:var(--text-muted); font-size:0.8rem;">Not Done</span>'}
              </td>
              <td>
                ${item.reviewed && item.gradeMark ? `
                  <span class="score-badge high" style="font-size:0.95rem; font-weight:800;">${item.gradeMark}</span>
                ` : '<span class="score-badge pending">Pending</span>'}
              </td>
              <td style="font-size:0.85rem; color:var(--text-main);">
                ${item.feedback ? `"${item.feedback}"` : '<em>Pending feedback</em>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function downloadTranscriptGuide() {
  const user = state.currentUser;
  const grade = user.grade || '5';
  const content = `=====================================================
SMARTCLASS - SmartClass
OFFICIAL GRADE TRANSCRIPT
=====================================================
Student: ${user.name}
Email: ${user.email}
School Grade: Grade ${grade} 
Issue Date: ${new Date().toLocaleDateString('en-US')}
Accumulated Points: ${user.points || 0} pts • Stars: ${user.stars || 0} ⭐
=====================================================
OFFICIAL ACADEMIC PERFORMANCE VALIDATION DOCUMENT
=====================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Transcript_${user.name.replace(/\s+/g, '_')}_Grado${grade}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Grade transcript downloaded successfully!', 'success');
}

// 8.3 SECCIÓN ESTUDIANTE: ACTIVIDADES INTERACTIVAS Y PRÁCTICA INFINITA
function renderStudentInfinitePracticeSection(container) {
  const grade = state.currentUser.grade || '5';
  const activities = state.getActivitiesByGrade(grade);
  const q = INFINITE_QUESTION_POOL[state.quizIndex % INFINITE_QUESTION_POOL.length];

  container.innerHTML = `
    <!-- Práctica Infinita de Preguntas (Si se equivoca siguen saliendo) -->
    <div class="continuous-quiz-box" style="margin-bottom:1.75rem;">
      <div class="quiz-stats-header">
        <div>
          <span class="brand-badge" style="background:var(--yellow-glow); color:var(--dark-blue); font-weight:800;">
            🎮 SmartClass Continuous Challenge • +20 Pts per Correct Answer
          </span>
          <h3 style="font-size:1.25rem; font-weight:800; color:var(--navy); margin-top:0.35rem;">
            Question #${state.quizIndex + 1}: ${q.q}
          </h3>
        </div>

        <div class="streak-pill">
          🔥 Streak: ${state.quizStreak} in a row
        </div>
      </div>

      <div class="quiz-options-list" id="infiniteQuizOptions">
        ${q.options.map((opt, idx) => `
          <button class="quiz-option-btn" onclick="handleInfiniteAnswer(${idx}, ${q.correct}, '${encodeURIComponent(q.explanation)}')">
            <span style="background:var(--primary-blue); color:#fff; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem;">
              ${['A','B','C','D'][idx]}
            </span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>

      <div id="infiniteQuizFeedback" style="margin-top:1.25rem; display:none;"></div>
    </div>

    <!-- Actividades Interactivas Publicadas por el Docente -->
    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">💡</div>
          <div class="card-title-text">
            <h2>Interactive Activities of Your Class (Grade ${grade}</h2>
            <span>Activities published by your teacher to review by playing</span>
          </div>
        </div>
      </div>

      ${activities.length === 0 ? `
        <div class="empty-state">
          <p>Your teacher has not activated any topic activities in this grade yet.</p>
        </div>
      ` : `
        <div class="activities-options-grid">
          ${activities.map(act => `
            <div class="activity-option-card" data-kind="act" data-id="${act.id}">
              <div>
                <span class="activity-type-badge" style="background:#e0f2fe; color:#0284c7;">
                  ${act.type === 'trivia' ? '🎯 Trivia' : '🧩 Memory'}
                </span>
                <h4 style="font-size:1.05rem; font-weight:800; color:var(--navy); margin-bottom:0.35rem;">${act.title}</h4>
                <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">${act.desc}</p>
              </div>
              <button class="btn-primary btn-sm" onclick="scPlayAct('${act.id}')">
                🎮 Play Now (+${act.points} pts)
              </button>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// Lógica de respuesta continua: Si se equivoca, SIGUEN SALIENDO MÁS PREGUNTAS
function handleInfiniteAnswer(selectedIndex, correctIndex, encodedExp) {
  const explanation = decodeURIComponent(encodedExp);
  const feedback = document.getElementById('infiniteQuizFeedback');
  const buttons = document.querySelectorAll('#infiniteQuizOptions .quiz-option-btn');

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === correctIndex) b.classList.add('selected-correct');
    else if (i === selectedIndex) b.classList.add('selected-wrong');
  });

  if (!feedback) return;
  feedback.style.display = 'block';

  if (selectedIndex === correctIndex) {
    state.quizStreak += 1;
    feedback.innerHTML = `
      <div style="background:#d1fae5; border:1.5px solid #10b981; color:#065f46; padding:0.9rem; border-radius:var(--radius-md); font-weight:700;">
        🎉 Excellent! Correct Answer: ${explanation}
        
      </div>
      <button class="btn-primary" style="margin-top:0.75rem;" onclick="loadNextInfiniteQuestion()">
        ➡️ Next Question
      </button>
    `;
    showToast('Correct! Streak increased.', 'success');
  } else {
    // Si se equivoca, mensaje motivador y BOTÓN DIRECTO PARA OTRA PREGUNTA
    state.quizStreak = 0;
    feedback.innerHTML = `
      <div style="background:#fee2e2; border:1.5px solid #ef4444; color:#991b1b; padding:0.9rem; border-radius:var(--radius-md); font-weight:700;">
        ❌ Oops! But at SmartClass we keep learning without stopping.
        <br><span>The correct answer was: <strong>${['A','B','C','D'][correctIndex]}</strong> (${explanation}).</span>
      </div>
      <button class="btn-yellow" style="margin-top:0.75rem;" onclick="loadNextInfiniteQuestion()">
        🔄 Keep Practicing! Next Question
      </button>
    `;
  }
}

function loadNextInfiniteQuestion() {
  state.quizIndex += 1;
  renderApp();
}

// 8.4 SECCIÓN ESTUDIANTE: COMPETIR E INVITAR COMPAÑEROS
function renderStudentDuelsSection(container) {
  const user = state.currentUser;
  const grade = user.grade || '5';
  const duels = state.getDuelsByGrade(grade);
  const myPendingInvitations = duels.filter(d => d.opponentEmail === user.email && d.status === 'pending');

  container.innerHTML = `
    <!-- Invitaciones Recibidas -->
    ${myPendingInvitations.map(d => `
      <div class="invitation-alert-card">
        <div>
          <span style="font-size:0.75rem; font-weight:800; color:#b45309; text-transform:uppercase;">Challenge Received!</span>
          <h4 style="font-size:1.1rem; color:#78350f; font-weight:800;">
            ⚔️ ${d.challengerName} challenged you to a duel on: \"${d.topic}"
          </h4>
        </div>
        <button class="btn-primary" onclick="acceptDuelChallenge('${d.id}')">
          🎮 Accept Challenge and Play
        </button>
      </div>
    `).join('')}

    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon" style="background:#ede9fe; color:#8b5cf6;">⚔️</div>
          <div class="card-title-text">
            <h2>Competitions and Duels between Classmates (Grade ${grade}</h2>
            <span>Compete with your friends in quick knowledge challenges and earn points</span>
          </div>
        </div>
        <button class="btn-yellow" onclick="openInviteDuelModal()">
          ⚔️ Send an Invitation to a Classmate
        </button>
      </div>

      <div class="duel-arena-banner">
        <div>
          <h3 style="font-size:1.35rem; font-weight:900;">Student Duel Hall</h3>
          <p style="font-size:0.85rem; opacity:0.9;">Invite any of your classmates from ${grade} to a battle of 3 questions of math or science.</p>
        </div>
        <button class="btn-yellow" onclick="openInviteDuelModal()">
          ➕ Create New Duel
        </button>
      </div>

      <div style="margin-top:1.5rem;">
        <h4 style="font-size:1.05rem; font-weight:800; color:var(--navy); margin-bottom:0.75rem;">Challenge History in Your Grade:</h4>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${duels.map(d => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1rem; border-radius:var(--radius-md); background:#f8fafc; border:1px solid #e2e8f0; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <strong>${d.challengerName}</strong> 
                <span style="color:#f59e0b; font-weight:900;">VS</span> 
                <strong>${d.opponentName}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Topic: ${d.topic}</div>
              </div>
              <div>
                <span class="submission-status-badge ${d.status === 'completed' ? 'submitted' : 'pending'}">
                  ${d.status === 'completed' ? `Winner: ${d.winner}` : 'Waiting'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function acceptDuelChallenge(duelId) {
  const duels = state.getDuels();
  const d = duels.find(x => x.id === duelId);
  if (!d) return;

  d.status = 'completed';
  d.opponentScore = 95;
  d.winner = state.currentUser.name;
  state.saveDuels(duels);

  showToast(`You won the duel against ${d.challengerName}!`, 'success');
  renderApp();
}

// 8.5 SECCIÓN ESTUDIANTE: TUTORÍA Y CONECTAR CON COMPAÑEROS
function renderStudentTutoringSection(container) {
  const user = state.currentUser;
  const grade = user.grade || '5';
  const currentTutor = state.getTutorForGrade(grade);
  const isMeTheTutor = (currentTutor && currentTutor.email === user.email);
  const sessions = state.getTutoringsByGrade(grade);

  container.innerHTML = `
    <!-- Banner Tutor -->
    <div class="grade-tutor-banner">
      <div class="grade-tutor-left">
        <div class="tutor-icon-big">🤝</div>
        <div class="grade-tutor-info">
          <h3>Official Grade Tutor ${grade} ${currentTutor ? currentTutor.name : 'No tutor designated yet'}</h3>
          <p>${isMeTheTutor 
              ? '🎉 You are the Official Tutor of your class! You can create study sessions and invite your classmates.' 
              : currentTutor 
                ? `Your classmate ${currentTutor.name} supports the class with homework questions.` 
                : 'The teacher will soon appoint a registered tutor.'}</p>
        </div>
      </div>
      <div>
        <button class="btn-yellow" onclick="openCreateTutoringModal()">
          📢 Create Session and Invite Classmates
        </button>
      </div>
    </div>

    <!-- Sesiones Grupales de Tutoría -->
    <div class="content-card">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">👥</div>
          <div class="card-title-text">
            <h2>Tutoring Sessions and Study Groups (Grade ${grade}</h2>
            <span>Create a study meeting or join your classmates' sessions</span>
          </div>
        </div>
        <button class="btn-primary" onclick="openCreateTutoringModal()">
          ➕ New Tutoring
        </button>
      </div>

      ${sessions.length === 0 ? `
        <div class="empty-state">
          <p>There are no tutoring sessions scheduled at the moment.</p>
        </div>
      ` : `
        <div class="tutoring-grid">
          ${sessions.map(s => `
            <div class="tutoring-card" data-kind="tut" data-id="${s.id}">
              <div>
                <span class="task-subject-tag">${s.subject}</span>
                <h4 style="font-size:1.1rem; font-weight:800; color:var(--navy); margin:0.4rem 0 0.2rem 0;">${s.title}</h4>
                <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.6rem;">
                  Organized by: <strong>${s.hostName}</strong> • Schedule: ${s.time}
                </div>
                <p style="font-size:0.85rem; color:var(--text-main); margin-bottom:0.75rem;">${s.desc}</p>
                <div style="font-size:0.75rem; color:var(--primary-blue); font-weight:700;">
                  Confirmed participants: ${s.attendees ? s.attendees.join(', ') : 'Several classmates'}
                </div>
              </div>
              <button class="btn-secondary btn-sm" style="margin-top:1rem; width:100%; justify-content:center;" onclick="joinTutoringSession('${s.id}')">
                🤝 Join the Tutoring Session
              </button>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function joinTutoringSession(sessionId) {
  const sessions = state.getTutorings();
  const s = sessions.find(x => x.id === sessionId);
  if (!s) return;

  const userName = state.currentUser.name;
  if (!s.attendees) s.attendees = [];
  if (!s.attendees.includes(userName)) {
    s.attendees.push(userName);
    state.saveTutorings(sessions);
    showToast(`You joined the session \"${s.title}"!`, 'success');
    renderApp();
  } else {
    showToast(`You are already enrolled in this tutoring session.`, 'warning');
  }
}

// 8.6 SECCIÓN ESTUDIANTE: AVATAR
function renderStudentAvatarSection(container) {
  const user = state.currentUser;
  container.innerHTML = `
    <div class="content-card" style="max-width:700px; margin:0 auto;">
      <div class="card-top-bar">
        <div class="card-title-group">
          <div class="card-title-icon">🎨</div>
          <div class="card-title-text">
            <h2>Create and Customize My Avatar</h2>
            <span>Choose your skin tone, outfit, hairstyle and accessories</span>
          </div>
        </div>
      </div>

      <div class="avatar-customizer-box">
        <div class="avatar-stage" id="studentAvatarStage">
          ${generateAvatarSvg(user.avatar, 130)}
        </div>

        <div class="avatar-options-grid">
          <div class="avatar-field">
            <label>Skin Tone</label>
            <select id="avSkin" onchange="previewUserAvatar()">
              <option value="#ffd1a4" ${user.avatar?.skin === '#ffd1a4' ? 'selected' : ''}>Light</option>
              <option value="#fcd34d" ${user.avatar?.skin === '#fcd34d' ? 'selected' : ''}>Warm</option>
              <option value="#e2a76f" ${user.avatar?.skin === '#e2a76f' ? 'selected' : ''}>Tan</option>
              <option value="#8d5524" ${user.avatar?.skin === '#8d5524' ? 'selected' : ''}>Brown</option>
            </select>
          </div>

          <div class="avatar-field">
            <label>Hair</label>
            <select id="avHair" onchange="previewUserAvatar()">
              <option value="short" ${user.avatar?.hair === 'short' ? 'selected' : ''}>Short</option>
              <option value="curly" ${user.avatar?.hair === 'curly' ? 'selected' : ''}>Curly</option>
              <option value="ponytail" ${user.avatar?.hair === 'ponytail' ? 'selected' : ''}>Ponytail</option>
              <option value="spiky" ${user.avatar?.hair === 'spiky' ? 'selected' : ''}>Spiky</option>
            </select>
          </div>

          <div class="avatar-field">
            <label>Hair Color</label>
            <select id="avHairColor" onchange="previewUserAvatar()">
              <option value="#4a2c11" ${user.avatar?.hairColor === '#4a2c11' ? 'selected' : ''}>Brown</option>
              <option value="#1e293b" ${user.avatar?.hairColor === '#1e293b' ? 'selected' : ''}>Black</option>
              <option value="#b45309" ${user.avatar?.hairColor === '#b45309' ? 'selected' : ''}>Blond</option>
              <option value="#991b1b" ${user.avatar?.hairColor === '#991b1b' ? 'selected' : ''}>Red</option>
            </select>
          </div>

          <div class="avatar-field">
            <label>Clothes</label>
            <select id="avClothes" onchange="previewUserAvatar()">
              <option value="hoodie" ${user.avatar?.clothes === 'hoodie' ? 'selected' : ''}>Hoodie</option>
              <option value="tshirt" ${user.avatar?.clothes === 'tshirt' ? 'selected' : ''}>T-shirt</option>
              <option value="polo" ${user.avatar?.clothes === 'polo' ? 'selected' : ''}>Polo</option>
            </select>
          </div>

          <div class="avatar-field" style="grid-column: span 2;">
            <label>Special Accessory</label>
            <select id="avAccessory" onchange="previewUserAvatar()">
              <option value="glasses" ${user.avatar?.accessory === 'glasses' ? 'selected' : ''}>Study Glasses</option>
              <option value="headphones" ${user.avatar?.accessory === 'headphones' ? 'selected' : ''}>Gamer Headphones</option>
              <option value="star" ${user.avatar?.accessory === 'star' ? 'selected' : ''}>Merit Star</option>
              <option value="none" ${user.avatar?.accessory === 'none' ? 'selected' : ''}>No accessory</option>
            </select>
          </div>
        </div>

        <button class="btn-primary" style="width:100%;" onclick="saveUserAvatar()">
          💾 Save My Avatar
        </button>
      </div>
    </div>
  `;
}

// Previsualización y guardado de avatar
function previewUserAvatar() {
  const skin = document.getElementById('avSkin')?.value || '#ffd1a4';
  const hair = document.getElementById('avHair')?.value || 'short';
  const hairColor = document.getElementById('avHairColor')?.value || '#334155';
  const clothes = document.getElementById('avClothes')?.value || 'tshirt';
  const clothesColor = '#0284c7';
  const expression = 'smile';
  const accessory = document.getElementById('avAccessory')?.value || 'none';

  const avatarConfig = { skin, hair, hairColor, clothes, clothesColor, expression, accessory };
  const svg = generateAvatarSvg(avatarConfig, 130);

  const tStage = document.getElementById('teacherAvatarStage');
  const sStage = document.getElementById('studentAvatarStage');
  if (tStage) tStage.innerHTML = svg;
  if (sStage) sStage.innerHTML = svg;
}

function saveUserAvatar() {
  const skin = document.getElementById('avSkin')?.value || '#ffd1a4';
  const hair = document.getElementById('avHair')?.value || 'short';
  const hairColor = document.getElementById('avHairColor')?.value || '#334155';
  const clothes = document.getElementById('avClothes')?.value || 'tshirt';
  const clothesColor = '#0284c7';
  const expression = 'smile';
  const accessory = document.getElementById('avAccessory')?.value || 'none';

  const newAvatar = { skin, hair, hairColor, clothes, clothesColor, expression, accessory };
  state.updateCurrentUserProfile({ avatar: newAvatar });
  showToast('Avatar updated and saved!', 'success');
  renderApp();
}

// =============================================================================
// 9. MODALES DE OPERACIÓN (CREAR EXAMEN, ENVIAR DUELO, TUTORÍAS, ENTREGAS)
// =============================================================================

// Modal: Crear Examen Personalizado (Docentes)
function openCreateExamModal() {
  const select = document.getElementById('examGradeSelect');
  if (select) select.value = state.activeGrade;
  populateSubjectDropdown('examSubjectSelect', state.activeGrade);
  const customInput = document.getElementById('examSubjectCustomInput');
  if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }

  const list = document.getElementById('examQuestionsListContainer');
  if (list) {
    list.innerHTML = `
      <div class="exam-question-item-card">
        <label style="font-weight:700; font-size:0.85rem; color:var(--navy);">Question #1:</label>
        <input type="text" class="form-control exam-q-text" placeholder="What is the question?" style="margin-bottom:0.5rem;" required />
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">Answer options (Mark which one is correct):</div>
        
        <div class="exam-option-radio-row">
          <input type="radio" name="correct_0" value="0" checked />
          <input type="text" class="form-control exam-opt-0" placeholder="Option A (Correct by default)" required />
        </div>
        <div class="exam-option-radio-row">
          <input type="radio" name="correct_0" value="1" />
          <input type="text" class="form-control exam-opt-1" placeholder="Option B" required />
        </div>
        <div class="exam-option-radio-row">
          <input type="radio" name="correct_0" value="2" />
          <input type="text" class="form-control exam-opt-2" placeholder="Option C" required />
        </div>
        <div class="exam-option-radio-row">
          <input type="radio" name="correct_0" value="3" />
          <input type="text" class="form-control exam-opt-3" placeholder="Option D" required />
        </div>
      </div>
    `;
  }
  const modal = document.getElementById('createExamModal');
  if (modal) modal.classList.add('active');
}

function closeCreateExamModal() {
  const modal = document.getElementById('createExamModal');
  if (modal) modal.classList.remove('active');
}

function addQuestionFieldToExam() {
  const list = document.getElementById('examQuestionsListContainer');
  if (!list) return;
  const count = list.children.length;

  const div = document.createElement('div');
  div.className = 'exam-question-item-card';
  div.innerHTML = `
    <label style="font-weight:700; font-size:0.85rem; color:var(--navy);">Question #${count + 1}:</label>
    <input type="text" class="form-control exam-q-text" placeholder="Write the question..." style="margin-bottom:0.5rem;" required />
    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">Answer options:</div>
    
    <div class="exam-option-radio-row">
      <input type="radio" name="correct_${count}" value="0" checked />
      <input type="text" class="form-control exam-opt-0" placeholder="Option A (Correct)" required />
    </div>
    <div class="exam-option-radio-row">
      <input type="radio" name="correct_${count}" value="1" />
      <input type="text" class="form-control exam-opt-1" placeholder="Option B" required />
    </div>
    <div class="exam-option-radio-row">
      <input type="radio" name="correct_${count}" value="2" />
      <input type="text" class="form-control exam-opt-2" placeholder="Option C" required />
    </div>
    <div class="exam-option-radio-row">
      <input type="radio" name="correct_${count}" value="3" />
      <input type="text" class="form-control exam-opt-3" placeholder="Option D" required />
    </div>
  `;
  list.appendChild(div);
}

function handleCreateExamSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('examTitleInput').value.trim();
  const grade = document.getElementById('examGradeSelect').value;
  const subject = getSelectedSubjectValue('examSubjectSelect', 'examSubjectCustomInput');
  const instructions = document.getElementById('examDescInput').value.trim();

  const questionCards = document.querySelectorAll('#examQuestionsListContainer .exam-question-item-card');
  const questions = [];

  questionCards.forEach((card, idx) => {
    const qText = card.querySelector('.exam-q-text')?.value.trim();
    const opt0 = card.querySelector('.exam-opt-0')?.value.trim();
    const opt1 = card.querySelector('.exam-opt-1')?.value.trim();
    const opt2 = card.querySelector('.exam-opt-2')?.value.trim();
    const opt3 = card.querySelector('.exam-opt-3')?.value.trim();
    const correctVal = card.querySelector(`input[name="correct_${idx}"]:checked`)?.value || '0';

    if (qText && opt0 && opt1) {
      questions.push({
        text: qText,
        options: [opt0, opt1, opt2 || 'Other', opt3 || 'None'],
        correct: parseInt(correctVal),
        points: 25
      });
    }
  });

  if (questions.length === 0) {
    showToast('Add at least one complete question to the exam.', 'warning');
    return;
  }

  const newExam = {
    id: 'exam-' + Date.now(),
    title,
    subject,
    grade: String(grade),
    instructions,
    questions,
    createdBy: state.currentUser.name
  };

  const exams = state.getExams();
  exams.unshift(newExam);
  state.saveExams(exams);

  closeCreateExamModal();
  showToast(`Exam \"${title}\" published for Grade ${grade}`, 'success');
  renderApp();
}

// Modal: Invitar a Competir a un Compañero (Estudiantes)
function openInviteDuelModal() {
  const grade = state.currentUser.grade || '5';
  const classmates = state.getStudentsByGrade(grade).filter(s => s.email !== state.currentUser.email);
  const select = document.getElementById('duelOpponentSelect');

  if (select) {
    if (classmates.length === 0) {
      select.innerHTML = '<option value="">There are no other classmates registered in your grade</option>';
    } else {
      select.innerHTML = classmates.map(c => `
        <option value="${c.email}|${c.name}">${c.name} (${c.level || 'Apprentice'})</option>
      `).join('');
    }
  }

  const modal = document.getElementById('inviteDuelModal');
  if (modal) modal.classList.add('active');
}

function closeInviteDuelModal() {
  const modal = document.getElementById('inviteDuelModal');
  if (modal) modal.classList.remove('active');
}

function handleSendDuelInviteSubmit(e) {
  e.preventDefault();
  const selectVal = document.getElementById('duelOpponentSelect')?.value;
  const topic = document.getElementById('duelTopicSelect')?.value;

  if (!selectVal) {
    showToast('Select a classmate to invite them.', 'warning');
    return;
  }

  const [oppEmail, oppName] = selectVal.split('|');
  const user = state.currentUser;

  const newDuel = {
    id: 'duel-' + Date.now(),
    grade: String(user.grade),
    challengerName: user.name,
    challengerEmail: user.email,
    opponentName: oppName,
    opponentEmail: oppEmail,
    topic,
    status: 'pending',
    challengerScore: 85,
    opponentScore: 0,
    winner: null
  };

  const duels = state.getDuels();
  duels.unshift(newDuel);
  state.saveDuels(duels);

  closeInviteDuelModal();
  showToast(`Competition invitation sent to ${oppName}!`, 'success');
  renderApp();
}

// Modal: Crear Sesión de Tutoría (Estudiantes o Tutor)
function openCreateTutoringModal() {
  const grade = state.currentUser?.grade || state.activeGrade;
  populateSubjectDropdown('tutorSessionSubjectSelect', grade);
  const custom = document.getElementById('tutorSessionCustomInput');
  if (custom) { custom.style.display = 'none'; custom.value = ''; }
  const modal = document.getElementById('createTutoringModal');
  if (modal) modal.classList.add('active');
}

function closeCreateTutoringModal() {
  const modal = document.getElementById('createTutoringModal');
  if (modal) modal.classList.remove('active');
}

function handleCreateTutoringSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('tutorSessionTitle').value.trim();
  const subject = getSelectedSubjectValue('tutorSessionSubjectSelect', 'tutorSessionCustomInput');
  const time = document.getElementById('tutorSessionTime').value;
  const desc = document.getElementById('tutorSessionDesc').value.trim();
  const user = state.currentUser;

  const newTutoring = {
    id: 'tut-' + Date.now(),
    title,
    subject,
    grade: String(user.grade || state.activeGrade),
    hostName: user.name,
    hostEmail: user.email,
    time: time.replace('T', ' '),
    desc,
    attendees: [user.name]
  };

  const tutorings = state.getTutorings();
  tutorings.unshift(newTutoring);
  state.saveTutorings(tutorings);

  state.addPointsAndStars(20, 2);
  closeCreateTutoringModal();
  showToast(`Tutoring session created and invitation sent to the whole class!`, 'success');
  renderApp();
}

// Modales de Tareas, Asignar Tutor y Subida de Fotos
let activeTaskToSubmitId = null;
let uploadedPhotoDataUrl = null;

function openSubmitHomeworkModal(taskId) {
  const tasks = state.getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  activeTaskToSubmitId = taskId;
  uploadedPhotoDataUrl = null;

  document.getElementById('submitTaskTitle').textContent = task.title;
  document.getElementById('submitTaskSubject').textContent = `${task.subject} • Grade ${task.grade}`;
  document.getElementById('submitTaskComments').value = '';

  const previewBox = document.getElementById('homeworkPhotoPreview');
  if (previewBox) {
    previewBox.style.display = 'none';
    previewBox.innerHTML = '';
  }

  const existing = task.submissions?.find(s => s.studentEmail === state.currentUser.email);
  if (existing) {
    document.getElementById('submitTaskComments').value = existing.comments || '';
    if (existing.photoUrl) {
      uploadedPhotoDataUrl = existing.photoUrl;
      previewBox.style.display = 'flex';
      previewBox.innerHTML = `<img src="${existing.photoUrl}" alt="Previous evidence" />`;
    }
  }

  const modal = document.getElementById('submitHomeworkModal');
  if (modal) modal.classList.add('active');
}

function closeSubmitHomeworkModal() {
  const modal = document.getElementById('submitHomeworkModal');
  if (modal) modal.classList.remove('active');
  activeTaskToSubmitId = null;
  uploadedPhotoDataUrl = null;
}

function handlePhotoUploadChange(event, previewId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedPhotoDataUrl = e.target.result;
    const preview = document.getElementById(previewId);
    if (preview) {
      preview.style.display = 'flex';
      preview.innerHTML = `<img src="${uploadedPhotoDataUrl}" alt="Uploaded photo" />`;
    }
    showToast('Photo uploaded successfully.', 'success');
  };
  reader.readAsDataURL(file);
}

function handleSubmitHomework(e) {
  e.preventDefault();
  if (!activeTaskToSubmitId) return;

  const comments = document.getElementById('submitTaskComments').value.trim();
  const tasks = state.getTasks();
  const task = tasks.find(t => t.id === activeTaskToSubmitId);
  if (!task) return;

  const user = state.currentUser;
  if (!task.submissions) task.submissions = [];

  const existingIdx = task.submissions.findIndex(s => s.studentEmail === user.email);
  const subData = {
    studentEmail: user.email,
    studentName: user.name,
    date: new Date().toLocaleDateString('en-US'),
    photoUrl: uploadedPhotoDataUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80',
    comments: comments || 'Submission with attached evidence.',
    gradeMark: '',
    feedback: '',
    reviewed: false
  };

  if (existingIdx !== -1) task.submissions[existingIdx] = subData;
  else task.submissions.push(subData);

  state.saveTasks(tasks);

  closeSubmitHomeworkModal();
  showToast('Homework and photo sent! Your teacher will review your work and give you the score.', 'success');
  renderApp();
}

// Modal: Nueva Tarea Docente
function openNewTaskModal() {
  const modal = document.getElementById('newTaskModal');
  const gradeSelect = document.getElementById('taskGradeSelect');
  if (gradeSelect) gradeSelect.value = state.activeGrade;
  populateSubjectDropdown('taskSubjectSelect', state.activeGrade);
  const customInput = document.getElementById('taskSubjectCustomInput');
  if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
  if (modal) modal.classList.add('active');
}

function closeNewTaskModal() {
  const modal = document.getElementById('newTaskModal');
  if (modal) modal.classList.remove('active');
}

function handleCreateTaskSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('taskTitleInput').value.trim();
  const grade = document.getElementById('taskGradeSelect').value;
  const subject = getSelectedSubjectValue('taskSubjectSelect', 'taskSubjectCustomInput');
  const dueDate = document.getElementById('taskDueDateInput').value;
  const points = parseInt(document.getElementById('taskPointsInput').value) || 50;
  const description = document.getElementById('taskDescInput').value.trim();

  const newTask = {
    id: 'task-' + Date.now(),
    title,
    subject,
    grade: String(grade),
    dueDate,
    points,
    description,
    createdBy: state.currentUser.name,
    submissions: []
  };

  const tasks = state.getTasks();
  tasks.unshift(newTask);
  state.saveTasks(tasks);

  closeNewTaskModal();
  state.activeGrade = String(grade);
  showToast(`Homework created for Grade ${grade}`, 'success');
  renderApp();
}

// Modal: Cambiar Grado de Tarea
let taskToUpdateGradeId = null;

function openEditTaskGradeModal(taskId) {
  const tasks = state.getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  taskToUpdateGradeId = taskId;
  document.getElementById('editGradeTaskTitle').textContent = task.title;
  document.getElementById('editTaskGradeSelect').value = task.grade;

  const modal = document.getElementById('editTaskGradeModal');
  if (modal) modal.classList.add('active');
}

function closeEditTaskGradeModal() {
  const modal = document.getElementById('editTaskGradeModal');
  if (modal) modal.classList.remove('active');
  taskToUpdateGradeId = null;
}

function handleUpdateTaskGradeSubmit(e) {
  e.preventDefault();
  if (!taskToUpdateGradeId) return;

  const newGrade = document.getElementById('editTaskGradeSelect').value;
  const tasks = state.getTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskToUpdateGradeId);

  if (taskIndex !== -1) {
    const prev = tasks[taskIndex].grade;
    tasks[taskIndex].grade = String(newGrade);
    state.saveTasks(tasks);
    showToast(`Homework grade updated from ${prev} to Grade ${newGrade}`, 'success');
  }

  closeEditTaskGradeModal();
  renderApp();
}

// Modal: Asignar Tutor del Grado
function openAssignTutorModal() {
  const grade = state.activeGrade;
  const students = state.getStudentsByGrade(grade);
  const select = document.getElementById('tutorStudentSelect');
  const label = document.getElementById('assignTutorGradeLabel');

  if (label) label.textContent = `Grade ${grade}`;
  if (select) {
    if (students.length === 0) {
      select.innerHTML = '<option value="">There are no registered students</option>';
    } else {
      select.innerHTML = students.map(s => `
        <option value="${s.email}" ${s.isTutor ? 'selected' : ''}>${s.name} (${s.email}) - ${s.level || 'Apprentice'} [${s.points} pts]</option>
      `).join('');
    }
  }

  const modal = document.getElementById('assignTutorModal');
  if (modal) modal.classList.add('active');
}

function closeAssignTutorModal() {
  const modal = document.getElementById('assignTutorModal');
  if (modal) modal.classList.remove('active');
}

function handleAssignTutorSubmit(e) {
  e.preventDefault();
  const grade = state.activeGrade;
  const email = document.getElementById('tutorStudentSelect').value;

  if (!email) return;
  state.setTutorForGrade(grade, email);
  const assigned = state.getStudents().find(s => s.email === email);
  showToast(`${assigned?.name} appointed official Tutor of Grade ${grade}`, 'success');

  closeAssignTutorModal();
  renderApp();
}

function setTutorDirect(email) {
  state.setTutorForGrade(state.activeGrade, email);
  const std = state.getStudents().find(s => s.email === email);
  showToast(`${std?.name || 'Student'} assigned as Grade Tutor!`, 'success');
  renderApp();
}

// Inscribir Alumno a un Grado
function openAddStudentModal() {
  document.getElementById('newStdGradeSelect').value = state.activeGrade;
  document.getElementById('newStdNameInput').value = '';
  document.getElementById('newStdEmailInput').value = '';
  const modal = document.getElementById('addStudentModal');
  if (modal) modal.classList.add('active');
}

function closeAddStudentModal() {
  const modal = document.getElementById('addStudentModal');
  if (modal) modal.classList.remove('active');
}

function handleAddStudentSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newStdNameInput').value.trim();
  const email = document.getElementById('newStdEmailInput').value.trim().toLowerCase();
  const grade = document.getElementById('newStdGradeSelect').value;

  if (!name || !email) return;
  const students = state.getStudents();
  if (students.some(s => s.email === email)) {
    showToast('A student with that email already exists.', 'warning');
    return;
  }

  students.push({
    id: 'std-' + Date.now(),
    name,
    email,
    grade: String(grade),
    points: 0,
    stars: 0,
    level: 'Apprentice',
    isTutor: false,
    avatar: { skin: '#ffd1a4', hair: 'short', hairColor: '#1e293b', clothes: 'hoodie', clothesColor: '#0284c7', expression: 'smile', accessory: 'none' }
  });
  state.saveStudents(students);

  closeAddStudentModal();
  showToast(`Student ${name} enrolled in Grade ${grade}`, 'success');
  renderApp();
}

// =============================================================================
// 9. MANEJADORES DE SERVICIOS Y MODALES INSTITUCIONALES (SmartClass )
// =============================================================================

function closeModalService(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// 9.1 Planes Curriculares Oficiales por Grado (1° a 11°)
function openModalPlanesCurriculares() {
  const grade = state.currentUser?.grade || state.activeGrade || '5';
  const subjects = getSubjectsForGrade(grade);
  const title = document.getElementById('curriculumModalTitle');
  const body = document.getElementById('curriculumModalBody');

  if (title) title.textContent = `Official Curriculum Plan - Grade ${grade}${parseInt(grade) <= 5 ? 'Primary School' : parseInt(grade) <= 9 ? 'Middle School' : 'Vocational High School'})`;

  if (body) {
    body.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.85rem;">
        <strong>Total Official Subjects:</strong> ${subjects.length} current subjects adapted to the Ministry of Education's curriculum and SmartClass.
      </div>

      <table class="curriculum-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Subject / Area</th>
            <th>Weekly Hours</th>
            <th>Teacher in Charge</th>
            <th>Key Skill</th>
          </tr>
        </thead>
        <tbody>
          ${subjects.map((s, idx) => `
            <tr>
              <td><strong>${idx + 1}</strong></td>
              <td><span style="font-weight:700; color:var(--navy);">${s}</span></td>
              <td>4 Hours / Wk.</td>
              <td>SmartClass Head Teacher</td>
              <td>Analytical, conceptual and practical development</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const modal = document.getElementById('modalPlanesCurriculares');
  if (modal) modal.classList.add('active');
}

// 9.2 Horario de Clases Semanal
function openModalHorarioClases() {
  const grade = state.currentUser?.grade || state.activeGrade || '5';
  const subjects = getSubjectsForGrade(grade);
  const title = document.getElementById('scheduleModalTitle');
  const body = document.getElementById('scheduleModalBody');

  if (title) title.textContent = `Weekly Class Schedule - Grade ${grade}`;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = [
    '07:00 - 08:30 AM',
    '08:30 - 10:00 AM',
    '10:00 - 10:30 AM (Break)',
    '10:30 - 12:00 PM',
    '12:00 - 01:30 PM'
  ];

  if (body) {
    body.innerHTML = `
      <table class="schedule-grid-table">
        <thead>
          <tr>
            <th>Schedule</th>
            ${days.map(d => `<th>${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${hours.map((h, hIdx) => {
            if (hIdx === 2) {
              return `
                <tr style="background:#fffbeb; font-weight:800; color:#b45309;">
                  <td>${h}</td>
                  <td colspan="5">🥪 Recess / Pedagogical Break and Meals</td>
                </tr>
              `;
            }
            return `
              <tr>
                <td style="font-weight:700; background:#f8fafc;">${h}</td>
                ${days.map((d, dIdx) => {
                  const s = subjects[(hIdx + dIdx) % subjects.length];
                  return `<td><span class="task-subject-tag" style="display:inline-block; max-width:130px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s}</span></td>`;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  const modal = document.getElementById('modalHorario');
  if (modal) modal.classList.add('active');
}

// 9.3 Horario de Exámenes Oficiales
function openModalHorarioExamenes() {
  const grade = state.currentUser?.grade || state.activeGrade || '5';
  const exams = state.getExamsByGrade(grade);
  const title = document.getElementById('scheduleModalTitle');
  const body = document.getElementById('scheduleModalBody');

  if (title) title.textContent = `Official Exams Calendar - Grade ${grade}`;

  if (body) {
    body.innerHTML = `
      <div style="background:#fffbeb; border:1px solid #fde047; padding:0.85rem 1rem; border-radius:var(--radius-sm); margin-bottom:1rem; font-size:0.85rem; color:#92400e;">
        📌 <strong>Dates and deadlines of assessments:</strong> Remember that you can open and solve your exams at any time before the due date.
      </div>

      <table class="gradebook-table">
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Subject</th>
            <th>Due Date</th>
            <th>Questions</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${exams.map(e => `
            <tr>
              <td><strong>${e.title}</strong></td>
              <td><span class="task-subject-tag">${e.subject}</span></td>
              <td>${e.dueDate || '2026-11-25'}</td>
              <td>${e.questions ? e.questions.length : 0} questions</td>
              <td>
                <button class="btn-primary btn-sm" onclick="closeModalService('modalHorario'); switchSection('examenes');">
                  View Exam
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const modal = document.getElementById('modalHorario');
  if (modal) modal.classList.add('active');
}

// 9.4 Registro de Calificaciones Histórico
function openModalRegistroCalificaciones() {
  switchSection('calificaciones');
}

// 9.5 Solicitudes de Certificados
function openModalCertificados() {
  const modal = document.getElementById('modalCertificados');
  if (modal) modal.classList.add('active');
}

function generateStudentCertificate() {
  const user = state.currentUser;
  const grade = user?.grade || '5';
  const type = document.getElementById('certTypeSelect')?.value || 'estudio';
  const dest = document.getElementById('certDestInput')?.value.trim() || 'To whom it may concern';

  const certNames = {
    estudio: 'OFFICIAL STUDY CERTIFICATE',
    matricula: 'ACTIVE ENROLLMENT CONFIRMATION',
    calificaciones: 'PARTIAL GRADES CERTIFICATE',
    pazysalvo: 'ACADEMIC GOOD-STANDING CERTIFICATE'
  };

  const titleCert = certNames[type] || 'ACADEMIC CERTIFICATE';
  const radicado = 'SmartClass-' + Math.floor(100000 + Math.random() * 900000);

  const doc = `======================================================================
SMARTCLASS - SmartClass
ACADEMIC AND ADMISSIONS REGISTRAR
DIGITAL FILE NUMBER: ${radicado}
======================================================================

${titleCert}

THE UNDERSIGNED ACADEMIC REGISTRAR OF SMARTCLASS
HEREBY CERTIFIES THAT:

The student: ${user?.name || 'Student'}
Identified with institutional email: ${user?.email || ''}
Is formally enrolled and active in:
LEVEL / GRADE: Grade ${grade}${parseInt(grade) <= 5 ? 'Primary Education' : parseInt(grade) <= 9 ? 'Middle School Education' : 'Technical High School Education'})
CURRENT SCHOOL YEAR: 2026 - Regular Term

OBSERVATIONS:
The student shows exemplary academic performance and is up to date
with their assessment duties and interactive platforms at SmartClass.

Destination: ${dest}
Issued at the request of the interested party in the city of Santa Marta, on ${new Date().toLocaleDateString('en-US')}.

Authorized Digital Signature:
Dr. Alberto Mendoza R.
General Secretary and Principal, SmartClass
======================================================================`;

  const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Certificate_${user?.name.replace(/\s+/g, '_')}_${radicado}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  closeModalService('modalCertificados');
  showToast(`${titleCert} generated successfully! File number: ${radicado}`, 'success');
}

// 9.6 Solicitudes Académicas y Apelaciones
function openModalSolicitudesAcademicas() {
  openModalPQR();
}

function openModalApelaciones() {
  openModalPQR();
}

// 9.7 PQR
function openModalPQR() {
  const modal = document.getElementById('modalPQR');
  if (modal) modal.classList.add('active');
}

function handlePQRSubmit(e) {
  e.preventDefault();
  const radicado = 'PQR-' + Math.floor(10000 + Math.random() * 90000);
  const subject = document.getElementById('pqrSubjectInput')?.value || 'Inquiry';

  closeModalService('modalPQR');
  showToast(`Request filed successfully! Case number: ${radicado}. We will answer you soon.`, 'success');
}

// 9.8 Cartera y Paz y Salvo
function openModalCartera() {
  const user = state.currentUser;
  const grade = user?.grade || '5';
  const body = document.getElementById('carteraModalBody');

  if (body) {
    body.innerHTML = `
      <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:var(--radius-md); padding:1.25rem; text-align:center; margin-bottom:1.25rem;">
        <div style="font-size:2.5rem; margin-bottom:0.25rem;">✅</div>
        <h3 style="color:#166534; font-size:1.25rem; font-weight:900;">ACADEMIC AND FINANCIAL GOOD STANDING</h3>
        <p style="color:#15803d; font-size:0.85rem; margin-top:0.25rem;">The student is up to date with the tuition of Grade ${grade} school year 2026.</p>
      </div>

      <table class="curriculum-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Period</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Regular Tuition Grade ${grade}</td>
            <td>2026 - Semester I</td>
            <td>$0.00 (Merit Scholarship)</td>
            <td><span class="submission-status-badge submitted">Paid</span></td>
          </tr>
          <tr>
            <td>Student Insurance and Digital ID</td>
            <td>2026 - Annual</td>
            <td>$35,000</td>
            <td><span class="submission-status-badge submitted">Paid</span></td>
          </tr>
          <tr>
            <td>SmartClass Virtual Platform and Labs</td>
            <td>2026 - Annual</td>
            <td>$0.00 (Included)</td>
            <td><span class="submission-status-badge submitted">Active</span></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const modal = document.getElementById('modalCartera');
  if (modal) modal.classList.add('active');
}

// 9.9 Solicitud de Mantenimiento
function openModalMantenimiento() {
  showToast('SmartClass Technical Support: Platforms and servers are 100% operational.', 'success');
}

// 9.10 Evaluación Docente
function openModalEvaluacionDocente() {
  const modal = document.getElementById('modalEvaluacionDocente');
  if (modal) modal.classList.add('active');
}

function handleTeacherEvaluationSubmit(e) {
  e.preventDefault();
  closeModalService('modalEvaluacionDocente');
  showToast('⭐ Teacher evaluation sent! Thank you for contributing to educational quality.', 'success');
  renderApp();
}

function openModalEncuestaEon() {
  openModalEvaluacionDocente();
}

// 9.11 Apuntes Compartidos
function openModalBiblioteca() {
  const grade = state.currentUser?.grade || state.activeGrade || '5';
  const subjects = getSubjectsForGrade(grade);
  const body = document.getElementById('bibliotecaModalBody');

  if (body) {
    body.innerHTML = `
      <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1rem;">
        Reading resources, digital books and shared summaries for Grade ${grade}
      </p>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;" class="topic-grid-responsive">
        ${subjects.slice(0, 6).map((s, idx) => `
          <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:var(--radius-sm); padding:0.85rem 1rem;">
            <div style="font-size:1.4rem; margin-bottom:0.25rem;">📕</div>
            <strong style="color:var(--navy); font-size:0.95rem; display:block;">Study Guide of ${s}</strong>
            <span style="font-size:0.75rem; color:#64748b;">Official SmartClass Guide Text • 120 pages (PDF)</span>
            <div style="margin-top:0.6rem;">
              <button class="btn-secondary btn-sm" onclick="showToast('Opening reading resource for ${s}...', 'info')">
                📖 Read Digital Book
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const modal = document.getElementById('modalBiblioteca');
  if (modal) modal.classList.add('active');
}

// 9.12 Mi Cuenta: Actualizar Datos y Contraseña
function openModalActualizarDatos() {
  const user = state.currentUser;
  const nameEl = document.getElementById('profileModalName');
  const emailEl = document.getElementById('profileModalEmail');

  if (nameEl) nameEl.value = user?.name || '';
  if (emailEl) emailEl.value = user?.email || '';

  const modal = document.getElementById('modalActualizarDatos');
  if (modal) modal.classList.add('active');
}

function handleUpdateProfileDataSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('profileModalName')?.value.trim();

  if (name && state.currentUser) {
    state.currentUser.name = name;
    state.save(STORAGE_KEYS.CURRENT_USER, state.currentUser);

    const students = state.getStudents();
    const std = students.find(s => s.email === state.currentUser.email);
    if (std) {
      std.name = name;
      state.saveStudents(students);
    }

    closeModalService('modalActualizarDatos');
    showToast('Profile data updated successfully!', 'success');
    renderApp();
  }
}

function openModalCambiarPassword() {
  const newPass = prompt('Type your new SmartClass access password:');
  if (newPass && newPass.trim().length >= 4) {
    showToast('🔑 Password updated successfully!', 'success');
  } else if (newPass !== null) {
    showToast('The password must be at least 4 characters long.', 'warning');
  }
}

// 9.13 Otras Opciones (Curriculum, Etapa Práctica, Modalidad de Grado)
function openModalCurriculum() {
  const user = state.currentUser;
  showToast(`Academic Resume of ${user?.name} (Grade ${user?.grade}): Average and achievements recorded in SmartClass.`, 'info');
}

function openModalEtapaPractica() {
  showToast('Internship Stage and Apprenticeship Agreements available for Technical High School students (Grades 10 and 11).', 'info');
}

function openModalModalidadGrado() {
  showToast('SmartClass Graduation Modalities: Research Project, Monograph or School Thesis.', 'info');
}

// Visor de Foto Ampliada
function viewPhotoFullscreen(url) {
  const modal = document.getElementById('photoViewerModal');
  const img = document.getElementById('fullscreenPhotoImg');
  if (img) img.src = url;
  if (modal) modal.classList.add('active');
}

function closePhotoViewerModal() {
  const modal = document.getElementById('photoViewerModal');
  if (modal) modal.classList.remove('active');
}

// =============================================================================
// 10. INICIALIZACIÓN
// =============================================================================

window.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
