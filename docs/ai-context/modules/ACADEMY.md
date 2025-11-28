# Academy Module - AI Context Documentation

## Module Overview

**Ninja Academy** is a comprehensive Microsoft certification training platform with 1,200+ practice questions, gamification (XP, levels, badges), SQLite progress persistence, and AI-powered tutoring.

### Core Purpose
- Microsoft certification exam preparation
- Gamified learning with XP and achievements
- Progress tracking and analytics
- AI tutor assistance
- Visual media backgrounds

---

## File Structure

```
src/modules/academy/
├── backend/
│   ├── main.cjs                              # Module entry point
│   └── engines/
│       ├── QuestionBank.cjs                  # 1,200+ questions (1477 lines)
│       ├── GamificationEngine.cjs            # XP, levels, badges (837 lines)
│       ├── DatabaseManager.cjs               # SQLite persistence (587 lines)
│       ├── MediaLoader.cjs                   # Image/video backgrounds (577 lines)
│       └── ThreeJSAnimations.cjs             # 3D animations (placeholder)
├── renderer/
│   ├── index.html
│   └── app.jsx                               # React frontend
└── types/
    └── index.d.ts                            # TypeScript declarations
```

---

## Backend Components

### 1. QuestionBank (QuestionBank.cjs)

**Purpose**: Comprehensive question database for Microsoft certification exams.

**Supported Exams (12 total)**:

| Exam Code | Name | Questions |
|-----------|------|-----------|
| MS-900 | Microsoft 365 Fundamentals | 100+ |
| MS-102 | Microsoft 365 Administrator | 100+ |
| AZ-104 | Azure Administrator | 100+ |
| AZ-204 | Azure Developer | 100+ |
| AZ-305 | Azure Architect | 100+ |
| AZ-400 | Azure DevOps | 100+ |
| AZ-500 | Azure Security | 100+ |
| AZ-700 | Azure Networking | 100+ |
| SC-900 | Security Fundamentals | 100+ |
| SC-200 | Security Operations | 100+ |
| SC-300 | Identity and Access | 100+ |
| SC-400 | Information Protection | 100+ |

**Question Object Structure**:
```javascript
{
  id: 'MS900-001',
  examCode: 'MS-900',
  domain: 'Cloud Concepts',
  subdomain: 'Types of Cloud Services',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  question: 'Which cloud service model provides...',
  type: 'single' | 'multiple' | 'order' | 'match',
  options: [
    { id: 'A', text: 'Option text', isCorrect: true/false }
  ],
  correctAnswer: 'A' | ['A', 'B'],
  explanation: 'Detailed explanation...',
  reference: 'Microsoft Learn URL',
  tips: ['Pro tip 1', 'Pro tip 2']
}
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getQuestion(id)` | question ID | `Question \| null` | Get specific question |
| `getQuestionsByExam(examCode)` | exam code | `Question[]` | Get all exam questions |
| `getQuestionsByDomain(exam, domain)` | exam, domain | `Question[]` | Filter by domain |
| `getRandomQuestions(exam, count, options)` | exam, count, `{difficulty, domain}` | `Question[]` | Random selection |
| `getExamInfo(examCode)` | exam code | `ExamInfo` | Get exam metadata |
| `getAllExams()` | none | `ExamInfo[]` | List all exams |
| `getExamDomains(examCode)` | exam code | `string[]` | Get exam domains |

**Exam Info Structure**:
```javascript
{
  code: 'MS-900',
  name: 'Microsoft 365 Fundamentals',
  description: 'Entry-level certification...',
  passingScore: 700,
  questionCount: 40-60,
  duration: '45 minutes',
  cost: '$165',
  domains: ['Cloud Concepts', 'M365 Services', ...],
  skills: ['Describe cloud concepts', 'Describe M365...']
}
```

---

### 2. GamificationEngine (GamificationEngine.cjs)

**Purpose**: Single-user gamification system for motivation and progress tracking.

**XP Configuration**:
```javascript
xpConfig = {
  baseXP: 100,
  multiplier: 1.5,
  maxLevel: 100
};
```

**XP Awards**:
- Correct answer: 10 XP
- Question attempt: 5 XP
- Badge unlock: 50-1000 XP (by tier)

**Rank System** (16 ranks):
```javascript
ranks = [
  { level: 1, name: 'Novice', icon: '🌱' },
  { level: 5, name: 'Apprentice', icon: '📘' },
  { level: 10, name: 'Student', icon: '🎓' },
  { level: 15, name: 'Practitioner', icon: '💼' },
  { level: 20, name: 'Specialist', icon: '⚙️' },
  { level: 25, name: 'Professional', icon: '👔' },
  { level: 30, name: 'Expert', icon: '🏆' },
  // ... up to
  { level: 100, name: 'Legendary Master', icon: '🌟👑💎' }
];
```

**Badge System** (50+ badges):

| Category | Examples | Tiers |
|----------|----------|-------|
| First Steps | First question, 10/50/100/500 questions | Bronze → Platinum |
| Accuracy | 80%/90%/95% over N questions | Silver → Platinum |
| Streak | 7/14/30/60/100 day streak | Bronze → Diamond |
| Exam Mastery | Per-exam completion badges | Bronze → Platinum |
| Study Sessions | 20 questions, 2/4 hour sessions | Bronze → Gold |
| Domain Mastery | Identity, Security, Compute, etc. | Gold |
| Level Milestones | Level 10/25/50/75/100 | Bronze → Diamond |

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `awardXP(amount, reason)` | XP amount, reason | `{newXP, level, levelUp}` | Award XP |
| `recordAnswer(questionId, correct, examCode)` | question, result, exam | void | Record answer |
| `updateStreak()` | none | void | Update daily streak |
| `getUserStats()` | none | `UserStats` | Get statistics |
| `getAllBadges()` | none | `Badge[]` | Get all badges with earned status |
| `getProgressSummary()` | none | `Summary` | Complete progress summary |

