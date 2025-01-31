import { IPlayerStats } from '../models/Player';

// Training bonus ranges based on current skill level
const TRAINING_BONUS_RANGES = {
  NOVICE: { min: 0.4, max: 0.6, maxSkill: 5 },
  INTERMEDIATE: { min: 0.3, max: 0.4, maxSkill: 10 },
  ADVANCED: { min: 0.2, max: 0.3, maxSkill: 16 },
  EXPERT: { min: 0.1, max: 0.2, maxSkill: 19 },
  MASTER: { min: 0.1, max: 0.1, maxSkill: 20 },
};

// Get random number between min and max
function getRandomBonus(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Get training bonus based on current skill level
function getTrainingBonus(currentSkill: number): number {
  if (currentSkill <= TRAINING_BONUS_RANGES.NOVICE.maxSkill) {
    return getRandomBonus(TRAINING_BONUS_RANGES.NOVICE.min, TRAINING_BONUS_RANGES.NOVICE.max);
  } else if (currentSkill <= TRAINING_BONUS_RANGES.INTERMEDIATE.maxSkill) {
    return getRandomBonus(TRAINING_BONUS_RANGES.INTERMEDIATE.min, TRAINING_BONUS_RANGES.INTERMEDIATE.max);
  } else if (currentSkill <= TRAINING_BONUS_RANGES.ADVANCED.maxSkill) {
    return getRandomBonus(TRAINING_BONUS_RANGES.ADVANCED.min, TRAINING_BONUS_RANGES.ADVANCED.max);
  } else if (currentSkill <= TRAINING_BONUS_RANGES.EXPERT.maxSkill) {
    return getRandomBonus(TRAINING_BONUS_RANGES.EXPERT.min, TRAINING_BONUS_RANGES.EXPERT.max);
  } else {
    return TRAINING_BONUS_RANGES.MASTER.min;
  }
}

// Get random trainable stat
export function getRandomTrainableStat(): keyof IPlayerStats {
  const stats: (keyof IPlayerStats)[] = [
    'strength',
    'stamina',
    'passing',
    'shooting',
    'defending',
    'speed',
    'positioning',
  ];
  return stats[Math.floor(Math.random() * stats.length)];
}

// Check if player can train today
export function canTrainToday(lastTrainingDate: Date | null): boolean {
  if (!lastTrainingDate) return true;

  const now = new Date();
  const lastTraining = new Date(lastTrainingDate);

  // Reset hours, minutes, seconds, and milliseconds for date comparison
  now.setHours(0, 0, 0, 0);
  lastTraining.setHours(0, 0, 0, 0);

  return now.getTime() > lastTraining.getTime();
}

// Calculate training result
export function calculateTrainingResult(
  currentStats: IPlayerStats
): {
  trainedStat: keyof IPlayerStats;
  bonus: number;
  newValue: number;
} {
  const trainedStat = getRandomTrainableStat();
  const currentValue = currentStats[trainedStat];
  const bonus = getTrainingBonus(currentValue);
  const newValue = Math.min(20, Number((currentValue + bonus).toFixed(2)));

  return {
    trainedStat,
    bonus,
    newValue,
  };
}

// Calculate overall player rating
export function calculatePlayerRating(stats: IPlayerStats): number {
  const totalStats = Object.values(stats).reduce((sum, stat) => sum + stat, 0);
  return Number((totalStats / Object.keys(stats).length).toFixed(2));
}

// Format stat name for display
export function formatStatName(stat: string): string {
  return stat.charAt(0).toUpperCase() + stat.slice(1);
}

// Get color class based on stat value
export function getStatColor(value: number): string {
  if (value >= 15) return 'text-green-500';
  if (value >= 10) return 'text-blue-500';
  if (value >= 5) return 'text-yellow-500';
  return 'text-red-500';
}