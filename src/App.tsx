import { useEffect, useState } from 'react';
import { ArrowRight, Award, BarChart3, BookOpen, CheckCircle2, ChevronRight, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Plus, ShieldCheck, Trash2, Trophy, Users, X } from 'lucide-react';

type Role = 'student' | 'admin';
type Screen = 'login' | 'student' | 'exam' | 'flashcards' | 'result' | 'admin';
type User = { id: string; name: string; email: string; role: Role; className?: string };
type Exam = { id: string; title: string; unit: string; duration: number; published: boolean };
type Question = { id: string; text: string; options: string[]; correctIndex?: number; kind?: 'quiz' | 'flashcard'; answer?: string };
type Attempt = { id: string; student: string; exam: string; score: number; total: number; submittedAt: string };
type Student = { id: string; name: string; email: string; className?: string };

const demoAdmin = { password: 'admin123' };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || payload?.message || 'Request failed');
  return payload as T;
}

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('student');
  const [studentName, setStudentName] = useState('');
  const [teacherCode, setTeacherCode] = useState(demoAdmin.password);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  useEffect(() => {
    window.history.replaceState({ screen: 'login' }, '', window.location.href);
    const handlePopState = (event: PopStateEvent) => {
      const nextScreen = event.state?.screen as Screen | undefined;
      if (nextScreen) setScreen(nextScreen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextScreen: Screen) => {
    window.history.pushState({ screen: nextScreen }, '', window.location.href);
    setScreen(nextScreen);
  };

  const login = async () => {
    setErrorMessage('');
    try {
      if (role === 'student' && !studentName.trim()) {
        setErrorMessage('Please enter your name.');
        return;
      }
      const data = await request<{ user: User }>('/api/login', { method: 'POST', body: JSON.stringify(role === 'student' ? { role, name: studentName } : { role, code: teacherCode }) });
      setUser(data.user);
      navigate(data.user.role === 'admin' ? 'admin' : 'student');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(role === 'student'
        ? (message.toLowerCase().includes('valid name') ? 'Please use a real student name. Obscene or inappropriate names are not allowed.' : 'Could not enter Grade 7B. Please check your name and try again.')
        : 'The teacher code is not correct.');
    }
  };

  const logout = () => {
    setUser(null);
    window.history.replaceState({ screen: 'login' }, '', window.location.href);
    setScreen('login');
    setErrorMessage('');
  };

  if (screen === 'login') {
    return (
      <Login
        role={role}
        setRole={next => {
          setRole(next);
          setStudentName('');
          setTeacherCode(demoAdmin.password);
        }}
        studentName={studentName}
        teacherCode={teacherCode}
        setStudentName={setStudentName}
        setTeacherCode={setTeacherCode}
        error={errorMessage}
        onLogin={login}
      />
    );
  }

  if (screen === 'student' && user) {
    return <StudentDashboard user={user} onLogout={logout} onStart={exam => { setSelectedExam(exam); navigate('exam'); }} onStudy={exam => { setSelectedExam(exam); navigate('flashcards'); }} />;
  }

  if (screen === 'exam' && user && selectedExam) {
    return <ExamPage user={user} exam={selectedExam} onBack={() => navigate('student')} onResult={r => { setResult(r); navigate('result'); }} />;
  }

  if (screen === 'flashcards' && user && selectedExam) {
    return <FlashcardPage exam={selectedExam} onBack={() => navigate('student')} />;
  }

  if (screen === 'result' && result && user) {
    return <Result user={user} result={result} onBack={() => navigate('student')} />;
  }

  if (screen === 'admin' && user) {
    return <AdminDashboard onLogout={logout} />;
  }

  return null;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'brand brand-compact' : 'brand'}>
      <div className="brand-mark"><img src="/resources/barakat-logo.svg" alt="Barakat Language Schools" /></div>
      <div className="brand-copy">
        <div className="brand-name">Barakat Language Schools</div>
      </div>
    </div>
  );
}

