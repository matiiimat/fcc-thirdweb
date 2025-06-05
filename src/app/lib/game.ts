import { TRAINING_CONSTANTS } from './constants';

// Calculate player rating based on highest stat (excluding work ethic)
export function calculatePlayerRating(stats: any) {
  console.log('Raw stats object:', stats);
  
  const values = Object.entries(stats)
    .filter(([key]) => key !== 'workEthic')
    .map(([key, value]) => {
      const numValue = Number(value);
      console.log(`${key}: ${value} -> ${numValue}`);
      return numValue;
    })
    .filter(value => !isNaN(value)); // Filter out any NaN values
  
  console.log('Processed values:', values);
  console.log('Values array length:', values.length);
  
  if (values.length === 0) {
    console.log('No valid values found, returning 0');
    return 0;
  }
  
  const highestStat = Math.max(...values);
  console.log('Highest stat:', highestStat);
  
  return highestStat;
}

// Get star count based on player rating
export function getStarCount(rating: number): number {
  console.log('Rating passed to getStarCount:', rating, typeof rating);
  
  if (rating >= 16) {
    console.log('Returning 5 stars');
    return 5;
  }
  if (rating >= 12) {
    console.log('Returning 4 stars');
    return 4;
  }
  if (rating >= 8) {
    console.log('Returning 3 stars');
    return 3;
  }
  if (rating >= 6) {
    console.log('Returning 2 stars');
    return 2;
  }
  
  console.log('Returning 1 star (default)');
  return 1;
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
    return { onCooldown: false, remainingTime: "00h 00m" };
  }

  const now = new Date();
  const cooldownHours = isPlaying ?
    TRAINING_CONSTANTS.GAME_COOLDOWN_HOURS :
    TRAINING_CONSTANTS.TRAINING_COOLDOWN_HOURS;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const timeSinceAction = now.getTime() - lastActionDate.getTime();
  
  if (timeSinceAction >= cooldownMs) {
    return { onCooldown: false, remainingTime: "00h 00m" };
  }

  const remainingMs = cooldownMs - timeSinceAction;
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  
  return {
    onCooldown: true,
    remainingTime: `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
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
    // Calculate days since last training
    const daysSinceLastTraining = lastTrainingDay
      ? Math.floor((today.getTime() - lastTrainingDay.getTime()) / oneDayMs)
      : 0;
    
    // Calculate days since last connection
    const daysSinceLastConnection = Math.floor((today.getTime() - lastConnectionDay.getTime()) / oneDayMs);
    
    // If more than 24 hours since last training, decrease work ethic by 1 per day
    if (daysSinceLastTraining > 1) {
      return -daysSinceLastTraining;
    } else {
      // Otherwise, decrease by 1 for each day of inactivity, but never more than 1 per day
      return Math.max(-1, -daysSinceLastConnection);
    }
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

  // Get trainable stats (exclude workEthic and stats at 20)
  const trainableStats = Object.entries(currentStats)
    .filter(([key, value]) =>
      key !== 'workEthic' &&
      !key.startsWith('$') &&
      (forcedStat === key || value < 20) // Include if it's the forced stat or not maxed
    )
    .map(([key]) => key);

  if (trainableStats.length === 0) {
    if (forcedStat) {
      throw new Error(`Cannot train ${forcedStat} as it's already maxed`);
    }
    throw new Error('All trainable stats are maxed');
  }

  // Use forced stat or randomly select one from non-maxed stats
  const trainedStat = forcedStat || trainableStats[Math.floor(Math.random() * trainableStats.length)];
  const currentValue = currentStats[trainedStat];

  if (typeof currentValue !== 'number' || isNaN(currentValue)) {
    throw new Error(`Invalid value for stat ${trainedStat}: ${currentValue}`);
  }

  // Validate forced stat is trainable
  if (forcedStat && !trainableStats.includes(forcedStat)) {
    throw new Error(`Invalid stat for training: ${forcedStat}`);
  }

  // Calculate bonus based on current stat value tier (divided by 2)
  let bonus;
  if (currentValue < 5) {
    // 0-5: bonus 0.2 to 0.3
    bonus = 0.2 + Math.random() * 0.1;
  } else if (currentValue < 10) {
    // 5-10: bonus 0.15 to 0.2
    bonus = 0.15 + Math.random() * 0.05;
  } else if (currentValue < 16) {
    // 10-16: bonus 0.1 to 0.15
    bonus = 0.1 + Math.random() * 0.05;
  } else if (currentValue < 19) {
    // 16-19: bonus 0.05 to 0.1
    bonus = 0.05 + Math.random() * 0.05;
  } else {
    // 19-20: fixed 0.05
    bonus = 0.05;
  }

  return {
    trainedStat,
    currentValue,
    newValue: Math.min(20, currentValue + bonus),
    bonus,
  };
}