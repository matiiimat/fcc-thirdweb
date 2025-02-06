import { base } from "thirdweb/chains";

// Export Base chain for ThirdWeb
export { base };

// Game constants
export const PLAYER_CONSTANTS = {
  MIN_STAT_VALUE: 0,
  MAX_STAT_VALUE: 20,
  DEFAULT_STAT_VALUE: 1,
  DEFAULT_MONEY: 0,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  DEFAULT_TEAM: 'Unassigned',
};

// Training constants
export const TRAINING_CONSTANTS = {
  MAX_WORK_ETHIC_BONUS: 1, // 100% bonus at max work ethic
  WORK_ETHIC_POINTS_PER_DAY: 2, // Points gained per consecutive day
  MAX_TRAINING_BONUS: 2.0, // Maximum training bonus
  MIN_TRAINING_BONUS: 0.1, // Minimum training bonus
  TRAINING_COOLDOWN_HOURS: 6, // Hours between training sessions
  WORK_COOLDOWN_HOURS: 8, // Hours between work sessions
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
  INVALID_PLAYER_NAME: `Player name must be between ${PLAYER_CONSTANTS.MIN_NAME_LENGTH} and ${PLAYER_CONSTANTS.MAX_NAME_LENGTH} characters`,
  INVALID_STAT_VALUE: `Stat value must be between ${PLAYER_CONSTANTS.MIN_STAT_VALUE} and ${PLAYER_CONSTANTS.MAX_STAT_VALUE}`,
  INVALID_MONEY_VALUE: 'Money value must be a positive number',
  INVALID_ETH_ADDRESS: 'Invalid ETH address format',
  INVALID_INVESTMENT_TYPE: 'Invalid investment type',
  INVALID_INVESTMENT_AMOUNT: 'Investment amount must be a positive number',
  INVALID_STAT: 'Invalid stat name',
  STAT_MAX_LEVEL: `Stat is already at maximum level (${PLAYER_CONSTANTS.MAX_STAT_VALUE})`,
};

// Validation constants
export const VALIDATION = {
  ETH_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  MIN_INVESTMENT_AMOUNT: 0,
};

// Star rating thresholds
export const STAR_RATING_THRESHOLD = 4; // Stars per rating point