function Login({ role, setRole, studentName, teacherCode, setStudentName, setTeacherCode, error, onLogin }: {
  role: Role;
  setRole: (r: Role) => void;
  studentName: string;
  teacherCode: string;
  setStudentName: (v: string) => void;
  setTeacherCode: (v: string) => void;
  error: string;
  onLogin: () => void;
}) {
  return (
    <main className="auth-page">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <header className="topbar auth-topbar">
        <Brand />
        <div className="topbar-badge"><ShieldCheck size={16} /> Grade 7B</div>
      </header>

      <section className="auth-content">
        <div className="auth-copy">
          <span className="eyebrow">GRADE 7B • ENGLISH</span>
          <h1>Practice with purpose.<br /><em>Grow with every quiz.</em></h1>
          <p>Welcome to your Grade 7B learning space. Complete your English quizzes, check your results, and keep building your skills.</p>
          <div className="feature-row">
            <div><CheckCircle2 size={18} /> Clear assessments</div>
            <div><Trophy size={18} /> Instant results</div>
            <div><Award size={18} /> Track progress</div>
          </div>
        </div>

        <section className="auth-card">
          <div className="card-kicker">{role === 'student' ? 'Student access' : 'Teacher access'}</div>
          <h2>{role === 'student' ? 'Welcome to Grade 7B' : 'Teacher login'}</h2>
          <p className="muted">{role === 'student' ? 'Sign in to see your quizzes and start learning.' : 'Manage Grade 7B exams, questions, students, and results.'}</p>

          <div className="role-switch">
            <button className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>Student</button>
            <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Teacher</button>
          </div>

          {role === 'student' ? (
            <label>Your name<input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Enter your name" /></label>
          ) : (
            <label>Teacher code<input type="password" value={teacherCode} onChange={e => setTeacherCode(e.target.value)} placeholder="Enter your private code" /></label>
          )}
          {error && <div className="error-box">{error}</div>}
          <button className="primary-btn full-btn" onClick={onLogin}>{role === 'student' ? 'Enter Grade 7B' : 'Open Teacher Dashboard'} <ArrowRight size={18} /></button>
          <div className="demo-note">{role === 'student' ? 'Students enter their name only. New students are registered automatically.' : 'Teacher access uses a private code.'}</div>
        </section>
      </section>

      <footer className="auth-footer">Barakat Language Schools <span>•</span> Grade 7B English</footer>
    </main>
  );
}

