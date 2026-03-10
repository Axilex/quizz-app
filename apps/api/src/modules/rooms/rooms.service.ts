import { Injectable } from '@nestjs/common';
import type { Room, Player, GameConfig, Question } from '../../common/types';
import { POWERUPS_PER_GAME } from '../../common/types';

const AUTO_VALIDATED_TYPES = new Set(['number', 'qcm', 'chronology', 'intruder', 'geoClickMap']);

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
  points: number;
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
      powerUpsLeft: POWERUPS_PER_GAME,
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
      flashWinner: null,
      isFlashQuestion: false,
      flashIndices: new Set(),
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
      powerUpsLeft: POWERUPS_PER_GAME,
    };

    room.players.set(playerId, player);
    this.socketToRoom.set(socketId, room.id);

    return { room, player };
  }

  getPlayerBySocket(socketId: string): { room: Room; player: Player } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    for (const player of room.players.values()) {
      if (player.socketId === socketId) return { room, player };
    }
    return null;
  }

  startGame(room: Room, config: GameConfig, questions: Question[]): void {
    room.config = config;
    room.questions = questions;
    room.isStarted = true;
    room.currentQuestionIndex = 0;
    room.flashWinner = null;
    room.isFlashQuestion = false;

    // Randomly assign ~20% of questions as flash rounds (min 1 if >= 5 questions)
    room.flashIndices = new Set<number>();
    if (questions.length >= 5) {
      const flashCount = Math.max(1, Math.floor(questions.length * 0.2));
      const indices = [...Array(questions.length).keys()];
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j]!, indices[i]!];
      }
      for (let i = 0; i < flashCount; i++) {
        room.flashIndices.add(indices[i]!);
      }
    }

    for (const player of room.players.values()) {
      player.score = 0;
      player.answers = [];
      player.status = 'answering';
      player.powerUpsLeft = POWERUPS_PER_GAME;
    }
  }

  advanceQuestion(room: Room): boolean {
    room.currentQuestionIndex++;
    room.flashWinner = null;

    if (room.currentQuestionIndex >= room.questions.length) {
      for (const player of room.players.values()) {
        player.status = 'finished';
      }
      return false;
    }

    room.isFlashQuestion = room.flashIndices.has(room.currentQuestionIndex);

    for (const player of room.players.values()) {
      if (player.status !== 'disconnected') {
        player.status = 'answering';
      }
    }
    return true;
  }

  isCurrentFlash(room: Room): boolean {
    return room.flashIndices.has(room.currentQuestionIndex);
  }

  recordAnswer(
    room: Room,
    playerId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    timeSpent: number,
    timedOut: boolean,
    points: number = 0,
  ): void {
    const player = room.players.get(playerId);
    if (!player) return;

    player.answers.push({ questionId, answer, isCorrect, timeSpent, timedOut, points });
    player.score += points;
    player.status = 'waiting';
  }

  allPlayersAnswered(room: Room): boolean {
    for (const player of room.players.values()) {
      if (player.status === 'disconnected') continue;
      if (player.status === 'answering') return false;
    }
    return true;
  }

  usePowerUp(room: Room, playerId: string): boolean {
    const player = room.players.get(playerId);
    if (!player || player.powerUpsLeft <= 0) return false;
    player.powerUpsLeft--;
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
        this.socketToRoom.delete(player.socketId);
        player.socketId = socketId;
        player.status = room.isStarted ? 'answering' : 'connected';
        this.socketToRoom.set(socketId, room.id);
        return { room, player };
      }
    }
    return null;
  }

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
        powerUpsLeft: p.powerUpsLeft,
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

  overrideAnswer(room: Room, playerId: string, questionId: string, isCorrect: boolean): boolean {
    const player = room.players.get(playerId);
    if (!player) return false;

    const answerRecord = player.answers.find((a) => a.questionId === questionId);
    if (!answerRecord) return false;

    const wasCorrect = answerRecord.isCorrect;
    answerRecord.isCorrect = isCorrect;

    // Recompute score delta
    if (wasCorrect && !isCorrect) {
      player.score = Math.max(0, player.score - answerRecord.points);
      answerRecord.points = 0;
    } else if (!wasCorrect && isCorrect) {
      // Grant fixed points for manual override
      const bonus = 300;
      answerRecord.points = bonus;
      player.score += bonus;
    }

    return true;
  }

  buildReviewData(room: Room): QuestionReviewData[] {
    const players = [...room.players.values()];

    return room.questions.map((question) => {
      const autoValidated = AUTO_VALIDATED_TYPES.has(question.type);

      const playerAnswers: ReviewPlayerAnswer[] = players.map((player) => {
        const answerRecord = player.answers.find((a) => a.questionId === question.id);
        return {
          playerId: player.id,
          playerName: player.name,
          answer: answerRecord?.answer ?? '',
          isCorrect: answerRecord?.isCorrect ?? false,
          timeSpent: answerRecord?.timeSpent ?? 0,
          timedOut: answerRecord?.timedOut ?? true,
          hostOverride: null,
          points: answerRecord?.points ?? 0,
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

  getStaleRoomIds(maxIdleAge: number): string[] {
    const now = Date.now();
    const stale: string[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      const age = now - room.createdAt;
      const isEmpty = room.players.size === 0;
      const isIdle = !room.isStarted && age > maxIdleAge;

      if (isEmpty || isIdle) {
        stale.push(roomId);
      }
    }

    return stale;
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const player of room.players.values()) {
      this.socketToRoom.delete(player.socketId);
    }

    this.codeToRoom.delete(room.code);
    this.rooms.delete(roomId);
  }
}
