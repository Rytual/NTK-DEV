import * as React from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Trophy,
  Star,
  Target,
  BookOpen,
  Video,
  FileText,
  Award,
  Flame,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ScrollArea } from '../components/ui/ScrollArea';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { cn } from '../lib/utils';

// Course type
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: number;
  completedLessons: number;
  progress: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  xp: number;
  thumbnail?: string;
}

// Achievement type
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

// Mock courses
const mockCourses: Course[] = [
  {
    id: '1', title: 'Introduction to Network Security',
    description: 'Learn the fundamentals of securing network infrastructure',
    category: 'Security', difficulty: 'beginner', duration: '2h 30m',
    lessons: 12, completedLessons: 12, progress: 100,
    status: 'completed', xp: 500
  },
  {
    id: '2', title: 'Microsoft 365 Administration',
    description: 'Master M365 tenant management and user administration',
    category: 'Microsoft', difficulty: 'intermediate', duration: '4h 15m',
    lessons: 18, completedLessons: 10, progress: 56,
    status: 'in_progress', xp: 750
  },
  {
    id: '3', title: 'PowerShell Scripting Essentials',
    description: 'Automate tasks with PowerShell scripting',
    category: 'Automation', difficulty: 'intermediate', duration: '3h 45m',
    lessons: 15, completedLessons: 0, progress: 0,
    status: 'available', xp: 650
  },
  {
    id: '4', title: 'Advanced Threat Detection',
    description: 'Identify and respond to advanced security threats',
    category: 'Security', difficulty: 'advanced', duration: '5h 30m',
    lessons: 20, completedLessons: 0, progress: 0,
    status: 'locked', xp: 1000
  },
  {
    id: '5', title: 'Azure Cloud Fundamentals',
    description: 'Get started with Microsoft Azure cloud services',
    category: 'Cloud', difficulty: 'beginner', duration: '3h',
    lessons: 14, completedLessons: 0, progress: 0,
    status: 'available', xp: 550
  },
];

// Mock achievements
const mockAchievements: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', earned: true, earnedAt: '2 weeks ago' },
  { id: '2', title: 'Quick Learner', description: 'Complete a course in one day', icon: '⚡', earned: true, earnedAt: '1 week ago' },
  { id: '3', title: 'Security Expert', description: 'Complete all security courses', icon: '🛡️', earned: false },
  { id: '4', title: 'Streak Master', description: 'Maintain a 7-day learning streak', icon: '🔥', earned: true, earnedAt: '3 days ago' },
  { id: '5', title: 'Perfectionist', description: 'Score 100% on 5 quizzes', icon: '💎', earned: false },
];

// User stats
const userStats = {
  totalXP: 1250,
  level: 5,
  streak: 4,
  coursesCompleted: 1,
  hoursLearned: 8.5,
  quizzesPassed: 12,
  rank: 15,
};

// Progress overview
function ProgressOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Total XP</p>
              <p className="text-2xl font-bold text-primary">{userStats.totalXP.toLocaleString()}</p>
              <p className="text-xs text-foreground-muted">Level {userStats.level}</p>
            </div>
            <Star className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Learning Streak</p>
              <p className="text-2xl font-bold">{userStats.streak} days</p>
              <p className="text-xs text-success">Keep it up!</p>
            </div>
            <Flame className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Hours Learned</p>
              <p className="text-2xl font-bold">{userStats.hoursLearned}</p>
              <p className="text-xs text-foreground-muted">This month</p>
            </div>
            <Clock className="h-8 w-8 text-info" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Leaderboard</p>
              <p className="text-2xl font-bold">#{userStats.rank}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +3 this week
              </p>
            </div>
            <Trophy className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Course card component