function StudentDashboard({ user, onLogout, onStart, onStudy }: { user: User; onLogout: () => void; onStart: (exam: Exam) => void; onStudy: (exam: Exam) => void }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<{ exams: Exam[] }>('/api/exams')
      .then(data => setExams(data.exams.filter(exam => exam.published)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="student-site">
      <header className="site-header">
        <Brand compact />
        <div className="header-actions"><span className="class-pill">Grade 7B</span><button className="ghost-btn" onClick={onLogout}><LogOut size={16} /> Sign out</button></div>
      </header>

      <main className="student-main">
        <section className="student-hero">
          <div>
            <span className="eyebrow">GRADE 7B • STUDENT SPACE</span>
            <h1>Good to see you,<br /><strong>{user.name}.</strong></h1>
            <p>Choose a quiz below and show what you have learned.</p>
          </div>
          <div className="hero-badge"><GraduationCap size={28} /><span>Grade 7B</span><small>English</small></div>
        </section>

        <section className="student-stats">
          <div><div className="stat-icon"><ClipboardList size={19} /></div><span>Available quizzes</span><strong>{exams.length}</strong></div>
          <div><div className="stat-icon"><Trophy size={19} /></div><span>Keep learning</span><strong>→</strong></div>
          <div><div className="stat-icon"><Award size={19} /></div><span>Your class</span><strong>7B</strong></div>
        </section>

        <section className="quiz-section">
          <div className="section-heading"><div><span className="section-label">YOUR QUIZZES</span><h2>Ready when you are.</h2></div><span className="quiz-count">{exams.length} available</span></div>
          {loading ? <div className="empty-state">Loading your quizzes...</div> : (
            <div className="quiz-grid">
              {exams.map(exam => (
                <article className="quiz-card" key={exam.id}>
                  <div className="quiz-card-top"><span className="unit-tag">{exam.unit}</span><span className="quiz-icon"><BookOpen size={20} /></span></div>
                  <h3>{exam.title}</h3>
                  <p>Complete this English assessment and see your result instantly.</p>
                  <div className="quiz-meta"><span>{exam.duration} min</span><span>•</span><span>Grade 7B</span></div>
                  <button className="primary-btn quiz-btn" onClick={() => onStart(exam)}>Start quiz <ChevronRight size={17} /></button>
                  <button className="ghost-btn quiz-study-btn" onClick={() => onStudy(exam)}>Study cards <BookOpen size={16} /></button>
                </article>
              ))}
            </div>
          )}
          {!loading && !exams.length && <div className="empty-state">No published quizzes yet. Your teacher will add one soon.</div>}
        </section>
      </main>
    </div>
  );
}

function ExamPage({ user, exam, onBack, onResult }: { user: User; exam: Exam; onBack: () => void; onResult: (r: { score: number; total: number; percentage: number }) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request<{ questions: Question[] }>(`/api/exams/${exam.id}/questions`).then(data => {
      const quizQuestions = data.questions.filter(question => (question.kind ?? 'quiz') === 'quiz');
      setQuestions(quizQuestions);
      setAnswers(Array(quizQuestions.length).fill(-1));
    });
  }, [exam.id]);

  const submit = async () => {
    setBusy(true);
    try {
      const data = await request<{ score: number; total: number; percentage: number }>('/api/attempts', { method: 'POST', body: JSON.stringify({ userId: user.id, examId: exam.id, answers }) });
      onResult(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="exam-page">
      <header className="exam-header">
        <Brand compact />
        <div className="exam-header-center"><span>{exam.unit}</span><strong>{exam.title}</strong></div>
        <button className="ghost-btn" onClick={onBack}>Exit</button>
      </header>
      <main className="exam-main">
        <div className="exam-intro"><span className="eyebrow">GRADE 7B • ENGLISH QUIZ</span><h1>{exam.title}</h1><p>{questions.length} questions • {exam.duration} minutes</p></div>
        <section className="questions-panel">
          {questions.map((question, index) => (
            <div className="question-block" key={question.id}>
              <div className="question-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="question-body"><h2>{question.text}</h2><div className="option-list">
                {question.options.map((option, optionIndex) => (
                  <button key={optionIndex} onClick={() => setAnswers(previous => previous.map((value, i) => i === index ? optionIndex : value))} className={answers[index] === optionIndex ? 'option selected' : 'option'}>
                    <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                  </button>
                ))}
              </div></div>
            </div>
          ))}
          {!questions.length && <div className="empty-state">This quiz has no questions yet.</div>}
          <button className="primary-btn submit-btn" disabled={busy || !questions.length} onClick={submit}>{busy ? 'Saving result...' : 'Submit quiz'} <ArrowRight size={18} /></button>
        </section>
      </main>
    </div>
  );
}

function FlashcardPage({ exam, onBack }: { exam: Exam; onBack: () => void }) {
  const [cards, setCards] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    request<{ questions: Question[] }>(`/api/exams/${exam.id}/questions`).then(data => {
      setCards(data.questions.filter(question => (question.kind ?? 'quiz') === 'flashcard'));
    });
  }, [exam.id]);

  const card = cards[index];
  return (
    <div className="exam-page">
      <header className="exam-header"><Brand compact /><div className="exam-header-center"><span>{exam.unit}</span><strong>Study cards</strong></div><button className="ghost-btn" onClick={onBack}>Back</button></header>
      <main className="exam-main">
        <div className="exam-intro"><span className="eyebrow">GRADE 7B • STUDY CARDS</span><h1>{exam.title}</h1><p>{cards.length ? `Card ${index + 1} of ${cards.length}` : 'Study cards'}</p></div>
        {!cards.length ? <div className="empty-state">No flashcards have been added to this quiz yet.</div> : (
          <section className="flashcard-panel">
            <button className="flashcard" onClick={() => setFlipped(value => !value)}>
              <span className="flashcard-label">{flipped ? 'ANSWER' : 'QUESTION'}</span>
              <strong>{flipped ? card.answer : card.text}</strong>
              <small>Click to flip</small>
            </button>
            <div className="flashcard-controls">
              <button className="ghost-btn" disabled={index === 0} onClick={() => { setIndex(value => value - 1); setFlipped(false); }}>Previous</button>
              <button className="primary-btn" disabled={index === cards.length - 1} onClick={() => { setIndex(value => value + 1); setFlipped(false); }}>Next <ChevronRight size={17} /></button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Result({ user, result, onBack }: { user: User; result: { score: number; total: number; percentage: number }; onBack: () => void }) {
  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-logo"><Brand compact /></div>
        <span className="eyebrow">GRADE 7B • RESULT</span>
        <div className="celebration" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <span key={'b' + i} className="balloon" />)}{Array.from({ length: 22 }, (_, i) => <span key={'c' + i} className="confetti-piece" />)}</div>
        <div className="result-trophy"><Trophy size={32} /></div>
        <span className="celebration-title">Great job!</span>
        <h1>Well done, {user.name}!</h1>
        <p>Your quiz has been submitted successfully.</p>
        <div className="score-ring"><strong>{result.percentage}%</strong><span>Score</span></div>
        <div className="result-grid"><div><strong>{result.score}</strong><span>Correct</span></div><div><strong>{Math.max(result.total - result.score, 0)}</strong><span>Wrong</span></div><div><strong>{result.total}</strong><span>Total</span></div></div>
        <button className="primary-btn full-btn" onClick={onBack}>Back to Grade 7B <ArrowRight size={18} /></button>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'dashboard' | 'students' | 'exams' | 'questions' | 'results'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modal, setModal] = useState<'student' | 'exam' | 'question' | null>(null);
  const [notice, setNotice] = useState('');
  const [confirmClearResults, setConfirmClearResults] = useState(false);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const refresh = async () => {
    const [studentsData, examsData, attemptsData] = await Promise.all([
      request<{ students: Student[] }>('/api/students'),
      request<{ exams: Exam[] }>('/api/exams'),
      request<{ attempts: Attempt[] }>('/api/attempts')
    ]);
    setStudents(studentsData.students);
    setExams(examsData.exams);
    setAttempts(attemptsData.attempts);
  };

  useEffect(() => { refresh(); }, []);

  const loadQuestions = async (examId: string) => {
    setSelectedExam(examId);
    if (examId) setQuestions((await request<{ questions: Question[] }>(`/api/exams/${examId}/questions`)).questions);
    else setQuestions([]);
  };

  const deleteStudent = async (id: string) => { await request(`/api/students/${id}`, { method: 'DELETE' }); setNotice('Student deleted'); refresh(); };
  const deleteExam = async (id: string) => { await request(`/api/exams/${id}`, { method: 'DELETE' }); setNotice('Quiz deleted'); refresh(); };
  const deleteQuestion = async (id: string) => { await request(`/api/questions/${id}`, { method: 'DELETE' }); if (selectedExam) loadQuestions(selectedExam); };
  const clearResults = async () => {
    await request('/api/attempts', { method: 'DELETE' });
    setConfirmClearResults(false);
    setNotice('All quiz results were cleared');
    refresh();
  };
  const openPreview = async (exam: Exam) => {
    const data = await request<{ questions: Question[] }>(`/api/exams/${exam.id}/questions`);
    setPreviewExam(exam);
    setPreviewQuestions(data.questions);
  };
  const setPublished = async (exam: Exam, published: boolean) => {
    await request(`/api/exams/${exam.id}`, { method: 'PUT', body: JSON.stringify({ published }) });
    setNotice(published ? 'Quiz published to students' : 'Quiz moved back to draft');
    refresh();
  };

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'exams', label: 'Quizzes', icon: <ClipboardList size={18} /> },
    { id: 'questions', label: 'Question Bank', icon: <BookOpen size={18} /> },
    { id: 'results', label: 'Results', icon: <BarChart3 size={18} /> }
  ] as const;

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Brand compact />
        <div className="admin-class-card"><span>ACTIVE CLASS</span><strong>Grade 7B</strong><small>English</small></div>
        <nav>{nav.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.icon}{item.label}</button>)}</nav>
        <button className="logout-link" onClick={onLogout}><LogOut size={17} /> Sign out</button>
      </aside>

      <section className="admin-content">
        <header className="admin-header"><div><span className="eyebrow">BARAKAT • GRADE 7B</span><h1>{nav.find(item => item.id === tab)?.label}</h1><p>Manage your Grade 7B English learning space.</p></div><div className="teacher-chip"><div>T</div><span>Teacher</span></div></header>
        {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}><X size={17} /></button></div>}

        {tab === 'dashboard' && <DashboardHome students={students} exams={exams} attempts={attempts} onStudents={() => setTab('students')} onExams={() => setTab('exams')} />}
        {tab === 'students' && <Manager title="Grade 7B Students" action="Add Student" onAdd={() => setModal('student')}><div className="table-wrap"><table><thead><tr><th>Name</th><th>Class</th><th /></tr></thead><tbody>{students.map(student => <tr key={student.id}><td><strong>{student.name}</strong></td><td><span className="table-pill">{student.className || 'Grade 7B'}</span></td><td><button className="delete-btn" onClick={() => deleteStudent(student.id)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></Manager>}
        {tab === 'exams' && <Manager title="Grade 7B Quizzes" action="Create Quiz" onAdd={() => setModal('exam')}><div className="admin-list">{exams.map(exam => <div className="admin-list-item" key={exam.id}><div><strong>{exam.title}</strong><span>{exam.unit} • {exam.duration} minutes • {exam.published ? 'Published' : 'Draft'}</span></div><div className="list-actions"><button className="ghost-btn" onClick={() => openPreview(exam)}>Preview</button>{exam.published ? <button className="ghost-btn" onClick={() => setPublished(exam, false)}>Unpublish</button> : <button className="primary-btn small-btn" onClick={() => setPublished(exam, true)}>Publish</button>}<button className="delete-btn" onClick={() => deleteExam(exam.id)}><Trash2 size={16} /></button></div></div>)}</div></Manager>}
        {tab === 'questions' && <Manager title="Question Bank" action="Add Question" onAdd={() => selectedExam && setModal('question')}><select className="select-input" value={selectedExam} onChange={e => loadQuestions(e.target.value)}><option value="">Select a quiz</option>{exams.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select><div className="admin-list">{questions.map(question => <div className="question-admin" key={question.id}><div><strong>{question.text}</strong><span>{question.options.join(' • ')}</span></div><button className="delete-btn" onClick={() => deleteQuestion(question.id)}><Trash2 size={16} /></button></div>)}</div></Manager>}
        {tab === 'results' && <Manager title="Grade 7B Results" action="Clear Results" onAdd={() => setConfirmClearResults(true)}><div className="table-wrap"><table><thead><tr><th>Student</th><th>Quiz</th><th>Score</th><th>Date</th></tr></thead><tbody>{attempts.map(attempt => <tr key={attempt.id}><td><strong>{attempt.student}</strong></td><td>{attempt.exam}</td><td><span className="score-pill">{attempt.total ? Math.round(attempt.score / attempt.total * 100) : 0}%</span></td><td>{new Date(attempt.submittedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></Manager>}

        {modal === 'student' && <StudentModal onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); setNotice('Student added successfully'); }} />}
        {modal === 'exam' && <ExamModal onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); setNotice('Quiz created successfully'); }} />}
        {modal === 'question' && selectedExam && <QuestionModal examId={selectedExam} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadQuestions(selectedExam); setNotice('Question added successfully'); }} />}
        {confirmClearResults && <Modal title="Clear all results?" onClose={() => setConfirmClearResults(false)}><div className="modal-form"><p className="muted">This will permanently remove all saved quiz attempts and scores.</p><button className="danger-btn full-btn" onClick={clearResults}>Yes, clear all results</button><button className="ghost-btn full-btn" onClick={() => setConfirmClearResults(false)}>Cancel</button></div></Modal>}
        {previewExam && <QuizPreview exam={previewExam} questions={previewQuestions} onClose={() => setPreviewExam(null)} />}
      </section>
    </main>
  );
}

