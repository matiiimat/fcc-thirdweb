// Player Constants
export const PLAYER_CONSTANTS = {
  INITIAL_MONEY: 1000,
  INITIAL_STATS: 5,
  MAX_STAT_VALUE: 20,
  MIN_STAT_VALUE: 0,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// Training Constants
export const TRAINING_CONSTANTS = {
  BASE_COST: 100,
  COST_MULTIPLIER: 1.5,
  COST_LEVEL_STEP: 2,
  MIN_SUCCESS_RATE: 0.1,
  STAT_INCREASE: 0.5,
  SUCCESS_RATE_DIVISOR: 25,
};

// Investment Constants
export const INVESTMENT_TYPES = {
  SAFE: {
    name: 'Safe Investment',
    minAmount: 100,
    maxReturn: 1.15, // 15% max return
    minReturn: 1.05, // 5% min return
    riskFactor: 0.1, // 10% chance of loss
    maxLoss: 0.95, // 5% max loss
    description: 'Low risk, low reward investment with minimal chance of loss',
  },
  MODERATE: {
    name: 'Moderate Investment',
    minAmount: 500,
    maxReturn: 1.35, // 35% max return
    minReturn: 1.1, // 10% min return
    riskFactor: 0.3, // 30% chance of loss
    maxLoss: 0.8, // 20% max loss
    description: 'Balanced risk and reward with moderate chance of loss',
  },
  RISKY: {
    name: 'Risky Investment',
    minAmount: 1000,
    maxReturn: 2.0, // 100% max return
    minReturn: 1.2, // 20% min return
    riskFactor: 0.6, // 60% chance of loss
    maxLoss: 0.5, // 50% max loss
    description: 'High risk, high reward investment with significant chance of loss',
  },
} as const;

// Game Stats
export const PLAYER_STATS = [
  {
    key: 'strength',
    name: 'Strength',
    description: 'Affects physical challenges and ball control',
  },
  {
    key: 'stamina',
    name: 'Stamina',
    description: 'Determines energy levels and match endurance',
  },
  {
    key: 'passing',
    name: 'Passing',
    description: 'Affects passing accuracy and ball distribution',
  },
  {
    key: 'shooting',
    name: 'Shooting',
    description: 'Determines shooting accuracy and power',
  },
  {
    key: 'defending',
    name: 'Defending',
    description: 'Affects defensive abilities and tackling',
  },
  {
    key: 'speed',
    name: 'Speed',
    description: 'Determines running speed and acceleration',
  },
  {
    key: 'positioning',
    name: 'Positioning',
    description: 'Affects tactical awareness and positioning',
  },
] as const;

// API Endpoints
export const API_ENDPOINTS = {
  PLAYERS: '/api/players',
  PLAYER: (id: string) => `/api/players/${id}`,
  TRAIN: '/api/game/train',
  INVEST: '/api/game/invest',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_STAT: 'Invalid stat to train',
  STAT_MAX_LEVEL: 'Stat is already at maximum level',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  PLAYER_NOT_FOUND: 'Player not found',
  INVALID_ETH_ADDRESS: 'Invalid ETH address format',
  INVALID_PLAYER_NAME: 'Player name must be between 2 and 50 characters',
  INVALID_INVESTMENT_TYPE: 'Invalid investment type',
  INVALID_INVESTMENT_AMOUNT: 'Invalid investment amount',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TRAINING_SUCCESS: (stat: string) => `Successfully trained ${stat}`,
  TRAINING_FAILURE: 'Training attempt failed, but gained experience',
  INVESTMENT_SUCCESS: (profit: number) => `Investment successful! Profit: ${profit}`,
  INVESTMENT_LOSS: (loss: number) => `Investment resulted in a loss of ${loss}`,
  PLAYER_CREATED: 'Player created successfully',
  PLAYER_UPDATED: 'Player updated successfully',
  PLAYER_DELETED: 'Player deleted successfully',
} as const;

// Validation Constants
export const VALIDATION = {
  ETH_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
} as const;