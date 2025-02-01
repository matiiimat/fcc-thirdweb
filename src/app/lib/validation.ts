import { IPlayer, IPlayerStats } from '../models/Player';
import {
  PLAYER_CONSTANTS,
  PLAYER_STATS,
  ERROR_MESSAGES,
  VALIDATION,
  INVESTMENT_TYPES,
} from './constants';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

type StatKey = keyof IPlayerStats;
type PlayerStat = typeof PLAYER_STATS[number];

export const validatePlayerStats = (stats: Partial<IPlayerStats>): void => {
  // Convert readonly array to regular array of stat keys
  const validStatKeys = [...PLAYER_STATS] as StatKey[];

  for (const stat of Object.keys(stats)) {
    if (!validStatKeys.includes(stat as StatKey)) {
      throw new ValidationError(`Invalid stat name: ${stat}`);
    }

    const value = stats[stat as keyof IPlayerStats];
    if (value !== undefined) {
      if (typeof value !== 'number') {
        throw new ValidationError(`${stat} must be a number`);
      }
      if (value < PLAYER_CONSTANTS.MIN_STAT_VALUE || value > PLAYER_CONSTANTS.MAX_STAT_VALUE) {
        throw new ValidationError(
          `${stat} must be between ${PLAYER_CONSTANTS.MIN_STAT_VALUE} and ${PLAYER_CONSTANTS.MAX_STAT_VALUE}`
        );
      }
    }
  }
};

export const validatePlayerData = (data: Partial<IPlayer>): void => {
  // Validate player name
  if (data.playerName !== undefined) {
    if (typeof data.playerName !== 'string') {
      throw new ValidationError('Player name must be a string');
    }
    if (
      data.playerName.length < PLAYER_CONSTANTS.MIN_NAME_LENGTH ||
      data.playerName.length > PLAYER_CONSTANTS.MAX_NAME_LENGTH
    ) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_PLAYER_NAME);
    }
  }

  // Validate ETH address
  if (data.ethAddress !== undefined) {
    if (typeof data.ethAddress !== 'string') {
      throw new ValidationError('ETH address must be a string');
    }
    if (!VALIDATION.ETH_ADDRESS_REGEX.test(data.ethAddress)) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_ETH_ADDRESS);
    }
  }

  // Validate team
  if (data.team !== undefined) {
    if (typeof data.team !== 'string') {
      throw new ValidationError('Team must be a string');
    }
    if (data.team.length < 1) {
      throw new ValidationError('Team name cannot be empty');
    }
  }

  // Validate money
  if (data.money !== undefined) {
    if (typeof data.money !== 'number') {
      throw new ValidationError('Money must be a number');
    }
    if (data.money < 0) {
      throw new ValidationError('Money cannot be negative');
    }
  }

  // Validate stats if present
  if (data.stats) {
    validatePlayerStats(data.stats);
  }

  // Validate investments if present
  if (data.investments) {
    if (!Array.isArray(data.investments)) {
      throw new ValidationError('Investments must be an array');
    }

    data.investments.forEach((investment, index) => {
      if (typeof investment.type !== 'string') {
        throw new ValidationError(`Investment ${index} type must be a string`);
      }
      if (typeof investment.amount !== 'number') {
        throw new ValidationError(`Investment ${index} amount must be a number`);
      }
      if (investment.amount < 0) {
        throw new ValidationError(`Investment ${index} amount cannot be negative`);
      }
    });
  }
};

export const validateTrainingRequest = (
  statToTrain: string,
  currentValue: number
): void => {
  // Convert readonly array to regular array of stat keys
  const validStats = [...PLAYER_STATS] as StatKey[];

  if (!validStats.includes(statToTrain as StatKey)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_STAT);
  }

  if (currentValue >= PLAYER_CONSTANTS.MAX_STAT_VALUE) {
    throw new ValidationError(ERROR_MESSAGES.STAT_MAX_LEVEL);
  }
};

export const validateInvestment = (
  type: string,
  amount: number
): void => {
  // Convert readonly array to regular array
  const validTypes = [...INVESTMENT_TYPES];

  if (!validTypes.includes(type as typeof INVESTMENT_TYPES[number])) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_INVESTMENT_TYPE);
  }

  // Validate amount
  if (amount <= VALIDATION.MIN_INVESTMENT_AMOUNT) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_INVESTMENT_AMOUNT);
  }
};

// Helper function to validate ETH address format
export const isValidEthAddress = (address: string): boolean => {
  return VALIDATION.ETH_ADDRESS_REGEX.test(address);
};

// Helper function to validate player name
export const isValidPlayerName = (name: string): boolean => {
  return (
    name.length >= PLAYER_CONSTANTS.MIN_NAME_LENGTH &&
    name.length <= PLAYER_CONSTANTS.MAX_NAME_LENGTH
  );
};