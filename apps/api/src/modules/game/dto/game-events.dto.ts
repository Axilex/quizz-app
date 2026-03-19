/**
 * DTOs for WebSocket Game Events with Validation
 * 🔒 CRITICAL: Prevent malicious payloads
 */

import type { Difficulty, PowerUpType } from '@/common/types';
import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  Length,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Room Creation DTO
 */
export class CreateRoomDto {
  @IsString()
  @Length(2, 30, { message: 'Le pseudo doit contenir entre 2 et 30 caractères' })
  @Matches(/^[a-zA-Z0-9\s-_]+$/, {
    message: 'Le pseudo ne peut contenir que des lettres, chiffres, espaces, - et _',
  })
  playerName!: string;
}

/**
 * Join Room DTO
 */
export class JoinRoomDto {
  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir 6 caractères' })
  @Matches(/^[A-Z0-9]{6}$/, { message: 'Code invalide (A-Z et 0-9 uniquement)' })
  code!: string;

  @IsString()
  @Length(2, 30)
  @Matches(/^[a-zA-Z0-9\s-_]+$/)
  playerName!: string;
}

/**
 * Game Configuration DTO
 */
export class GameConfigDto {
  @IsNumber()
  @Min(5, { message: 'Minimum 5 questions' })
  @Max(100, { message: 'Maximum 100 questions' })
  questionCount!: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une difficulté requise' })
  @ArrayMaxSize(3)
  @IsEnum(['easy', 'medium', 'hard'], { each: true })
  difficulties!: Difficulty[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  categories?: string[];

  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}

/**
 * Submit Answer DTO
 */
export class SubmitAnswerDto {
  @IsString()
  @Length(1, 100, { message: 'ID de question invalide' })
  questionId!: string;

  @IsString()
  @Length(0, 1000, { message: 'Réponse trop longue (max 1000 caractères)' })
  answer!: string;

  @IsNumber()
  @Min(0, { message: 'Le temps ne peut pas être négatif' })
  @Max(300000, { message: 'Temps maximum dépassé (5 minutes)' })
  timeSpent!: number;
}

/**
 * Use Power-Up DTO
 */
export class UsePowerUpDto {
  @IsEnum(
    ['malus_blur', 'malus_freeze', 'malus_speed', 'bonus_fifty50', 'bonus_double', 'bonus_time'],
    {
      message: 'Type de power-up invalide',
    },
  )
  type!: PowerUpType;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  targetPlayerId?: string;
}

/**
 * Host Override DTO (for review corrections)
 */
export class HostOverrideDto {
  @IsString()
  @Length(1, 100)
  playerId!: string;

  @IsString()
  @Length(1, 100)
  questionId!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

/**
 * Review Navigation DTO
 */
export class ReviewNavigateDto {
  @IsEnum(['podium', 'perQuestion', 'perPlayer'], {
    message: 'Mode de vue invalide',
  })
  view!: 'podium' | 'perQuestion' | 'perPlayer';

  @IsNumber()
  @Min(0)
  @Max(999)
  questionIdx!: number;
}

/**
 * Reconnect DTO
 */
export class ReconnectDto {
  @IsString()
  @Length(1, 100)
  playerId!: string;
}
