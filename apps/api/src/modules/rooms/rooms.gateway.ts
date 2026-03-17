import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { QuestionsService } from '../questions/questions.service';
import { GameScoringService } from '../game/game-scoring.service';

import type { GameConfig, Room, Question } from '../../common/types';
import { CreateRoomDto, JoinRoomDto, SubmitAnswerDto, UsePowerUpDto } from '../game/dto';

const WS_CORS_ORIGINS = process.env['CORS_ORIGINS']
  ? process.env['CORS_ORIGINS'].split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

const DISCONNECT_GRACE_PERIOD = parseInt(process.env['DISCONNECT_GRACE_MS'] ?? '30000', 10);
const DEBUG_MODE = process.env['DEBUG_MODE'] === 'true';
const ROOM_CLEANUP_INTERVAL = 60_000;
const ROOM_MAX_IDLE_AGE = 2 * 60 * 60 * 1000;

@WebSocketGateway({
  cors: { origin: WS_CORS_ORIGINS, credentials: true },
  namespace: '/game',
  pingInterval: 25_000,
  pingTimeout: 20_000,
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  private roomTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly questionsService: QuestionsService,
    private readonly scoringService: GameScoringService,
  ) {
    setInterval(() => this.cleanupStaleRooms(), ROOM_CLEANUP_INTERVAL);
  }

  // ─────────────────────────────────────────────
  // Connexion / déconnexion
  // ─────────────────────────────────────────────

  handleConnection(client: Socket): void {
    this.logger.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`[WS] Client disconnected: ${client.id}`);

    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result) return;

    const { room, player } = result;
    player.status = 'disconnected';

    this.server.to(room.id).emit('player:disconnected', { playerId: player.id });
    this.cancelDisconnectTimer(player.id);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(player.id);

      if (player.status !== 'disconnected') return;

      this.logger.log(`[WS] Grace period expired for ${player.name} (${player.id}), removing`);

      const removal = this.roomsService.removePlayer(client.id);
      if (!removal) return;

      if (!removal.isEmpty) {
        this.server.to(room.id).emit('player:left', {
          playerId: player.id,
          room: this.roomsService.serializeRoom(room),
        });
      } else {
        this.clearQuestionTimer(room.id);
      }

      if (room.isStarted && this.roomsService.allPlayersAnswered(room)) {
        this.clearQuestionTimer(room.id);
        this.advanceToNextQuestion(room);
      }
    }, DISCONNECT_GRACE_PERIOD);

    this.disconnectTimers.set(player.id, timer);
  }

  // ─────────────────────────────────────────────
  // Room lifecycle
  // ─────────────────────────────────────────────

  @SubscribeMessage('room:create')
  handleCreateRoom(@ConnectedSocket() client: Socket, @MessageBody() dto: CreateRoomDto): void {
    this.logger.log(`[WS] room:create from ${client.id}, name: ${dto.playerName}`);

    const room = this.roomsService.createRoom(client.id, dto.playerName);
    client.join(room.id);

    const host = room.players.values().next().value!;
    client.emit('room:created', {
      room: this.roomsService.serializeRoom(room),
      playerId: host.id,
    });
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() dto: JoinRoomDto): void {
    this.logger.log(`[WS] room:join from ${client.id}, code: ${dto.code}`);

    const result = this.roomsService.joinRoom(dto.code, client.id, dto.playerName);

    if (!result) {
      client.emit('error', {
        message: 'Room introuvable, pleine ou partie déjà lancée',
      });
      return;
    }

    const { room, player } = result;
    client.join(room.id);

    client.emit('room:joined', {
      room: this.roomsService.serializeRoom(room),
      playerId: player.id,
    });

    client.to(room.id).emit('player:joined', {
      player: {
        id: player.id,
        name: player.name,
        score: 0,
        status: 'connected',
        isHost: false,
        powerUpsLeft: player.powerUpsLeft,
      },
      room: this.roomsService.serializeRoom(room),
    });
  }

  @SubscribeMessage('room:reconnect')
  handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string },
  ): void {
    this.cancelDisconnectTimer(data.playerId);

    const result = this.roomsService.handleReconnect(client.id, data.playerId);
    if (!result) {
      client.emit('error', { message: 'Impossible de reconnecter' });
      return;
    }

    const { room, player } = result;
    client.join(room.id);

    this.logger.log(`[WS] Player ${player.name} reconnected to room ${room.code}`);

    this.server.to(room.id).emit('player:reconnected', {
      playerId: player.id,
    });

    const currentQuestion = room.isStarted ? room.questions[room.currentQuestionIndex] : null;
    const isFlash = room.isStarted ? this.roomsService.isCurrentFlash(room) : false;
    const timer = currentQuestion
      ? isFlash
        ? this.scoringService.getFlashTimer()
        : this.scoringService.computeTimer(currentQuestion)
      : 0;

    const review =
      !room.isStarted && room.questions.length > 0
        ? this.roomsService.buildReviewData(room)
        : undefined;

    client.emit('room:reconnected', {
      room: this.roomsService.serializeRoom(room),
      playerId: player.id,
      scores: this.roomsService.getScores(room),
      currentQuestion: currentQuestion ? this.questionsService.toPublic(currentQuestion) : null,
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      timer,
      isFlash,
      isGameStarted: room.isStarted,
      review,
    });
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(@ConnectedSocket() client: Socket): void {
    const result = this.roomsService.removePlayer(client.id);
    if (!result) return;

    this.cancelDisconnectTimer(result.player.id);
    client.leave(result.room.id);

    if (!result.isEmpty) {
      this.server.to(result.room.id).emit('player:left', {
        playerId: result.player.id,
        room: this.roomsService.serializeRoom(result.room),
      });
    } else {
      this.clearQuestionTimer(result.room.id);
    }
  }

  // ─────────────────────────────────────────────
  // Config & démarrage de partie
  // ─────────────────────────────────────────────

  @SubscribeMessage('game:configure')
  handleConfigure(@ConnectedSocket() client: Socket, @MessageBody() config: GameConfig): void {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result || !result.player.isHost) {
      client.emit('error', { message: "Seul l'hôte peut configurer" });
      return;
    }

    result.room.config = config;
    this.server.to(result.room.id).emit('game:configured', { config });
  }

  @SubscribeMessage('game:start')
  handleStartGame(@ConnectedSocket() client: Socket): void {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result || !result.player.isHost) {
      client.emit('error', { message: "Seul l'hôte peut lancer" });
      return;
    }

    const { room } = result;

    if (!room.config) {
      client.emit('error', { message: "Configurez la partie d'abord" });
      return;
    }

    const isDebug = DEBUG_MODE || room.config.debug;
    const questions = isDebug
      ? this.questionsService.getOnePerType()
      : this.questionsService.getRandom(room.config.questionCount, {
          difficulties: room.config.difficulties,
          categories: room.config.categories,
        });

    if (questions.length === 0) {
      client.emit('error', { message: 'Pas assez de questions' });
      return;
    }

    this.roomsService.startGame(room, room.config, questions);

    const firstQuestion = questions[0]!;
    const isFlash = this.roomsService.isCurrentFlash(room);
    const timer = isFlash
      ? this.scoringService.getFlashTimer()
      : this.scoringService.computeTimer(firstQuestion);

    this.logger.log(`[WS] Game started in room ${room.code}, ${questions.length} questions`);

    this.server.to(room.id).emit('game:started', {
      totalQuestions: questions.length,
      question: this.questionsService.toPublic(firstQuestion),
      questionIndex: 0,
      timer,
      isFlash,
    });

    this.startQuestionTimer(room);
  }

  // ─────────────────────────────────────────────
  // Réponses & scoring
  // ─────────────────────────────────────────────

  @SubscribeMessage('game:answer')
  handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() dto: SubmitAnswerDto): void {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result) return;

    const { room, player } = result;

    if (!room.isStarted || player.status !== 'answering') return;

    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion || currentQuestion.id !== dto.questionId) return;

    const isFlash = this.roomsService.isCurrentFlash(room);
    const totalTimerMs =
      (isFlash
        ? this.scoringService.getFlashTimer()
        : this.scoringService.computeTimer(currentQuestion)) * 1000;

    // Pour l’instant : on reste sur la méthode simple du GameScoringService
    const isCorrect = this.scoringService.validateAnswer(currentQuestion, dto.answer);

    let points = 0;
    let flashLate = false;

    if (isCorrect) {
      if (isFlash) {
        if (room.flashWinner === null) {
          room.flashWinner = player.id;
          points = this.scoringService.computePoints(
            true,
            dto.timeSpent,
            totalTimerMs,
            currentQuestion.difficulty,
            true,
          );
        } else {
          // Bonne réponse mais trop tard
          points = 0;
          flashLate = true;
        }
      } else {
        points = this.scoringService.computePoints(
          true,
          dto.timeSpent,
          totalTimerMs,
          currentQuestion.difficulty,
          false,
        );
      }
    }

    this.roomsService.recordAnswer(
      room,
      player.id,
      dto.questionId,
      dto.answer,
      isCorrect,
      dto.timeSpent,
      false,
      points,
    );

    client.emit('game:answerResult', {
      questionId: dto.questionId,
      isCorrect,
      correctAnswer: this.questionsService.getReadableAnswer(currentQuestion),
      explanation: currentQuestion.explanation,
      points,
      flashLate,
    });

    this.server.to(room.id).emit('player:answered', {
      playerId: player.id,
      isCorrect,
      scores: this.roomsService.getScores(room),
    });

    if (isFlash && isCorrect && room.flashWinner === player.id) {
      // Premier bon répondant en flash → on arrête la question
      for (const p of room.players.values()) {
        if (p.status === 'answering' && p.id !== player.id) {
          this.roomsService.recordAnswer(
            room,
            p.id,
            dto.questionId,
            '',
            false,
            totalTimerMs,
            true,
            0,
          );
        }
      }

      this.clearQuestionTimer(room.id);
      setTimeout(() => this.advanceToNextQuestion(room), 1500);
      return;
    }

    if (this.roomsService.allPlayersAnswered(room)) {
      this.clearQuestionTimer(room.id);
      this.advanceToNextQuestion(room);
    }
  }

  // ─────────────────────────────────────────────
  // Power-ups
  // ─────────────────────────────────────────────

  @SubscribeMessage('game:powerup')
  handlePowerUp(@ConnectedSocket() client: Socket, @MessageBody() dto: UsePowerUpDto): void {
    if (dto.type === 'malus_blur' && !dto.targetPlayerId) {
      throw new WsException('targetPlayerId requis pour malus_blur');
    }

    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result) return;

    const { room, player } = result;
    if (!room.isStarted) return;

    const used = this.roomsService.usePowerUp(room, player.id);
    if (!used) {
      client.emit('error', { message: 'Plus de power-ups disponibles' });
      return;
    }

    if (dto.type === 'malus_blur') {
      const targetId = dto.targetPlayerId!;
      const targetPlayer = room.players.get(targetId);

      if (!targetPlayer || targetPlayer.status === 'disconnected') {
        player.powerUpsLeft++;
        client.emit('error', { message: 'Joueur cible introuvable' });
        return;
      }

      this.server.to(targetPlayer.socketId).emit('game:malus', {
        fromPlayerName: player.name,
        duration: 6000,
      });

      client.emit('game:powerupUsed', {
        type: dto.type,
        powerUpsLeft: player.powerUpsLeft,
        targetName: targetPlayer.name,
      });

      this.server.to(room.id).emit('game:powerupEvent', {
        fromName: player.name,
        targetName: targetPlayer.name,
        type: 'malus_blur',
      });

      return;
    }

    if (dto.type === 'bonus_fifty50') {
      const currentQuestion = room.questions[room.currentQuestionIndex] as Question & {
        options?: Array<{ id: string; label: string }>;
      };

      if (!currentQuestion || currentQuestion.type !== 'qcm') {
        player.powerUpsLeft++;
        client.emit('error', {
          message: 'Le 50/50 ne fonctionne que sur les QCM',
        });
        return;
      }

      const options = currentQuestion.options ?? [];
      const correctAnswer = currentQuestion.answer;

      const wrongOptions = options.filter(
        (option) => option.label.toLowerCase() !== correctAnswer.toLowerCase(),
      );

      const shuffled = [...wrongOptions].sort(() => Math.random() - 0.5);
      const toRemove = shuffled.slice(0, 2).map((option) => option.id);

      client.emit('game:bonus5050', {
        removeOptionIds: toRemove,
        powerUpsLeft: player.powerUpsLeft,
      });

      client.emit('game:powerupUsed', {
        type: dto.type,
        powerUpsLeft: player.powerUpsLeft,
      });
    }
  }

  // ─────────────────────────────────────────────
  // Host override & review
  // ─────────────────────────────────────────────

  @SubscribeMessage('game:hostOverride')
  handleHostOverride(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { playerId: string; questionId: string; isCorrect: boolean },
  ): void {
    const result = this.roomsService.getPlayerBySocket(client.id);

    if (!result || !result.player.isHost) {
      client.emit('error', {
        message: "Seul l'hôte peut modifier les résultats",
      });
      return;
    }

    const { room } = result;

    const updated = this.roomsService.overrideAnswer(
      room,
      data.playerId,
      data.questionId,
      data.isCorrect,
    );

    if (!updated) {
      client.emit('error', { message: 'Réponse introuvable' });
      return;
    }

    const review = this.roomsService.buildReviewData(room);

    this.server.to(room.id).emit('game:reviewUpdated', {
      review,
      scores: this.roomsService.getScores(room),
    });
  }

  @SubscribeMessage('review:navigate')
  handleReviewNavigate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { view: 'podium' | 'review'; questionIdx: number },
  ): void {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result || !result.player.isHost) return;

    this.server.to(result.room.id).emit('review:navigated', {
      view: data.view,
      questionIdx: data.questionIdx,
    });
  }

  // ─────────────────────────────────────────────
  // Timers & cleanup
  // ─────────────────────────────────────────────

  private startQuestionTimer(room: Room): void {
    this.clearQuestionTimer(room.id);

    const question = room.questions[room.currentQuestionIndex];
    if (!question) return;

    const isFlash = this.roomsService.isCurrentFlash(room);
    const timerSec = isFlash
      ? this.scoringService.getFlashTimer()
      : this.scoringService.computeTimer(question);
    const timerMs = timerSec * 1000 + 2000; // petite marge

    const timerId = setTimeout(() => {
      this.roomTimers.delete(room.id);

      for (const player of room.players.values()) {
        const wasConnected = player.status === 'answering';
        const needsTimeout = wasConnected || player.status === 'disconnected';

        if (!needsTimeout) continue;

        this.roomsService.recordAnswer(room, player.id, question.id, '', false, timerMs, true, 0);

        if (wasConnected) {
          this.server.to(player.socketId).emit('game:answerResult', {
            questionId: question.id,
            isCorrect: false,
            correctAnswer: this.questionsService.getReadableAnswer(question),
            explanation: question.explanation,
            timedOut: true,
            points: 0,
          });
        }
      }

      this.server.to(room.id).emit('game:timeout', {
        questionId: question.id,
        scores: this.roomsService.getScores(room),
      });

      setTimeout(() => this.advanceToNextQuestion(room), 1500);
    }, timerMs);

    this.roomTimers.set(room.id, timerId);
  }

  private clearQuestionTimer(roomId: string): void {
    const timer = this.roomTimers.get(roomId);
    if (!timer) return;

    clearTimeout(timer);
    this.roomTimers.delete(roomId);
  }

  private advanceToNextQuestion(room: Room): void {
    setTimeout(() => {
      const hasMore = this.roomsService.advanceQuestion(room);

      if (!hasMore) {
        this.clearQuestionTimer(room.id);

        const review = this.roomsService.buildReviewData(room);

        this.server.to(room.id).emit('game:finished', {
          scores: this.roomsService.getScores(room),
          room: this.roomsService.serializeRoom(room),
          review,
        });

        room.isStarted = false;
        return;
      }

      const nextQuestion = room.questions[room.currentQuestionIndex];
      if (!nextQuestion) return;

      const isFlash = this.roomsService.isCurrentFlash(room);
      const timer = isFlash
        ? this.scoringService.getFlashTimer()
        : this.scoringService.computeTimer(nextQuestion);

      this.server.to(room.id).emit('game:nextQuestion', {
        question: this.questionsService.toPublic(nextQuestion),
        questionIndex: room.currentQuestionIndex,
        timer,
        scores: this.roomsService.getScores(room),
        isFlash,
        totalQuestions: room.questions.length,
      });

      this.startQuestionTimer(room);
    }, 500);
  }

  private cancelDisconnectTimer(playerId: string): void {
    const timer = this.disconnectTimers.get(playerId);
    if (!timer) return;

    clearTimeout(timer);
    this.disconnectTimers.delete(playerId);
  }

  private cleanupStaleRooms(): void {
    const staleRoomIds = this.roomsService.getStaleRoomIds(ROOM_MAX_IDLE_AGE);

    for (const roomId of staleRoomIds) {
      this.logger.log(`[WS] Cleaning up stale room: ${roomId}`);
      this.clearQuestionTimer(roomId);
      this.roomsService.deleteRoom(roomId);
    }
  }
}
