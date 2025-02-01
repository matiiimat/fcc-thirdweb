import { base } from "thirdweb/chains";

// Export Base chain for ThirdWeb
export { base };

// Game constants
export const MIN_STAT_VALUE = 0;
export const MAX_STAT_VALUE = 20;
export const DEFAULT_STAT_VALUE = 1;
export const DEFAULT_MONEY = 1000;

// Training constants
export const MAX_WORK_ETHIC_BONUS = 1; // 100% bonus at max work ethic
export const WORK_ETHIC_POINTS_PER_DAY = 2; // Points gained per consecutive day
export const MAX_TRAINING_BONUS = 2.0; // Maximum training bonus
export const MIN_TRAINING_BONUS = 0.1; // Minimum training bonus

// Player constants
export const PLAYER_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  DEFAULT_TEAM: 'Unassigned',
};

// Player stats
export const PLAYER_STATS = [
  'strength',
  'stamina',
  'passing',
  'shooting',
  'defending',
  'speed',
  'positioning',
  'workEthic',
] as const;

// Stat names mapping
export const STAT_NAMES = {
  strength: 'Strength',
  stamina: 'Stamina',
  passing: 'Passing',
  shooting: 'Shooting',
  defending: 'Defending',
  speed: 'Speed',
  positioning: 'Positioning',
  workEthic: 'Work Ethic',
} as const;

// Investment types
export const INVESTMENT_TYPES = [
  'training',
  'equipment',
  'coaching',
] as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_NAME_LENGTH: `Player name must be between ${PLAYER_CONSTANTS.MIN_NAME_LENGTH} and ${PLAYER_CONSTANTS.MAX_NAME_LENGTH} characters`,
  INVALID_STAT_VALUE: `Stat value must be between ${MIN_STAT_VALUE} and ${MAX_STAT_VALUE}`,
  INVALID_MONEY_VALUE: 'Money value must be a positive number',
  INVALID_ETH_ADDRESS: 'Invalid ETH address format',
  INVALID_INVESTMENT_TYPE: 'Invalid investment type',
  INVALID_INVESTMENT_AMOUNT: 'Investment amount must be a positive number',
};

// Validation constants
export const VALIDATION = {
  ETH_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  MIN_INVESTMENT_AMOUNT: 0,
};

// Star rating thresholds
export const STAR_RATING_THRESHOLD = 4; // Stars per rating point