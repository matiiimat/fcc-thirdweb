import { TRAINING_CONSTANTS } from './constants';

// Calculate player rating based on highest stat (excluding work ethic)
export function calculatePlayerRating(stats: any) {
  const values = Object.entries(stats)
    .filter(([key]) => key !== 'workEthic')
    .map(([_, value]) => Number(value));
  const highestStat = Math.max(...values);
  return highestStat / 4;
}

// Get star rating based on player rating
export function getStarRating(rating: number) {
  const stars = '⭐'.repeat(Math.floor(rating / 4));
  return stars || '⭐';
}

// Get color class based on stat value
export function getStatColor(value: number) {
  if (value >= 15) return 'text-yellow-400'; // Gold
  if (value >= 10) return 'text-green-400'; // Green
  if (value >= 5) return 'text-blue-400'; // Blue
  return 'text-gray-400'; // Gray
}

// Get player stats as array of name/value pairs
export function getPlayerStats(stats: any) {
  const statNames = {
    strength: 'Strength',
    stamina: 'Stamina',
    passing: 'Passing',
    shooting: 'Shooting',
    defending: 'Defending',
    speed: 'Speed',
    positioning: 'Positioning',
    workEthic: 'Work Ethic',
  };

  return Object.entries(stats).map(([key, value]) => ({
    name: statNames[key as keyof typeof statNames],
    value: Number(value),
  }));
}

// Check if action is on cooldown and get remaining time
export function getActionCooldown(lastActionDate: Date | null, isPlaying: boolean = false): {
  onCooldown: boolean;
  remainingTime: string;
} {
  if (!lastActionDate) {
    return { onCooldown: false, remainingTime: "00:00" };
  }

  const now = new Date();
  const cooldownHours = isPlaying ?
    TRAINING_CONSTANTS.GAME_COOLDOWN_HOURS :
    TRAINING_CONSTANTS.TRAINING_COOLDOWN_HOURS;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const timeSinceAction = now.getTime() - lastActionDate.getTime();
  
  if (timeSinceAction >= cooldownMs) {
    return { onCooldown: false, remainingTime: "00:00" };
  }

  const remainingMs = cooldownMs - timeSinceAction;
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  
  return {
    onCooldown: true,
    remainingTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  };
}

// Calculate work ethic changes based on player activity
export function calculateWorkEthicChange(
  lastTrainingDate: Date | null,
  lastConnectionDate: Date | null
): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;

  // If no previous connection, this is first time - no change
  if (!lastConnectionDate) return 0;

  // Convert dates to start of their respective days
  const lastTrainingDay = lastTrainingDate ?
    new Date(lastTrainingDate.getFullYear(), lastTrainingDate.getMonth(), lastTrainingDate.getDate()) :
    null;
  const lastConnectionDay = new Date(
    lastConnectionDate.getFullYear(),
    lastConnectionDate.getMonth(),
    lastConnectionDate.getDate()
  );

  // Check if player was active today (trained)
  const wasActiveToday = lastTrainingDay && lastTrainingDay.getTime() === today.getTime();

  if (wasActiveToday) {
    // Player was active today, increase work ethic by 1
    return 1;
  } else {
    // Calculate days since last connection
    const daysSinceLastConnection = Math.floor((today.getTime() - lastConnectionDay.getTime()) / oneDayMs);
    
    // Decrease by 1 for each day of inactivity, but never more than 1 per day
    return Math.max(-1, -daysSinceLastConnection);
  }
}

// Convert Mongoose document to plain object
function toPlainObject(obj: any): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number' && !isNaN(value)) {
      result[key] = value;
    }
  }
  return result;
}

// Calculate training result
export function calculateTrainingResult(stats: any, forcedStat?: string) {
  // Convert stats to plain object and ensure they're numbers
  const currentStats = toPlainObject(stats);

  // Get trainable stats (exclude workEthic)
  const trainableStats = Object.entries(currentStats)
    .filter(([key]) => key !== 'workEthic' && !key.startsWith('$'))
    .map(([key]) => key);

  if (trainableStats.length === 0) {
    throw new Error('No valid stats found for training');
  }

  // Use forced stat or randomly select one
  const trainedStat = forcedStat || trainableStats[Math.floor(Math.random() * trainableStats.length)];
  const currentValue = currentStats[trainedStat];

  if (typeof currentValue !== 'number' || isNaN(currentValue)) {
    throw new Error(`Invalid value for stat ${trainedStat}: ${currentValue}`);
  }

  // Validate forced stat is trainable
  if (forcedStat && !trainableStats.includes(forcedStat)) {
    throw new Error(`Invalid stat for training: ${forcedStat}`);
  }

  // Calculate bonus based on current stat value tier
  let bonus;
  if (currentValue < 5) {
    // 0-5: bonus 0.4 to 0.6
    bonus = 0.4 + Math.random() * 0.2;
  } else if (currentValue < 10) {
    // 5-10: bonus 0.3 to 0.4
    bonus = 0.3 + Math.random() * 0.1;
  } else if (currentValue < 16) {
    // 10-16: bonus 0.2 to 0.3
    bonus = 0.2 + Math.random() * 0.1;
  } else if (currentValue < 19) {
    // 16-19: bonus 0.1 to 0.2
    bonus = 0.1 + Math.random() * 0.1;
  } else {
    // 19-20: fixed 0.1
    bonus = 0.1;
  }

  return {
    trainedStat,
    currentValue,
    newValue: Math.min(20, currentValue + bonus),
    bonus,
  };
}