function DashboardHome({ students, exams, attempts, onStudents, onExams }: { students: Student[]; exams: Exam[]; attempts: Attempt[]; onStudents: () => void; onExams: () => void }) {
  const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.total ? attempt.score / attempt.total * 100 : 0), 0) / attempts.length) : 0;
  return (
    <>
      <div className="dashboard-cards">
        <Metric title="Students" value={String(students.length)} icon={<Users size={19} />} />
        <Metric title="Quizzes" value={String(exams.length)} icon={<ClipboardList size={19} />} />
        <Metric title="Attempts" value={String(attempts.length)} icon={<BarChart3 size={19} />} />
        <Metric title="Average score" value={`${average}%`} icon={<Trophy size={19} />} />
      </div>
      <div className="admin-grid">
        <section className="panel"><div className="panel-heading"><div><span className="section-label">RECENT ACTIVITY</span><h2>Latest results</h2></div></div>{attempts.length ? attempts.slice(-8).reverse().map(attempt => <div className="result-row" key={attempt.id}><div className="result-avatar">{attempt.student.slice(0, 1).toUpperCase()}</div><div className="result-name"><strong>{attempt.student}</strong><span>{attempt.exam}</span></div><strong className="result-score">{attempt.total ? Math.round(attempt.score / attempt.total * 100) : 0}%</strong></div>) : <div className="empty-state">No results yet.</div>}</section>
        <section className="panel"><span className="section-label">QUICK ACTIONS</span><h2>Manage Grade 7B</h2><button className="action-card" onClick={onStudents}><Users size={19} /><span>Add students</span><ChevronRight size={17} /></button><button className="action-card" onClick={onExams}><ClipboardList size={19} /><span>Create a quiz</span><ChevronRight size={17} /></button></section>
      </div>
    </>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="metric-card"><div className="metric-icon">{icon}</div><span>{title}</span><strong>{value}</strong></div>;
}

