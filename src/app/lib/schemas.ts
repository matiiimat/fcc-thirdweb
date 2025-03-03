import { z } from 'zod';
import { PLAYER_CONSTANTS } from './constants';

// Base schemas
export const notificationSchema = z.object({
  fromTeamId: z.string().min(1, 'Team ID is required'),
  toPlayerId: z.string().min(1, 'Player ID is required'),
  type: z.enum(['TEAM_INVITATION']),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']).default('PENDING'),
});

export const playerIdSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
});

export const statsSchema = z.object({
  strength: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
  stamina: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
  passing: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
  shooting: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
  defending: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
  speed: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
  positioning: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
  workEthic: z.number().min(PLAYER_CONSTANTS.MIN_STAT_VALUE).max(PLAYER_CONSTANTS.MAX_STAT_VALUE),
});

// Action-specific schemas
export const trainSchema = playerIdSchema;

export const solomatchSchema = playerIdSchema;

export const storeSchema = z.object({
  ...playerIdSchema.shape,
  item: z.object({
    id: z.enum(['name_change', 'private_trainer', 'management_certificate', 'leave_of_absence', 'energy_drink'])
  }),
  newName: z.string()
    .min(4, 'Name must be at least 4 characters')
    .max(24, 'Name must be less than 24 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  selectedSkill: z.enum([
    'strength',
    'stamina',
    'passing',
    'shooting',
    'defending',
    'speed',
    'positioning'
  ]).optional(),
});

// Validation helper
export function validateSchema<T extends z.ZodType>(schema: T, data: unknown) {
  try {
    return { data: schema.parse(data), error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        data: null, 
        error: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { data: null, error: [{ path: 'unknown', message: 'Validation failed' }] };
  }
}