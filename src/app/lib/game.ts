// Calculate player rating based on stats
export function calculatePlayerRating(stats: any) {
  const values = Object.values(stats).map(Number);
  const sum = values.reduce((a: number, b: number) => a + b, 0);
  return sum / values.length;
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

// Calculate total capital (money + investments)
export function calculateTotalCapital(money: number, investments: Array<{ amount: number }>) {
  const investmentTotal = investments.reduce((sum, inv) => sum + inv.amount, 0);
  return money + investmentTotal;
}

// Format currency with $ symbol
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
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
export function calculateTrainingResult(stats: any) {
  // Convert stats to plain object and ensure they're numbers
  const currentStats = toPlainObject(stats);

  // Get trainable stats (exclude workEthic)
  const trainableStats = Object.entries(currentStats)
    .filter(([key]) => key !== 'workEthic' && !key.startsWith('$'))
    .map(([key]) => key);

  if (trainableStats.length === 0) {
    throw new Error('No valid stats found for training');
  }

  // Randomly select a stat to train
  const trainedStat = trainableStats[Math.floor(Math.random() * trainableStats.length)];
  const currentValue = currentStats[trainedStat];

  if (typeof currentValue !== 'number' || isNaN(currentValue)) {
    throw new Error(`Invalid value for stat ${trainedStat}: ${currentValue}`);
  }

  // Calculate bonus (higher bonus for lower stats)
  const baseBonus = (20 - currentValue) / 10; // Max 2.0 bonus at stat level 0
  const randomFactor = 0.5 + Math.random(); // Random factor between 0.5 and 1.5
  const bonus = Math.max(0.1, Math.min(baseBonus * randomFactor, 2.0)); // Clamp bonus between 0.1 and 2.0

  return {
    trainedStat,
    currentValue,
    newValue: Math.min(20, currentValue + bonus),
    bonus,
  };
}