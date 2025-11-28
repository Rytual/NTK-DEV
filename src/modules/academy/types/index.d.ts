/**
 * TypeScript Type Definitions for Ninja Academy
 */

// Question Types
export interface Question {
  id: string;
  exam: string;
  domain: string;
  objective: string;
  type: 'multiple-choice' | 'multiple-select' | 'true-false';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  question: string;
  options: string[];
  correct: number | number[];
  explanation: string;
  reference: string;
}

export interface ExamInfo {
  code: string;
  name: string;
  description: string;
  domains: string[];
  questionCount: number;
}

// User Progress Types
export interface UserProgress {
  user_id: number;
  xp: number;
  level: number;
  rank: string;
  streak_current: number;
  streak_longest: number;
  last_activity: string;
  created_date: string;
  updated_date: string;
}

export interface UserStats {
  level: number;
  xp: number;
  rank: string;
  rankInfo: RankInfo;
  streakCurrent: number;
  streakLongest: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  badgesEarned: number;
  totalBadges: number;
}

export interface RankInfo {
  level: number;
  name: string;
  minXP: number;
  icon: string;
}

// Badge Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  requirement: BadgeRequirement;
  earned?: boolean;
  earnedDate?: string;
}

export interface BadgeRequirement {
  type: string;
  value?: number;
  exam?: string;
  domain?: string;
  accuracy?: number;
  count?: number;
  hour?: number;
  before?: boolean;
  days?: number;
}

// Gamification Types
export interface LevelInfo {
  level: number;
  currentLevelXP: number;
  xpForNextLevel: number;
}

export interface XPAward {
  amount: number;
  newXP: number;
  level: number;
  levelUp: boolean;
  oldLevel: number;
  rank: RankInfo;
}

export interface ProgressSummary {
  level: {
    current: number;
    progress: string;
    xpCurrent: number;
    xpRequired: number;
  };
  rank: RankInfo;
  xp: {
    total: number;
    current: number;
    required: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  performance: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
  };
  badges: {
    earned: number;
    total: number;
    percentage: string;
  };
}

// Answer Types
export interface AnswerRecord {
  id: number;
  user_id: number;
  question_id: string;
  exam_code: string;
  correct: boolean;
  time_taken?: number;
  timestamp: string;
}

// Study Session Types
export interface StudySession {
  id: number;
  user_id: number;
  exam_code: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  questions_answered: number;
  correct_answers: number;
  xp_earned: number;
}

export interface StudyAnalytics {
  totalSessions: number;
  totalMinutes: number;
  totalQuestions: number;
  averageAccuracy: number;
  dailyActivity: DailyActivity[];
}

export interface DailyActivity {
  date: string;
  sessions: number;
  minutes: number;
  questions: number;
}

// Exam Statistics Types
export interface ExamStatistics {
  exam_code: string;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  last_attempt: string;
}

// Notes Types
export interface Note {
  id: number;
  user_id: number;
  exam_code: string;
  domain: string;
  title: string;
  content: string;
  created_date: string;
  updated_date: string;
}

// Bookmark Types
export interface BookmarkedQuestion {
  id: number;
  user_id: number;
  question_id: string;
  exam_code: string;
  note?: string;
  created_date: string;
}

// Settings Types
export interface UserSettings {
  user_id: number;
  theme: 'light' | 'dark';
  sound_enabled: boolean;
  animations_enabled: boolean;
  difficulty_filter: 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  questions_per_session: number;
  ai_tutor_enabled: boolean;
}

// Media Types
export interface MediaImage {
  type: 'image';
  path: string;
  filename: string;
  ext: string;
}

export interface MediaGradient {
  type: 'gradient';
  name: string;
  value: string;
  colors: string[];
}

export interface MediaVideo {
  type: 'video';
  path: string;
  filename: string;
  ext: string;
}

export type MediaItem = MediaImage | MediaGradient | MediaVideo | null;

export interface MediaStats {
  videosLoaded: number;
  imagesLoaded: number;
  reloadCount: number;
  lastReload: string | null;
  watchersActive: number;
  directories: {
    videos: string;
    images: string;
  };
  available: {
    videos: number;
    images: number;
  };
  usingFallbacks: {
    videos: boolean;
    images: boolean;
  };
}

// Performance Trend Types
export interface PerformanceTrend {
  date: string;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
}

// Export Data Types
export interface ExportData {
  progress: UserProgress;
  answerHistory: AnswerRecord[];
  badges: Badge[];
  studySessions: StudySession[];
  notes: Note[];
  bookmarks: BookmarkedQuestion[];
  settings: UserSettings;
  examStats: ExamStatistics[];
}

// React Component Prop Types
export interface DashboardProps {
  userStats: UserStats;
  recentActivity: AnswerRecord[];
  onNavigate: (route: string) => void;
}

export interface ExamInterfaceProps {
  examCode: string;
  questions: Question[];
  onComplete: (results: ExamResults) => void;
}

export interface ExamResults {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeTaken: number;
  xpEarned: number;
}

export interface BadgeDisplayProps {
  badges: Badge[];
  onBadgeClick: (badge: Badge) => void;
}

export interface ProgressDisplayProps {
  summary: ProgressSummary;
  compact?: boolean;
}

// IPC Types (for Electron)
declare global {
  interface Window {
    electronAPI?: {
      getExams: () => Promise<ExamInfo[]>;
      getExamQuestions: (examCode: string) => Promise<Question[]>;
      getRandomQuestions: (examCode: string, count: number) => Promise<Question[]>;
      getUserProgress: () => Promise<UserProgress>;
      getUserStats: () => Promise<UserStats>;
      getProgressSummary: () => Promise<ProgressSummary>;
      getAllBadges: () => Promise<Badge[]>;
      recordAnswer: (questionId: string, correct: boolean, examCode: string) => Promise<UserStats>;
      getExamStatistics: (examCode: string) => Promise<ExamStatistics>;
      getStudyAnalytics: (days: number) => Promise<StudyAnalytics>;
      startStudySession: (examCode: string) => Promise<number>;
      endStudySession: (sessionId: number, questions: number, correct: number, xp: number) => Promise<void>;
      saveNote: (examCode: string, domain: string, title: string, content: string) => Promise<number>;
      getNotes: (examCode?: string) => Promise<Note[]>;
      bookmarkQuestion: (questionId: string, examCode: string, note?: string) => Promise<boolean>;
      getBookmarkedQuestions: (examCode?: string) => Promise<BookmarkedQuestion[]>;
      getUserSettings: () => Promise<UserSettings>;
      updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
      getRandomImage: () => Promise<MediaItem>;
      getRandomVideo: () => Promise<MediaItem>;
      exportUserData: () => Promise<ExportData>;
    };
  }
}

export {};