---

### 3. DatabaseManager (DatabaseManager.cjs)

**Purpose**: SQLite persistence for all user progress data.

**Schema Tables**:

```sql
-- User progress
user_progress (user_id, xp, level, rank, streak_current, streak_longest, last_activity)

-- Answer history
answer_history (id, user_id, question_id, exam_code, correct, time_taken, timestamp)

-- Badges
user_badges (id, user_id, badge_id, earned_date)

-- XP history
xp_history (id, user_id, amount, reason, timestamp)

-- Study sessions
study_sessions (id, user_id, exam_code, start_time, end_time, duration_minutes, questions_answered, correct_answers, xp_earned)

-- Exam progress
exam_progress (id, user_id, exam_code, questions_answered, correct_answers, last_studied, target_date)

-- Notes
notes (id, user_id, exam_code, domain, title, content, created_date, updated_date)

-- Bookmarks
bookmarked_questions (id, user_id, question_id, exam_code, note, created_date)

-- Settings
user_settings (user_id, theme, sound_enabled, animations_enabled, difficulty_filter, questions_per_session, ai_tutor_enabled)
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getUserProgress(userId)` | user ID | `Progress` | Get user progress |
| `getAnswerHistory(userId, limit)` | user, limit | `Answer[]` | Get answer history |
| `getExamStatistics(userId, examCode)` | user, exam | `Stats` | Per-exam statistics |
| `startStudySession(userId, examCode)` | user, exam | `sessionId` | Start session |
| `endStudySession(sessionId, ...)` | session, stats | void | End session |
| `getStudyAnalytics(userId, days)` | user, days | `Analytics` | Study analytics |
| `saveNote(...)` | note data | `noteId` | Save study note |
| `bookmarkQuestion(...)` | bookmark data | `boolean` | Bookmark question |
| `exportUserData(userId)` | user ID | `ExportData` | Export all user data |

---

### 4. MediaLoader (MediaLoader.cjs)

**Purpose**: External media management for UI backgrounds.

**Directory Structure**:
```
/art/
├── videos/    # .mp4, .webm, .mov, .avi, .mkv, .m4v
└── images/    # .jpg, .png, .gif, .webp, .svg, .bmp
```

**Key Features**:
- `fs.watch()` monitoring for real-time updates
- Fisher-Yates shuffle for random selection
- Procedural CSS gradient fallbacks (20 gradients)
- Event-driven reload system

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getRandomImage()` | none | `Media \| Gradient` | Random image or gradient |
| `getRandomVideo()` | none | `Media \| null` | Random video |
| `getRandomImages(count)` | count | `Media[]` | Multiple random images |
| `generateProceduralGradient()` | none | `Gradient` | CSS gradient fallback |
| `reload()` | none | void | Reload all media |
| `getStats()` | none | `Stats` | Media statistics |

**Gradient Examples**:
```javascript
{
  name: 'Purple Dream',
  value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  colors: ['#667eea', '#764ba2']
}
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `academy:getQuestion` | Renderer → Main | `{id}` | `Question` |
| `academy:getRandomQuestions` | Renderer → Main | `{exam, count, options}` | `Question[]` |
| `academy:recordAnswer` | Renderer → Main | `{questionId, correct, examCode}` | void |
| `academy:getUserStats` | Renderer → Main | none | `UserStats` |
| `academy:getProgressSummary` | Renderer → Main | none | `Summary` |
| `academy:getAllBadges` | Renderer → Main | none | `Badge[]` |
| `academy:getExamInfo` | Renderer → Main | `{examCode}` | `ExamInfo` |
| `academy:getAllExams` | Renderer → Main | none | `ExamInfo[]` |
| `media:getRandomImage` | Renderer → Main | none | `Media \| Gradient` |
| `media:getRandomVideo` | Renderer → Main | none | `Media \| null` |

---

## Integration Points

### With KageForge
- AI tutor explanations
- Natural language question queries
- Adaptive learning suggestions

### With KageChat
- Ask questions about exam topics
- Get explanations for answers
- Study assistance

### With Dashboard
- Study progress widgets
- Streak notifications
- Next exam reminders

---

## Current State

### Implemented
- 1,200+ questions across 12 exams
- Full gamification system
- SQLite persistence
- Media loader with gradient fallbacks
- Comprehensive statistics
- Badge achievement system

### Frontend Status
- Basic UI in app.jsx (placeholder)
- Full frontend in src/pages/Academy.tsx

---

## Improvement Opportunities

1. **Spaced Repetition**: Implement SRS algorithm for optimal review timing
2. **Practice Tests**: Full timed mock exams
3. **AI Question Generation**: Use KageForge to generate custom questions
4. **Social Features**: Compare progress with friends (opt-in)
5. **Mobile App**: React Native companion app
6. **Flashcards**: Quick review mode
7. **Audio Pronunciation**: For technical terms
8. **Cert Tracking**: Track actual certification status
