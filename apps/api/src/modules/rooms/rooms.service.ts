import { Injectable } from '@nestjs/common';
import type { Room, Player, GameConfig, Question } from '../../common/types';

/** Types that support exact auto-validation */
const AUTO_VALIDATED_TYPES = new Set(['number', 'qcm', 'chronology', 'intruder']);

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface ReviewPlayerAnswer {
  playerId: string;
  playerName: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  timedOut: boolean;
  hostOverride: boolean | null;
}

export interface QuestionReviewData {
  questionId: string;
  questionLabel: string;
  questionType: string;
  correctAnswer: string;
  explanation?: string;
  playerAnswers: ReviewPlayerAnswer[];
  autoValidated: boolean;
}

@Injectable()
export class RoomsService {
  private rooms = new Map<string, Room>();
  private codeToRoom = new Map<string, string>();
  private socketToRoom = new Map<string, string>();

  createRoom(socketId: string, playerName: string): Room {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let code = generateCode();
    while (this.codeToRoom.has(code)) {
      code = generateCode();
    }

    const host: Player = {
      id: playerId,
      socketId,
      name: playerName,
      score: 0,
      status: 'connected',
      isHost: true,
      answers: [],
    };

    const room: Room = {
      id: generateId(),
      code,
      hostId: playerId,
      players: new Map([[playerId, host]]),
      config: null,
      currentQuestionIndex: -1,
      questions: [],
      isStarted: false,
      createdAt: Date.now(),
    };

    this.rooms.set(room.id, room);
    this.codeToRoom.set(code, room.id);
    this.socketToRoom.set(socketId, room.id);

    return room;
  }

  joinRoom(
    code: string,
    socketId: string,
    playerName: string,
  ): { room: Room; player: Player } | null {
    const roomId = this.codeToRoom.get(code.toUpperCase());
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room || room.isStarted) return null;
    if (room.players.size >= 8) return null;

    const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const player: Player = {
      id: playerId,
      socketId,
      name: playerName,
      score: 0,
      status: 'connected',
      isHost: false,
      answers: [],
    };

    room.players.set(playerId, player);
    this.socketToRoom.set(socketId, room.id);

    return { room, player };
  }

  getRoomBySocket(socketId: string): Room | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) ?? null;
  }

  getPlayerBySocket(socketId: string): { room: Room; player: Player } | null {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;
    for (const player of room.players.values()) {
      if (player.socketId === socketId) {
        return { room, player };
      }
    }
    return null;
  }

  startGame(room: Room, config: GameConfig, questions: Question[]): void {
    room.config = config;
    room.questions = questions;
    room.isStarted = true;
    room.currentQuestionIndex = 0;

    for (const player of room.players.values()) {
      player.score = 0;
      player.answers = [];
      player.status = 'answering';
    }
  }

  advanceQuestion(room: Room): boolean {
    room.currentQuestionIndex++;
    if (room.currentQuestionIndex >= room.questions.length) {
      for (const player of room.players.values()) {
        player.status = 'finished';
      }
      return false;
    }

    for (const player of room.players.values()) {
      player.status = 'answering';
    }
    return true;
  }

  recordAnswer(
    room: Room,
    playerId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    timeSpent: number,
    timedOut: boolean,
  ): void {
    const player = room.players.get(playerId);
    if (!player) return;

    player.answers.push({ questionId, answer, isCorrect, timeSpent, timedOut });
    if (isCorrect) player.score++;
    player.status = 'waiting';
  }

  allPlayersAnswered(room: Room): boolean {
    for (const player of room.players.values()) {
      if (player.status === 'connected' || player.status === 'answering') {
        return false;
      }
    }
    return true;
  }

  removePlayer(socketId: string): { room: Room; player: Player; isEmpty: boolean } | null {
    const result = this.getPlayerBySocket(socketId);
    if (!result) return null;

    const { room, player } = result;
    room.players.delete(player.id);
    this.socketToRoom.delete(socketId);

    const isEmpty = room.players.size === 0;
    if (isEmpty) {
      this.rooms.delete(room.id);
      this.codeToRoom.delete(room.code);
    } else if (player.isHost) {
      const nextPlayer = room.players.values().next().value;
      if (nextPlayer) nextPlayer.isHost = true;
      room.hostId = nextPlayer?.id ?? '';
    }

    return { room, player, isEmpty };
  }

  handleReconnect(socketId: string, playerId: string): { room: Room; player: Player } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.get(playerId);
      if (player && player.status === 'disconnected') {
        player.socketId = socketId;
        player.status = 'connected';
        this.socketToRoom.set(socketId, room.id);
        return { room, player };
      }
    }
    return null;
  }

  /** Serialize room for sending to clients */
  serializeRoom(room: Room) {
    return {
      id: room.id,
      code: room.code,
      hostId: room.hostId,
      players: [...room.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        status: p.status,
        isHost: p.isHost,
      })),
      isStarted: room.isStarted,
      maxPlayers: 8,
      createdAt: room.createdAt,
    };
  }

  getScores(room: Room): Record<string, { name: string; score: number; answers: number }> {
    const scores: Record<string, { name: string; score: number; answers: number }> = {};
    for (const player of room.players.values()) {
      scores[player.id] = {
        name: player.name,
        score: player.score,
        answers: player.answers.length,
      };
    }
    return scores;
  }

  /**
   * Override a player's answer validation (host manual review).
   * Recalculates the player's score from scratch.
   */
  overrideAnswer(room: Room, playerId: string, questionId: string, isCorrect: boolean): boolean {
    const player = room.players.get(playerId);
    if (!player) return false;

    const answerRecord = player.answers.find((a) => a.questionId === questionId);
    if (!answerRecord) return false;

    answerRecord.isCorrect = isCorrect;

    // Recalculate player's total score from all answers
    player.score = player.answers.filter((a) => a.isCorrect).length;

    return true;
  }

  /**
   * Build complete review data for all questions in the room.
   * Includes every player's answer per question.
   * This is sent to ALL clients at game:finished so the host can review/override.
   */
  buildReviewData(room: Room): QuestionReviewData[] {
    const players = [...room.players.values()];

    return room.questions.map((question, _qIdx) => {
      const autoValidated = AUTO_VALIDATED_TYPES.has(question.type);

      const playerAnswers: ReviewPlayerAnswer[] = players.map((player) => {
        // Find the player's answer for this question
        const answerRecord = player.answers.find((a) => a.questionId === question.id);

        return {
          playerId: player.id,
          playerName: player.name,
          answer: answerRecord?.answer ?? '',
          isCorrect: answerRecord?.isCorrect ?? false,
          timeSpent: answerRecord?.timeSpent ?? 0,
          timedOut: answerRecord?.timedOut ?? true,
          hostOverride: null,
        };
      });

      return {
        questionId: question.id,
        questionLabel: question.label,
        questionType: question.type,
        correctAnswer: question.answer,
        explanation: question.explanation,
        playerAnswers,
        autoValidated,
      };
    });
  }
}
