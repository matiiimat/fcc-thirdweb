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
    value: Number(value), // Ensure value is a number
  }));
}

// Calculate training result
export function calculateTrainingResult(stats: any) {
  // Convert stats to numbers
  const currentStats = Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [key, Number(value)])
  );

  // Get trainable stats (exclude workEthic)
  const trainableStats = Object.entries(currentStats)
    .filter(([key]) => key !== 'workEthic')
    .map(([key]) => key);

  // Randomly select a stat to train
  const trainedStat = trainableStats[Math.floor(Math.random() * trainableStats.length)];
  const currentValue = currentStats[trainedStat];

  // Calculate bonus (higher bonus for lower stats)
  const baseBonus = (20 - currentValue) / 10; // Max 2.0 bonus at stat level 0
  const randomFactor = 0.5 + Math.random(); // Random factor between 0.5 and 1.5
  const bonus = baseBonus * randomFactor;

  return {
    trainedStat,
    currentValue,
    newValue: currentValue,
    bonus: Math.max(0.1, Math.min(bonus, 2.0)), // Clamp bonus between 0.1 and 2.0
  };
}