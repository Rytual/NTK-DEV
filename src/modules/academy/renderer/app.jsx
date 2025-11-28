/**
 * Ninja Academy React Application
 * Main application component
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Main App Component
function NinjaAcademy() {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [userStats, setUserStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      console.log('[App] Initializing Ninja Academy...');

      // Load user stats
      const stats = await window.electronAPI.getUserStats();
      setUserStats(stats);

      // Load available exams
      const examList = await window.electronAPI.getExams();
      setExams(examList);

      console.log('[App] Loaded stats:', stats);
      console.log('[App] Loaded exams:', examList.length);

      setLoading(false);
    } catch (error) {
      console.error('[App] Failed to initialize:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>Loading Ninja Academy...</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        userStats={userStats}
      />
      <MainContent
        view={currentView}
        userStats={userStats}
        exams={exams}
        selectedExam={selectedExam}
        onSelectExam={setSelectedExam}
        onStatsUpdate={setUserStats}
      />
    </div>
  );
}

// Sidebar Component
function Sidebar({ currentView, onNavigate, userStats }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'exams', label: 'Certifications', icon: '📚' },
    { id: 'practice', label: 'Practice', icon: '✍️' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'badges', label: 'Achievements', icon: '🏆' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>🥷</div>
        <div style={styles.logoText}>Ninja Academy</div>
      </div>

      {userStats && (
        <div style={styles.userCard}>
          <div style={styles.userLevel}>Level {userStats.level}</div>
          <div style={styles.userRank}>{userStats.rank}</div>
          <div style={styles.xpBar}>
            <div style={{ ...styles.xpBarFill, width: '65%' }}></div>
          </div>
          <div style={styles.userStats}>
            <div>🔥 {userStats.streakCurrent} days</div>
            <div>⚡ {userStats.xp} XP</div>
          </div>
        </div>
      )}

      <nav style={styles.nav}>
        {menuItems.map(item => (
          <button
            key={item.id}
            style={{
              ...styles.navItem,
              ...(currentView === item.id ? styles.navItemActive : {})
            }}
            onClick={() => onNavigate(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.version}>v10.3.0</div>
        <div style={styles.credit}>Honest Implementation</div>
      </div>
    </div>
  );
}

// Main Content Component
function MainContent({ view, userStats, exams, selectedExam, onSelectExam, onStatsUpdate }) {
  switch (view) {
    case 'dashboard':
      return <Dashboard userStats={userStats} exams={exams} />;
    case 'exams':
      return <ExamSelector exams={exams} onSelect={onSelectExam} />;
    case 'practice':
      return <PracticeMode selectedExam={selectedExam} onStatsUpdate={onStatsUpdate} />;
    case 'progress':
      return <ProgressView userStats={userStats} />;
    case 'badges':
      return <BadgesView />;
    case 'notes':
      return <NotesView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <Dashboard userStats={userStats} exams={exams} />;
  }
}

// Dashboard Component
function Dashboard({ userStats, exams }) {
  return (
    <div style={styles.content}>
      <h1 style={styles.heading}>Welcome to Ninja Academy</h1>
      <p style={styles.subtitle}>Microsoft Certification Training Platform</p>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Questions"
          value={userStats?.totalQuestions || 0}
          icon="✍️"
        />
        <StatCard
          title="Accuracy"
          value={`${userStats?.accuracy.toFixed(1) || 0}%`}
          icon="🎯"
        />
        <StatCard
          title="Current Streak"
          value={`${userStats?.streakCurrent || 0} days`}
          icon="🔥"
        />
        <StatCard
          title="Badges Earned"
          value={`${userStats?.badgesEarned || 0}/${userStats?.totalBadges || 0}`}
          icon="🏆"
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionHeading}>Available Certifications</h2>
        <div style={styles.examGrid}>
          {exams.slice(0, 6).map(exam => (
            <ExamCard key={exam.code} exam={exam} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Exam Selector Component
function ExamSelector({ exams, onSelect }) {
  return (
    <div style={styles.content}>
      <h1 style={styles.heading}>Microsoft Certifications</h1>
      <p style={styles.subtitle}>Choose your certification path</p>

      <div style={styles.examGrid}>
        {exams.map(exam => (
          <ExamCard
            key={exam.code}
            exam={exam}
            onClick={() => onSelect(exam)}
          />
        ))}
      </div>
    </div>
  );
}

// Practice Mode Component
function PracticeMode({ selectedExam, onStatsUpdate }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [selectedExam]);

  async function loadQuestions() {
    if (!selectedExam) {
      // Load random questions from any exam
      const allExams = await window.electronAPI.getExams();
      const randomExam = allExams[Math.floor(Math.random() * allExams.length)];
      const qs = await window.electronAPI.getRandomQuestions(randomExam.code, 10);
      setQuestions(qs);
    } else {
      const qs = await window.electronAPI.getRandomQuestions(selectedExam.code, 10);
      setQuestions(qs);
    }
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  }

  async function handleAnswer(answerIndex) {
    if (selectedAnswer !== null) return; // Already answered

    const question = questions[currentIndex];
    const correct = answerIndex === question.correct;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    // Record answer
    await window.electronAPI.recordAnswer(question.id, correct, question.exam);

    // Update stats
    const newStats = await window.electronAPI.getUserStats();
    onStatsUpdate(newStats);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Session complete
      loadQuestions();
    }
  }

  if (questions.length === 0) {
    return (
      <div style={styles.content}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <div style={styles.loadingText}>Loading questions...</div>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];

  return (
    <div style={styles.content}>
      <div style={styles.questionHeader}>
        <div style={styles.questionProgress}>
          Question {currentIndex + 1} of {questions.length}
        </div>
        <div style={styles.questionExam}>{question.exam} • {question.domain}</div>
      </div>

      <div style={styles.questionCard}>
        <div style={styles.questionText}>{question.question}</div>

        <div style={styles.answerList}>
          {question.options.map((option, index) => (
            <button
              key={index}
              style={{
                ...styles.answerOption,
                ...(selectedAnswer === index ? styles.answerSelected : {}),
                ...(showExplanation && index === question.correct ? styles.answerCorrect : {}),
                ...(showExplanation && selectedAnswer === index && index !== question.correct ? styles.answerIncorrect : {})
              }}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
            >
              <span style={styles.answerLetter}>{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        {showExplanation && (
          <div style={styles.explanation}>
            <div style={styles.explanationHeader}>
              {selectedAnswer === question.correct ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            <div style={styles.explanationText}>{question.explanation}</div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                require('electron').shell.openExternal(question.reference);
              }}
              style={styles.explanationLink}
            >
              📚 Read more in Microsoft Learn
            </a>
          </div>
        )}

        {showExplanation && (
          <button style={styles.nextButton} onClick={handleNext}>
            {currentIndex < questions.length - 1 ? 'Next Question →' : 'Start New Session'}
          </button>
        )}
      </div>
    </div>
  );
}

// Progress View Component
function ProgressView({ userStats }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadProgressSummary();
  }, []);

  async function loadProgressSummary() {
    const sum = await window.electronAPI.getProgressSummary();
    setSummary(sum);
  }

  if (!summary) {
    return <div style={styles.content}>Loading...</div>;
  }

  return (
    <div style={styles.content}>
      <h1 style={styles.heading}>Your Progress</h1>

      <div style={styles.progressGrid}>
        <div style={styles.progressCard}>
          <h3>Level Progress</h3>
          <div style={styles.levelDisplay}>
            <span style={styles.levelNumber}>{summary.level.current}</span>
            <span style={styles.levelLabel}>Level</span>
          </div>
          <div style={styles.xpBar}>
            <div
              style={{...styles.xpBarFill, width: `${summary.level.progress}%`}}
            ></div>
          </div>
          <div style={styles.xpText}>
            {summary.xp.current} / {summary.xp.required} XP
          </div>
        </div>

        <div style={styles.progressCard}>
          <h3>Rank</h3>
          <div style={styles.rankDisplay}>
            <span style={styles.rankIcon}>{summary.rank.icon}</span>
            <span style={styles.rankName}>{summary.rank.name}</span>
          </div>
        </div>

        <div style={styles.progressCard}>
          <h3>Performance</h3>
          <div style={styles.perfStats}>
            <div>Questions: {summary.performance.totalQuestions}</div>
            <div>Correct: {summary.performance.correctAnswers}</div>
            <div>Accuracy: {summary.performance.accuracy}%</div>
          </div>
        </div>

        <div style={styles.progressCard}>
          <h3>Badges</h3>
          <div style={styles.badgeProgress}>
            <div style={styles.badgeCount}>
              {summary.badges.earned} / {summary.badges.total}
            </div>
            <div style={styles.badgePercent}>{summary.badges.percentage}% Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Badges View Component
function BadgesView() {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    loadBadges();
  }, []);

  async function loadBadges() {
    const allBadges = await window.electronAPI.getAllBadges();
    setBadges(allBadges);
  }

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <div style={styles.content}>
      <h1 style={styles.heading}>Achievements</h1>
      <p style={styles.subtitle}>{earnedBadges.length} of {badges.length} badges earned</p>

      <h2 style={styles.sectionHeading}>Earned Badges</h2>
      <div style={styles.badgeGrid}>
        {earnedBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} earned={true} />
        ))}
      </div>

      <h2 style={styles.sectionHeading}>Locked Badges</h2>
      <div style={styles.badgeGrid}>
        {lockedBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} earned={false} />
        ))}
      </div>
    </div>
  );
}

// Notes View Component
function NotesView() {
  return (
    <div style={styles.content}>
      <h1 style={styles.heading}>Study Notes</h1>
      <p style={styles.subtitle}>Take notes while you study</p>
      <div style={styles.placeholder}>
        📝 Notes feature coming soon
      </div>
    </div>
  );
}

// Settings View Component
function SettingsView() {
  return (
    <div style={styles.content}>
      <h1 style={styles.heading}>Settings</h1>
      <p style={styles.subtitle}>Customize your experience</p>
      <div style={styles.placeholder}>
        ⚙️ Settings panel coming soon
      </div>
    </div>
  );
}

// Utility Components
function StatCard({ title, value, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
    </div>
  );
}

function ExamCard({ exam, onClick }) {
  return (
    <div style={styles.examCard} onClick={onClick}>
      <div style={styles.examCode}>{exam.code}</div>
      <div style={styles.examName}>{exam.name}</div>
      <div style={styles.examQuestions}>{exam.questionCount} questions</div>
    </div>
  );
}

function BadgeCard({ badge, earned }) {
  return (
    <div style={{
      ...styles.badgeCard,
      ...(earned ? styles.badgeCardEarned : styles.badgeCardLocked)
    }}>
      <div style={styles.badgeIcon}>{badge.icon}</div>
      <div style={styles.badgeName}>{badge.name}</div>
      <div style={styles.badgeDescription}>{badge.description}</div>
      <div style={styles.badgeTier}>{badge.tier}</div>
    </div>
  );
}

// Styles
const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: '260px',
    background: 'rgba(10, 14, 39, 0.95)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '30px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  userCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  userLevel: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  userRank: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '12px',
  },
  xpBar: {
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4a9eff 0%, #667eea 100%)',
    transition: 'width 0.3s ease',
  },
  userStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: 'rgba(74, 158, 255, 0.15)',
    color: '#4a9eff',
  },
  navIcon: {
    fontSize: '20px',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  version: {
    marginBottom: '4px',
  },
  credit: {
    fontSize: '10px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '40px',
  },
  heading: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '40px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  statTitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  section: {
    marginTop: '40px',
  },
  sectionHeading: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  examGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  examCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid transparent',
  },
  examCode: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4a9eff',
    marginBottom: '8px',
  },
  examName: {
    fontSize: '16px',
    marginBottom: '12px',
  },
  examQuestions: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  questionCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '32px',
  },
  questionText: {
    fontSize: '20px',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  answerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  answerOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid transparent',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  answerLetter: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  answerSelected: {
    borderColor: '#4a9eff',
  },
  answerCorrect: {
    borderColor: '#4ade80',
    background: 'rgba(74, 222, 128, 0.1)',
  },
  answerIncorrect: {
    borderColor: '#f87171',
    background: 'rgba(248, 113, 113, 0.1)',
  },
  explanation: {
    marginTop: '24px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  explanationHeader: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  explanationText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '12px',
  },
  explanationLink: {
    fontSize: '14px',
    color: '#4a9eff',
    textDecoration: 'none',
  },
  nextButton: {
    marginTop: '20px',
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(90deg, #4a9eff 0%, #667eea 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  progressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  progressCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '24px',
  },
  levelDisplay: {
    textAlign: 'center',
    margin: '20px 0',
  },
  levelNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    display: 'block',
  },
  levelLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  xpText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  rankDisplay: {
    textAlign: 'center',
    padding: '20px',
  },
  rankIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '12px',
  },
  rankName: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  perfStats: {
    fontSize: '14px',
    lineHeight: '2',
  },
  badgeProgress: {
    textAlign: 'center',
    padding: '20px',
  },
  badgeCount: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  badgePercent: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  badgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '40px',
  },
  badgeCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  badgeCardEarned: {
    border: '2px solid rgba(74, 158, 255, 0.5)',
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  badgeName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  badgeDescription: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '8px',
  },
  badgeTier: {
    fontSize: '11px',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  placeholder: {
    textAlign: 'center',
    fontSize: '48px',
    color: 'rgba(255, 255, 255, 0.3)',
    padding: '60px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#4a9eff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
};

// Mount React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<NinjaAcademy />);

console.log('[App] Ninja Academy React app mounted');