function CourseCard({ course, onStart }: { course: Course; onStart: () => void }) {
  const getDifficultyColor = () => {
    switch (course.difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
    }
  };

  const getStatusIcon = () => {
    switch (course.status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'in_progress': return <Play className="h-5 w-5 text-primary" />;
      case 'locked': return <Lock className="h-5 w-5 text-foreground-muted" />;
      default: return <Target className="h-5 w-5 text-info" />;
    }
  };

  return (
    <Card hover className={cn(course.status === 'locked' && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            {course.status === 'completed' ? (
              <CheckCircle2 className="h-10 w-10 text-success" />
            ) : (
              <BookOpen className="h-10 w-10 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-bold line-clamp-1">{course.title}</h3>
                <p className="text-sm text-foreground-muted line-clamp-2">{course.description}</p>
              </div>
              {getStatusIcon()}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{course.category}</Badge>
              <Badge variant={getDifficultyColor() as any}>{course.difficulty}</Badge>
              <span className="text-xs text-foreground-muted flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.duration}
              </span>
              <span className="text-xs text-foreground-muted">
                {course.lessons} lessons
              </span>
            </div>

            {/* Progress bar */}
            {course.status !== 'locked' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground-muted">Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      course.progress === 100 ? 'bg-success' : 'bg-primary'
                    )}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm font-medium text-primary flex items-center gap-1">
                <Star className="h-4 w-4" />
                {course.xp} XP
              </span>
              <Button
                size="sm"
                variant={course.status === 'locked' ? 'outline' : 'default'}
                disabled={course.status === 'locked'}
                onClick={onStart}
              >
                {course.status === 'completed' ? 'Review' :
                 course.status === 'in_progress' ? 'Continue' :
                 course.status === 'locked' ? 'Locked' : 'Start'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Achievement card
function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg transition-colors',
      achievement.earned ? 'bg-surface' : 'bg-surface/50 opacity-60'
    )}>
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
        achievement.earned ? 'bg-primary/10' : 'bg-surface-hover'
      )}>
        {achievement.earned ? achievement.icon : <Lock className="h-5 w-5 text-foreground-muted" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{achievement.title}</p>
        <p className="text-xs text-foreground-muted">{achievement.description}</p>
        {achievement.earnedAt && (
          <p className="text-xs text-success mt-1">Earned {achievement.earnedAt}</p>
        )}
      </div>
      {achievement.earned && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
    </div>
  );
}

// Leaderboard
function Leaderboard() {
  const leaders = [
    { rank: 1, name: 'Alex Chen', xp: 4250, avatar: 'AC' },
    { rank: 2, name: 'Sarah Kim', xp: 3890, avatar: 'SK' },
    { rank: 3, name: 'Mike Johnson', xp: 3540, avatar: 'MJ' },
    { rank: 4, name: 'Emily Davis', xp: 2980, avatar: 'ED' },
    { rank: 5, name: 'You', xp: 1250, avatar: 'ME', isYou: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {leaders.map((leader) => (
            <div
              key={leader.rank}
              className={cn(
                'flex items-center gap-3 p-3',
                leader.isYou && 'bg-primary/5'
              )}
            >
              <span className={cn(
                'w-6 text-center font-bold',
                leader.rank === 1 && 'text-warning',
                leader.rank === 2 && 'text-foreground-muted',
                leader.rank === 3 && 'text-amber-700'
              )}>
                {leader.rank}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className={cn('text-xs', leader.isYou && 'bg-primary text-primary-foreground')}>
                  {leader.avatar}
                </AvatarFallback>
              </Avatar>
              <span className={cn('flex-1 font-medium', leader.isYou && 'text-primary')}>
                {leader.name}
              </span>
              <span className="text-sm font-medium">{leader.xp.toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Academy component
export default function Academy() {
  const [courses] = React.useState<Course[]>(mockCourses);
  const [achievements] = React.useState<Achievement[]>(mockAchievements);
  const [activeTab, setActiveTab] = React.useState<'courses' | 'achievements'>('courses');

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-primary" />
                Ninja Academy
              </h1>
              <p className="text-foreground-muted">Level up your MSP skills</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning">
                <Flame className="h-4 w-4" />
                <span className="font-medium">{userStats.streak} day streak</span>
              </div>
              <Badge variant="primary" className="text-lg px-4 py-2">
                <Star className="h-4 w-4 mr-1" />
                Level {userStats.level}
              </Badge>
            </div>
          </div>

          {/* Progress Overview */}
          <ProgressOverview />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Courses Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-border">
                <button
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'courses'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-foreground-muted hover:text-foreground'
                  )}
                  onClick={() => setActiveTab('courses')}
                >
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Courses
                </button>
                <button
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'achievements'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-foreground-muted hover:text-foreground'
                  )}
                  onClick={() => setActiveTab('achievements')}
                >
                  <Award className="h-4 w-4 inline mr-2" />
                  Achievements
                </button>
              </div>

              {activeTab === 'courses' ? (
                <div className="space-y-4">
                  {/* Continue Learning */}
                  {courses.filter(c => c.status === 'in_progress').length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold mb-3">Continue Learning</h2>
                      {courses.filter(c => c.status === 'in_progress').map(course => (
                        <CourseCard key={course.id} course={course} onStart={() => {}} />
                      ))}
                    </div>
                  )}

                  {/* Available Courses */}
                  <div>
                    <h2 className="text-lg font-bold mb-3">Available Courses</h2>
                    <div className="space-y-4">
                      {courses.filter(c => c.status === 'available').map(course => (
                        <CourseCard key={course.id} course={course} onStart={() => {}} />
                      ))}
                    </div>
                  </div>

                  {/* Completed */}
                  {courses.filter(c => c.status === 'completed').length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold mb-3">Completed</h2>
                      <div className="space-y-4">
                        {courses.filter(c => c.status === 'completed').map(course => (
                          <CourseCard key={course.id} course={course} onStart={() => {}} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.map(achievement => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Leaderboard />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.filter(a => a.earned).slice(0, 3).map(achievement => (
                    <div key={achievement.id} className="flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{achievement.title}</p>
                        <p className="text-xs text-foreground-muted">{achievement.earnedAt}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