function Manager({ title, action, onAdd, children }: { title: string; action?: string; onAdd?: () => void; children: React.ReactNode }) {
  return <section className="panel manager-panel"><div className="panel-heading"><div><span className="section-label">GRADE 7B</span><h2>{title}</h2></div>{onAdd && <button className="primary-btn small-btn" onClick={onAdd}><Plus size={16} /> {action}</button>}</div>{children}</section>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop"><div className="modal-card"><div className="modal-heading"><h2>{title}</h2><button onClick={onClose}><X size={20} /></button></div>{children}</div></div>;
}

function StudentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [className, setClassName] = useState('Grade 7B');
  const [error, setError] = useState('');
  const save = async () => {
    if (!name.trim()) { setError('Please enter the student name.'); return; }
    try { await request('/api/students', { method: 'POST', body: JSON.stringify({ name, className }) }); onSaved(); } catch { setError('Could not add this student.'); }
  };
  return <Modal title="Add Grade 7B Student" onClose={onClose}><div className="modal-form"><label>Name<input value={name} onChange={e => setName(e.target.value)} placeholder="Student name" /></label><label>Class<input value={className} onChange={e => setClassName(e.target.value)} /></label>{error && <div className="error-box">{error}</div>}<button className="primary-btn full-btn" onClick={save}>Save student <ArrowRight size={17} /></button></div></Modal>;
}

function ExamModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('Unit 1');
  const [duration, setDuration] = useState('30');
  const save = async () => { if (!title.trim()) return; await request('/api/exams', { method: 'POST', body: JSON.stringify({ title, unit, duration: Number(duration), published: false }) }); onSaved(); };
  return <Modal title="Create Grade 7B Quiz" onClose={onClose}><div className="modal-form"><label>Quiz title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Unit 1 Revision" /></label><label>Unit<input value={unit} onChange={e => setUnit(e.target.value)} /></label><label>Duration in minutes<input type="number" value={duration} onChange={e => setDuration(e.target.value)} /></label><div className="draft-note">New quizzes start as drafts. Add your questions, preview the quiz, then publish it to students.</div><button className="primary-btn full-btn" onClick={save}>Create draft quiz <ArrowRight size={17} /></button></div></Modal>;
}

function QuestionModal({ examId, onClose, onSaved }: { examId: string; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<'quiz' | 'flashcard'>('quiz');
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const save = async () => {
    if (!text.trim()) return;
    if (kind === 'flashcard' && !answer.trim()) return;
    if (kind === 'quiz' && options.some(option => !option.trim())) return;
    await request(`/api/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify({ kind, text, answer: kind === 'flashcard' ? answer : undefined, options: kind === 'quiz' ? options : [], correctIndex }) });
    onSaved();
  };
  return <Modal title={kind === 'quiz' ? 'Add Quiz Question' : 'Add Flashcard'} onClose={onClose}><div className="modal-form"><label>Type<select value={kind} onChange={e => setKind(e.target.value as 'quiz' | 'flashcard')}><option value="quiz">Quiz question</option><option value="flashcard">Flashcard</option></select></label><label>{kind === 'quiz' ? 'Question' : 'Front / Prompt'}<textarea value={text} onChange={e => setText(e.target.value)} placeholder={kind === 'quiz' ? 'Write the question...' : 'Write the flashcard prompt...'} /></label>{kind === 'flashcard' ? <label>Back / Answer<textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write the answer or explanation..." /></label> : <>{options.map((option, index) => <input key={index} value={option} onChange={e => setOptions(previous => previous.map((value, i) => i === index ? e.target.value : value))} placeholder={`Option ${index + 1}`} />)}<label>Correct answer<select value={correctIndex} onChange={e => setCorrectIndex(Number(e.target.value))}><option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option></select></label></>}<button className="primary-btn full-btn" onClick={save}>Save {kind === 'quiz' ? 'question' : 'flashcard'} <ArrowRight size={17} /></button></div></Modal>;
}

function QuizPreview({ exam, questions, onClose }: { exam: Exam; questions: Question[]; onClose: () => void }) {
  const quizQuestions = questions.filter(question => (question.kind ?? 'quiz') === 'quiz');
  const flashcards = questions.filter(question => (question.kind ?? 'quiz') === 'flashcard');
  return <div className="modal-backdrop"><div className="preview-modal-card"><div className="modal-heading"><div><span className="section-label">STUDENT PREVIEW</span><h2>{exam.title}</h2></div><button onClick={onClose}><X size={20} /></button></div><p className="muted">This is what students will see after you publish the quiz. {flashcards.length ? `${flashcards.length} study card${flashcards.length === 1 ? '' : 's'} are also attached.` : 'No study cards attached yet.'}</p><div className="preview-questions">{quizQuestions.length ? quizQuestions.map((question, index) => <div className="preview-question" key={question.id}><span className="question-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{question.text}</strong><div className="preview-options">{question.options.map((option, optionIndex) => <div key={optionIndex}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</div>)}</div></div></div>) : <div className="empty-state">No quiz questions yet. Add some questions, then preview again.</div>}</div><button className="primary-btn full-btn" onClick={onClose}>Close preview</button></div></div>;
}

export default App;