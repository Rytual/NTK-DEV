/**
 * GamificationEngine - Single-User Gamification System
 *
 * HONEST IMPLEMENTATION:
 * - Single user ONLY (no multiplayer, no leaderboards)
 * - XP and ranking system
 * - Badge achievements
 * - Streak tracking (local storage)
 * - Progress persistence (SQLite)
 * - NO fake social features
 * - NO fake competitive elements
 *
 * This is a personal progression system focused on individual growth.
 */

const EventEmitter = require('events');

/**
 * Gamification Engine Class
 */
class GamificationEngine extends EventEmitter {
  constructor(database) {
    super();
    this.db = database;

    // XP and Level Configuration
    this.xpConfig = {
      baseXP: 100,
      multiplier: 1.5,
      maxLevel: 100
    };

    // Badge Definitions (50+ badges)
    this.badges = this.initializeBadges();

    // Rank Definitions
    this.ranks = this.initializeRanks();

    this.initialize();
  }

  /**
   * Initialize gamification system
   */
  initialize() {
    this.ensureUserExists();
    console.log('[GamificationEngine] Initialized');
  }

  /**
   * Ensure user record exists
   */
  ensureUserExists() {
    const user = this.db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(1);

    if (!user) {
      this.db.prepare(`
        INSERT INTO user_progress (user_id, xp, level, rank, streak_current, streak_longest)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(1, 0, 1, 'Novice', 0, 0);
    }
  }

  /**
   * Initialize badge definitions
   */
  initializeBadges() {
    return {
      // First Steps Badges
      first_question: {
        id: 'first_question',
        name: 'First Steps',
        description: 'Answer your first question',
        tier: 'bronze',
        icon: '👶',
        requirement: { type: 'questions_answered', value: 1 }
      },
      getting_started: {
        id: 'getting_started',
        name: 'Getting Started',
        description: 'Answer 10 questions',
        tier: 'bronze',
        icon: '🎯',
        requirement: { type: 'questions_answered', value: 10 }
      },
      dedicated_learner: {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Answer 50 questions',
        tier: 'silver',
        icon: '📚',
        requirement: { type: 'questions_answered', value: 50 }
      },
      knowledge_seeker: {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Answer 100 questions',
        tier: 'silver',
        icon: '🔍',
        requirement: { type: 'questions_answered', value: 100 }
      },
      expert_practice: {
        id: 'expert_practice',
        name: 'Expert Practice',
        description: 'Answer 500 questions',
        tier: 'gold',
        icon: '⭐',
        requirement: { type: 'questions_answered', value: 500 }
      },
      master_scholar: {
        id: 'master_scholar',
        name: 'Master Scholar',
        description: 'Answer 1000 questions',
        tier: 'platinum',
        icon: '👑',
        requirement: { type: 'questions_answered', value: 1000 }
      },

      // Accuracy Badges
      perfect_start: {
        id: 'perfect_start',
        name: 'Perfect Start',
        description: 'Get 100% accuracy on first 5 questions',
        tier: 'bronze',
        icon: '💯',
        requirement: { type: 'perfect_streak', value: 5 }
      },
      sharp_shooter: {
        id: 'sharp_shooter',
        name: 'Sharp Shooter',
        description: 'Maintain 80% accuracy over 50 questions',
        tier: 'silver',
        icon: '🎯',
        requirement: { type: 'accuracy_threshold', value: 80, count: 50 }
      },
      precision_master: {
        id: 'precision_master',
        name: 'Precision Master',
        description: 'Maintain 90% accuracy over 100 questions',
        tier: 'gold',
        icon: '🏆',
        requirement: { type: 'accuracy_threshold', value: 90, count: 100 }
      },
      flawless_expert: {
        id: 'flawless_expert',
        name: 'Flawless Expert',
        description: 'Maintain 95% accuracy over 200 questions',
        tier: 'platinum',
        icon: '💎',
        requirement: { type: 'accuracy_threshold', value: 95, count: 200 }
      },

      // Streak Badges
      daily_dedication: {
        id: 'daily_dedication',
        name: 'Daily Dedication',
        description: 'Maintain a 7-day streak',
        tier: 'bronze',
        icon: '🔥',
        requirement: { type: 'streak', value: 7 }
      },
      weekly_warrior: {
        id: 'weekly_warrior',
        name: 'Weekly Warrior',
        description: 'Maintain a 14-day streak',
        tier: 'silver',
        icon: '⚡',
        requirement: { type: 'streak', value: 14 }
      },
      monthly_champion: {
        id: 'monthly_champion',
        name: 'Monthly Champion',
        description: 'Maintain a 30-day streak',
        tier: 'gold',
        icon: '🌟',
        requirement: { type: 'streak', value: 30 }
      },
      unstoppable_force: {
        id: 'unstoppable_force',
        name: 'Unstoppable Force',
        description: 'Maintain a 60-day streak',
        tier: 'platinum',
        icon: '🚀',
        requirement: { type: 'streak', value: 60 }
      },
      eternal_flame: {
        id: 'eternal_flame',
        name: 'Eternal Flame',
        description: 'Maintain a 100-day streak',
        tier: 'diamond',
        icon: '💫',
        requirement: { type: 'streak', value: 100 }
      },

      // Exam-Specific Badges
      ms900_starter: {
        id: 'ms900_starter',
        name: 'MS-900 Starter',
        description: 'Complete 25 MS-900 questions',
        tier: 'bronze',
        icon: '📘',
        requirement: { type: 'exam_questions', exam: 'MS-900', value: 25 }
      },
      ms900_proficient: {
        id: 'ms900_proficient',
        name: 'MS-900 Proficient',
        description: 'Complete all MS-900 questions with 80% accuracy',
        tier: 'gold',
        icon: '🏅',
        requirement: { type: 'exam_mastery', exam: 'MS-900', accuracy: 80 }
      },
      ms102_expert: {
        id: 'ms102_expert',
        name: 'MS-102 Expert',
        description: 'Complete all MS-102 questions with 90% accuracy',
        tier: 'platinum',
        icon: '👨‍💼',
        requirement: { type: 'exam_mastery', exam: 'MS-102', accuracy: 90 }
      },
      az104_administrator: {
        id: 'az104_administrator',
        name: 'Azure Administrator',
        description: 'Complete all AZ-104 questions with 85% accuracy',
        tier: 'gold',
        icon: '☁️',
        requirement: { type: 'exam_mastery', exam: 'AZ-104', accuracy: 85 }
      },
      az204_developer: {
        id: 'az204_developer',
        name: 'Azure Developer',
        description: 'Complete all AZ-204 questions with 85% accuracy',
        tier: 'gold',
        icon: '💻',
        requirement: { type: 'exam_mastery', exam: 'AZ-204', accuracy: 85 }
      },
      az305_architect: {
        id: 'az305_architect',
        name: 'Azure Architect',
        description: 'Complete all AZ-305 questions with 90% accuracy',
        tier: 'platinum',
        icon: '🏗️',
        requirement: { type: 'exam_mastery', exam: 'AZ-305', accuracy: 90 }
      },

      // Study Session Badges
      speed_learner: {
        id: 'speed_learner',
        name: 'Speed Learner',
        description: 'Complete 20 questions in one session',
        tier: 'bronze',
        icon: '⚡',
        requirement: { type: 'session_questions', value: 20 }
      },
      marathon_student: {
        id: 'marathon_student',
        name: 'Marathon Student',
        description: 'Study for 2 hours continuously',
        tier: 'silver',
        icon: '🏃',
        requirement: { type: 'session_duration', value: 120 }
      },
      ultra_learner: {
        id: 'ultra_learner',
        name: 'Ultra Learner',
        description: 'Study for 4 hours continuously',
        tier: 'gold',
        icon: '🎓',
        requirement: { type: 'session_duration', value: 240 }
      },

      // Domain Mastery Badges
      identity_master: {
        id: 'identity_master',
        name: 'Identity Master',
        description: 'Master all Identity & Access Management questions',
        tier: 'gold',
        icon: '🔐',
        requirement: { type: 'domain_mastery', domain: 'Identity and Access Management' }
      },
      security_expert: {
        id: 'security_expert',
        name: 'Security Expert',
        description: 'Master all Security questions',
        tier: 'gold',
        icon: '🛡️',
        requirement: { type: 'domain_mastery', domain: 'Security and Threat Management' }
      },
      compliance_guru: {
        id: 'compliance_guru',
        name: 'Compliance Guru',
        description: 'Master all Compliance questions',
        tier: 'gold',
        icon: '📋',
        requirement: { type: 'domain_mastery', domain: 'Compliance Management' }
      },
      compute_specialist: {
        id: 'compute_specialist',
        name: 'Compute Specialist',
        description: 'Master all Compute-related questions',
        tier: 'gold',
        icon: '⚙️',
        requirement: { type: 'domain_mastery', domain: 'Deploy and Manage Compute Resources' }
      },
      storage_pro: {
        id: 'storage_pro',
        name: 'Storage Pro',
        description: 'Master all Storage-related questions',
        tier: 'gold',
        icon: '💾',
        requirement: { type: 'domain_mastery', domain: 'Implement and Manage Storage' }
      },
      networking_ninja: {
        id: 'networking_ninja',
        name: 'Networking Ninja',
        description: 'Master all Networking questions',
        tier: 'gold',
        icon: '🌐',
        requirement: { type: 'domain_mastery', domain: 'Configure and Manage Virtual Networking' }
      },

      // Special Achievement Badges
      early_bird: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Study before 6 AM',
        tier: 'bronze',
        icon: '🌅',
        requirement: { type: 'time_based', hour: 6, before: true }
      },
      night_owl: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Study after 10 PM',
        tier: 'bronze',
        icon: '🦉',
        requirement: { type: 'time_based', hour: 22, before: false }
      },
      weekend_warrior: {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Study on 10 weekends',
        tier: 'silver',
        icon: '📅',
        requirement: { type: 'weekend_sessions', value: 10 }
      },
      comeback_kid: {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Return after a 30-day break',
        tier: 'silver',
        icon: '🔄',
        requirement: { type: 'return_from_break', days: 30 }
      },
      multi_cert_hunter: {
        id: 'multi_cert_hunter',
        name: 'Multi-Cert Hunter',
        description: 'Study for 3 different certifications',
        tier: 'gold',
        icon: '🎯',
        requirement: { type: 'multiple_exams', value: 3 }
      },
      full_stack_master: {
        id: 'full_stack_master',
        name: 'Full Stack Master',
        description: 'Complete questions from all exam categories',
        tier: 'platinum',
        icon: '🌟',
        requirement: { type: 'all_exam_categories' }
      },

      // Progress Milestones
      level_10: {
        id: 'level_10',
        name: 'Level 10 Milestone',
        description: 'Reach level 10',
        tier: 'bronze',
        icon: '🔟',
        requirement: { type: 'level', value: 10 }
      },
      level_25: {
        id: 'level_25',
        name: 'Level 25 Milestone',
        description: 'Reach level 25',
        tier: 'silver',
        icon: '2️⃣5️⃣',
        requirement: { type: 'level', value: 25 }
      },
      level_50: {
        id: 'level_50',
        name: 'Level 50 Milestone',
        description: 'Reach level 50',
        tier: 'gold',
        icon: '5️⃣0️⃣',
        requirement: { type: 'level', value: 50 }
      },
      level_75: {
        id: 'level_75',
        name: 'Level 75 Milestone',
        description: 'Reach level 75',
        tier: 'platinum',
        icon: '7️⃣5️⃣',
        requirement: { type: 'level', value: 75 }
      },
      level_100: {
        id: 'level_100',
        name: 'Level 100 Master',
        description: 'Reach the maximum level',
        tier: 'diamond',
        icon: '💯',
        requirement: { type: 'level', value: 100 }
      },

      // XP Milestones
      xp_1000: {
        id: 'xp_1000',
        name: '1,000 XP',
        description: 'Earn 1,000 total XP',
        tier: 'bronze',
        icon: '⚡',
        requirement: { type: 'total_xp', value: 1000 }
      },
      xp_10000: {
        id: 'xp_10000',
        name: '10,000 XP',
        description: 'Earn 10,000 total XP',
        tier: 'silver',
        icon: '💫',
        requirement: { type: 'total_xp', value: 10000 }
      },
      xp_50000: {
        id: 'xp_50000',
        name: '50,000 XP',
        description: 'Earn 50,000 total XP',
        tier: 'gold',
        icon: '✨',
        requirement: { type: 'total_xp', value: 50000 }
      },
      xp_100000: {
        id: 'xp_100000',
        name: '100,000 XP',
        description: 'Earn 100,000 total XP',
        tier: 'platinum',
        icon: '🌟',
        requirement: { type: 'total_xp', value: 100000 }
      }
    };
  }

  /**
   * Initialize rank definitions
   */
  initializeRanks() {
    return [
      { level: 1, name: 'Novice', minXP: 0, icon: '🌱' },
      { level: 5, name: 'Apprentice', minXP: 500, icon: '📘' },
      { level: 10, name: 'Student', minXP: 1500, icon: '🎓' },
      { level: 15, name: 'Practitioner', minXP: 3500, icon: '💼' },
      { level: 20, name: 'Specialist', minXP: 7000, icon: '⚙️' },
      { level: 25, name: 'Professional', minXP: 12000, icon: '👔' },
      { level: 30, name: 'Expert', minXP: 19000, icon: '🏆' },
      { level: 35, name: 'Consultant', minXP: 28000, icon: '💡' },
      { level: 40, name: 'Architect', minXP: 40000, icon: '🏗️' },
      { level: 45, name: 'Master', minXP: 55000, icon: '👑' },
      { level: 50, name: 'Guru', minXP: 75000, icon: '🧙' },
      { level: 60, name: 'Legend', minXP: 110000, icon: '⭐' },
      { level: 70, name: 'Champion', minXP: 160000, icon: '🥇' },
      { level: 80, name: 'Elite', minXP: 230000, icon: '💎' },
      { level: 90, name: 'Grand Master', minXP: 320000, icon: '👑✨' },
      { level: 100, name: 'Legendary Master', minXP: 500000, icon: '🌟👑💎' }
    ];
  }

  /**
   * Calculate XP required for level
   */
  calculateXPForLevel(level) {
    if (level <= 1) return 0;
    return Math.floor(this.xpConfig.baseXP * Math.pow(this.xpConfig.multiplier, level - 1));
  }

  /**
   * Calculate level from XP
   */
  calculateLevelFromXP(xp) {
    let level = 1;
    let totalXP = 0;

    while (level < this.xpConfig.maxLevel) {
      const xpForNextLevel = this.calculateXPForLevel(level + 1);
      if (totalXP + xpForNextLevel > xp) break;
      totalXP += xpForNextLevel;
      level++;
    }

    return {
      level,
      currentLevelXP: xp - totalXP,
      xpForNextLevel: this.calculateXPForLevel(level + 1)
    };
  }

  /**
   * Get current rank from level
   */
  getRankFromLevel(level) {
    for (let i = this.ranks.length - 1; i >= 0; i--) {
      if (level >= this.ranks[i].level) {
        return this.ranks[i];
      }
    }
    return this.ranks[0];
  }

  /**
   * Award XP
   */
  awardXP(amount, reason = 'Activity') {
    const user = this.getUserProgress();
    const newXP = user.xp + amount;
    const oldLevel = user.level;

    const levelInfo = this.calculateLevelFromXP(newXP);
    const newLevel = levelInfo.level;

    // Update database
    this.db.prepare(`
      UPDATE user_progress
      SET xp = ?, level = ?, rank = ?, last_activity = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newXP, newLevel, this.getRankFromLevel(newLevel).name, 1);

    // Log XP gain
    this.db.prepare(`
      INSERT INTO xp_history (user_id, amount, reason, timestamp)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(1, amount, reason);

    // Check for level up
    if (newLevel > oldLevel) {
      this.handleLevelUp(oldLevel, newLevel);
    }

    // Check for badge unlocks
    this.checkBadgeUnlocks();

    this.emit('xp-awarded', { amount, newXP, level: newLevel, reason });

    return {
      amount,
      newXP,
      level: newLevel,
      levelUp: newLevel > oldLevel,
      oldLevel,
      rank: this.getRankFromLevel(newLevel)
    };
  }

  /**
   * Handle level up
   */
  handleLevelUp(oldLevel, newLevel) {
    console.log(`[GamificationEngine] Level up! ${oldLevel} -> ${newLevel}`);

    // Award bonus XP for leveling up
    const bonusXP = newLevel * 10;

    this.emit('level-up', { oldLevel, newLevel, bonusXP });

    // Check for level milestone badges
    this.checkBadgeUnlocks();
  }

  /**
   * Update streak
   */
  updateStreak() {
    const user = this.getUserProgress();
    const now = new Date();
    const lastActivity = user.last_activity ? new Date(user.last_activity) : null;

    let newStreak = user.streak_current;

    if (!lastActivity) {
      // First activity
      newStreak = 1;
    } else {
      const daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

      if (daysSinceLastActivity === 0) {
        // Same day, no change
        return;
      } else if (daysSinceLastActivity === 1) {
        // Next day, increment streak
        newStreak++;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(user.streak_longest, newStreak);

    this.db.prepare(`
      UPDATE user_progress
      SET streak_current = ?, streak_longest = ?, last_activity = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newStreak, longestStreak, 1);

    if (newStreak > user.streak_current) {
      this.emit('streak-updated', { streak: newStreak });
      this.checkBadgeUnlocks();
    }
  }

  /**
   * Record question answer
   */
  recordAnswer(questionId, correct, examCode) {
    // Record in database
    this.db.prepare(`
      INSERT INTO answer_history (user_id, question_id, correct, exam_code, timestamp)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(1, questionId, correct ? 1 : 0, examCode);

    // Award XP
    const xpAmount = correct ? 10 : 5; // 10 XP for correct, 5 for attempt
    this.awardXP(xpAmount, correct ? 'Correct answer' : 'Question attempt');

    // Update streak
    this.updateStreak();

    // Check badges
    this.checkBadgeUnlocks();
  }

  /**
   * Get user progress
   */
  getUserProgress() {
    return this.db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(1);
  }

  /**
   * Get user statistics
   */
  getUserStats() {
    const user = this.getUserProgress();

    // Calculate total questions answered
    const totalAnswers = this.db.prepare(`
      SELECT COUNT(*) as count FROM answer_history WHERE user_id = ?
    `).get(1).count;

    // Calculate correct answers
    const correctAnswers = this.db.prepare(`
      SELECT COUNT(*) as count FROM answer_history WHERE user_id = ? AND correct = 1
    `).get(1).count;

    // Calculate accuracy
    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers * 100).toFixed(1) : 0;

    // Get earned badges
    const earnedBadges = this.db.prepare(`
      SELECT * FROM user_badges WHERE user_id = ?
    `).all(1);

    return {
      level: user.level,
      xp: user.xp,
      rank: user.rank,
      rankInfo: this.getRankFromLevel(user.level),
      streakCurrent: user.streak_current,
      streakLongest: user.streak_longest,
      totalQuestions: totalAnswers,
      correctAnswers,
      accuracy: parseFloat(accuracy),
      badgesEarned: earnedBadges.length,
      totalBadges: Object.keys(this.badges).length
    };
  }

  /**
   * Check for badge unlocks
   */
  checkBadgeUnlocks() {
    const stats = this.getUserStats();
    const user = this.getUserProgress();

    Object.values(this.badges).forEach(badge => {
      // Check if already earned
      const earned = this.db.prepare(`
        SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?
      `).get(1, badge.id);

      if (earned) return;

      // Check if requirements met
      if (this.checkBadgeRequirement(badge, stats, user)) {
        this.unlockBadge(badge);
      }
    });
  }

  /**
   * Check if badge requirement is met
   */
  checkBadgeRequirement(badge, stats, user) {
    const req = badge.requirement;

    switch (req.type) {
      case 'questions_answered':
        return stats.totalQuestions >= req.value;

      case 'accuracy_threshold':
        return stats.totalQuestions >= req.count && stats.accuracy >= req.value;

      case 'perfect_streak':
        // Check last N answers for 100% accuracy
        const recentAnswers = this.db.prepare(`
          SELECT correct FROM answer_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?
        `).all(1, req.value);
        return recentAnswers.length === req.value && recentAnswers.every(a => a.correct === 1);

      case 'streak':
        return user.streak_current >= req.value;

      case 'level':
        return user.level >= req.value;

      case 'total_xp':
        return user.xp >= req.value;

      case 'exam_questions':
        const examQuestions = this.db.prepare(`
          SELECT COUNT(*) as count FROM answer_history WHERE user_id = ? AND exam_code = ?
        `).get(1, req.exam).count;
        return examQuestions >= req.value;

      case 'exam_mastery':
        const examStats = this.db.prepare(`
          SELECT
            COUNT(*) as total,
            SUM(correct) as correct
          FROM answer_history
          WHERE user_id = ? AND exam_code = ?
        `).get(1, req.exam);
        if (!examStats.total) return false;
        const examAccuracy = (examStats.correct / examStats.total * 100);
        return examAccuracy >= req.accuracy;

      default:
        return false;
    }
  }

  /**
   * Unlock badge
   */
  unlockBadge(badge) {
    this.db.prepare(`
      INSERT INTO user_badges (user_id, badge_id, earned_date)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(1, badge.id);

    // Award bonus XP based on tier
    const tierXP = {
      bronze: 50,
      silver: 100,
      gold: 200,
      platinum: 500,
      diamond: 1000
    };

    const bonusXP = tierXP[badge.tier] || 50;
    this.awardXP(bonusXP, `Badge: ${badge.name}`);

    console.log(`[GamificationEngine] Badge unlocked: ${badge.name}`);
    this.emit('badge-unlocked', badge);
  }

  /**
   * Get all badges with earned status
   */
  getAllBadges() {
    const earnedBadges = this.db.prepare(`
      SELECT badge_id FROM user_badges WHERE user_id = ?
    `).all(1);

    const earnedIds = new Set(earnedBadges.map(b => b.badge_id));

    return Object.values(this.badges).map(badge => ({
      ...badge,
      earned: earnedIds.has(badge.id)
    }));
  }

  /**
   * Get progress summary
   */
  getProgressSummary() {
    const stats = this.getUserStats();
    const user = this.getUserProgress();
    const levelInfo = this.calculateLevelFromXP(user.xp);

    return {
      level: {
        current: user.level,
        progress: (levelInfo.currentLevelXP / levelInfo.xpForNextLevel * 100).toFixed(1),
        xpCurrent: levelInfo.currentLevelXP,
        xpRequired: levelInfo.xpForNextLevel
      },
      rank: stats.rankInfo,
      xp: {
        total: user.xp,
        current: levelInfo.currentLevelXP,
        required: levelInfo.xpForNextLevel
      },
      streak: {
        current: user.streak_current,
        longest: user.streak_longest
      },
      performance: {
        totalQuestions: stats.totalQuestions,
        correctAnswers: stats.correctAnswers,
        accuracy: stats.accuracy
      },
      badges: {
        earned: stats.badgesEarned,
        total: stats.totalBadges,
        percentage: ((stats.badgesEarned / stats.totalBadges) * 100).toFixed(1)
      }
    };
  }
}

module.exports = GamificationEngine;
