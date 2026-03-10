import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { QuestionsService } from '../questions/questions.service';
import { GameScoringService } from '../game/game-scoring.service';
import type { GameConfig, Room, PowerUpType } from '../../common/types';
import { Logger } from '@nestjs/common';

const WS_CORS_ORIGINS = process.env['CORS_ORIGINS']
  ? process.env['CORS_ORIGINS'].split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

const DISCONNECT_GRACE_PERIOD = parseInt(process.env['DISCONNECT_GRACE_MS'] ?? '30000', 10);
const ROOM_CLEANUP_INTERVAL = 60000;
const ROOM_MAX_IDLE_AGE = 2 * 60 * 60 * 1000;

@WebSocketGateway({
  cors: { origin: WS_CORS_ORIGINS, credentials: true },
  namespace: '/game',
  pingInterval: 25000,
  pingTimeout: 10000,
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private roomTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly questionsService: QuestionsService,
    private readonly scoringService: GameScoringService,
  ) {
    setInterval(() => this.cleanupStaleRooms(), ROOM_CLEANUP_INTERVAL);
  }

  handleConnection(client: Socket) {
    Logger.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    Logger.log(`[WS] Client disconnected: ${client.id}`);
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result) return;

    const { room, player } = result;
    player.status = 'disconnected';

    this.server.to(room.id).emit('player:disconnected', { playerId: player.id });
    this.cancelDisconnectTimer(player.id);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(player.id);
      if (player.status !== 'disconnected') return;

      Logger.log(`[WS] Grace period expired for ${player.name} (${player.id}), removing`);
      const removal = this.roomsService.removePlayer(client.id);

      if (removal && !removal.isEmpty) {
        this.server.to(room.id).emit('player:left', {
          playerId: player.id,
          room: this.roomsService.serializeRoom(room),
        });
      }

      if (removal?.isEmpty) {
        this.clearQuestionTimer(room.id);
      }

      if (room.isStarted && this.roomsService.allPlayersAnswered(room)) {
        this.clearQuestionTimer(room.id);
        this.advanceToNextQuestion(room);
      }
    }, DISCONNECT_GRACE_PERIOD);

    this.disconnectTimers.set(player.id, timer);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  // ─── Room lifecycle ───────────────────────────────────────

  @SubscribeMessage('room:create')
  handleCreateRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { playerName: string }) {
    Logger.log(`[WS] room:create from ${client.id}, name: ${data.playerName}`);
    const room = this.roomsService.createRoom(client.id, data.playerName);
    client.join(room.id);

    const host = room.players.values().next().value!;
    client.emit('room:created', {
      room: this.roomsService.serializeRoom(room),
      playerId: host.id,
    });
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string; playerName: string },
  ) {
    Logger.log(`[WS] room:join from ${client.id}, code: ${data.code}`);
    const result = this.roomsService.joinRoom(data.code, client.id, data.playerName);
    if (!result) {
      client.emit('error', { message: 'Room introuvable ou partie déjà lancée' });
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
        powerUpsLeft: 3,
      },
      room: this.roomsService.serializeRoom(room),
    });
  }

  @SubscribeMessage('room:reconnect')
  handleReconnect(@ConnectedSocket() client: Socket, @MessageBody() data: { playerId: string }) {
    this.cancelDisconnectTimer(data.playerId);

    const result = this.roomsService.handleReconnect(client.id, data.playerId);
    if (!result) {
      client.emit('error', { message: 'Impossible de reconnecter' });
      return;
    }

    const { room, player } = result;
    client.join(room.id);

    Logger.log(`[WS] Player ${player.name} reconnected to room ${room.code}`);

    this.server.to(room.id).emit('player:reconnected', { playerId: player.id });

    const currentQ = room.isStarted ? room.questions[room.currentQuestionIndex] : null;
    const timer = currentQ ? this.scoringService.computeTimer(currentQ) : 0;
    const isFlash = room.isStarted ? this.roomsService.isCurrentFlash(room) : false;

    // Send full state back to the reconnecting player
    client.emit('room:reconnected', {
      room: this.roomsService.serializeRoom(room),
      playerId: player.id,
      scores: this.roomsService.getScores(room),
      currentQuestion: currentQ ? this.questionsService.toPublic(currentQ) : null,
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      timer,
      isFlash,
      isGameStarted: room.isStarted,
    });
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
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

  // ─── Game configuration & start ───────────────────────────

  @SubscribeMessage('game:configure')
  handleConfigure(@ConnectedSocket() client: Socket, @MessageBody() config: GameConfig) {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result || !result.player.isHost) {
      client.emit('error', { message: "Seul l'hôte peut configurer" });
      return;
    }

    result.room.config = config;
    this.server.to(result.room.id).emit('game:configured', { config });
  }

  @SubscribeMessage('game:start')
  handleStartGame(@ConnectedSocket() client: Socket) {
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

    const questions = this.questionsService.getRandom(room.config.questionCount, {
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

    Logger.log(`[WS] Game started in room ${room.code}, ${questions.length} questions`);

    this.server.to(room.id).emit('game:started', {
      totalQuestions: questions.length,
      question: this.questionsService.toPublic(firstQuestion),
      questionIndex: 0,
      timer,
      isFlash,
    });

    this.startQuestionTimer(room);
  }

  // ─── In-game answers ──────────────────────────────────────

  @SubscribeMessage('game:answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { questionId: string; answer: string; timeSpent: number },
  ) {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result) return;

    const { room, player } = result;
    if (!room.isStarted || player.status !== 'answering') return;

    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion || currentQuestion.id !== data.questionId) return;

    const isFlash = this.roomsService.isCurrentFlash(room);

    // Flash: if winner already claimed it, late correct answers get 0
    if (isFlash && room.flashWinner !== null) {
      const isCorrect = this.scoringService.validateAnswer(currentQuestion, data.answer);
      this.roomsService.recordAnswer(
        room,
        player.id,
        data.questionId,
        data.answer,
        false,
        data.timeSpent,
        false,
        0,
      );

      client.emit('game:answerResult', {
        questionId: data.questionId,
        isCorrect,
        correctAnswer: currentQuestion.answer,
        explanation: currentQuestion.explanation,
        points: 0,
        flashLate: true,
      });

      if (this.roomsService.allPlayersAnswered(room)) {
        this.clearQuestionTimer(room.id);
        this.advanceToNextQuestion(room);
      }
      return;
    }

    const isCorrect = this.scoringService.validateAnswer(currentQuestion, data.answer);
    const totalTimerMs =
      (isFlash
        ? this.scoringService.getFlashTimer()
        : this.scoringService.computeTimer(currentQuestion)) * 1000;

    let points = 0;
    if (isCorrect) {
      if (isFlash) {
        // First correct answer wins all points
        room.flashWinner = player.id;
        points = this.scoringService.computePoints(
          true,
          data.timeSpent,
          totalTimerMs,
          currentQuestion.difficulty,
          true,
        );
      } else {
        points = this.scoringService.computePoints(
          isCorrect,
          data.timeSpent,
          totalTimerMs,
          currentQuestion.difficulty,
          false,
        );
      }
    }

    this.roomsService.recordAnswer(
      room,
      player.id,
      data.questionId,
      data.answer,
      isCorrect,
      data.timeSpent,
      false,
      points,
    );

    client.emit('game:answerResult', {
      questionId: data.questionId,
      isCorrect,
      correctAnswer: currentQuestion.answer,
      explanation: currentQuestion.explanation,
      points,
    });

    this.server.to(room.id).emit('player:answered', {
      playerId: player.id,
      isCorrect,
      scores: this.roomsService.getScores(room),
    });

    // Flash: once winner answers, advance after short delay
    if (isFlash && isCorrect) {
      // Mark all remaining 'answering' players as waiting with 0 points
      for (const p of room.players.values()) {
        if (p.status === 'answering') {
          this.roomsService.recordAnswer(
            room,
            p.id,
            data.questionId,
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

  // ─── PowerUp system ───────────────────────────────────────

  @SubscribeMessage('game:powerup')
  handlePowerUp(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: PowerUpType; targetPlayerId?: string },
  ) {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result) return;

    const { room, player } = result;
    if (!room.isStarted) return;

    const used = this.roomsService.usePowerUp(room, player.id);
    if (!used) {
      client.emit('error', { message: 'Plus de power-ups disponibles' });
      return;
    }

    if (data.type === 'malus_blur') {
      const targetId = data.targetPlayerId;
      const targetPlayer = targetId ? room.players.get(targetId) : null;

      if (!targetPlayer || targetPlayer.status === 'disconnected') {
        // Refund
        player.powerUpsLeft++;
        client.emit('error', { message: 'Joueur cible introuvable' });
        return;
      }

      // Send blur malus to target
      this.server.to(targetPlayer.socketId).emit('game:malus', {
        fromPlayerName: player.name,
        duration: 6000,
      });

      // Confirm to sender
      client.emit('game:powerupUsed', {
        type: data.type,
        powerUpsLeft: player.powerUpsLeft,
        targetName: targetPlayer.name,
      });

      // Notify room
      this.server.to(room.id).emit('game:powerupEvent', {
        fromName: player.name,
        targetName: targetPlayer.name,
        type: 'malus_blur',
      });
    } else if (data.type === 'bonus_fifty50') {
      const currentQuestion = room.questions[room.currentQuestionIndex];
      if (!currentQuestion || currentQuestion.type !== 'qcm') {
        // Refund if not QCM
        player.powerUpsLeft++;
        client.emit('error', { message: 'Le 50/50 ne fonctionne que sur les QCM' });
        return;
      }

      const options = (currentQuestion['options'] as Array<{ id: string; label: string }>) ?? [];
      const correctAnswer = currentQuestion.answer;

      // Find 2 wrong options to remove
      const wrongOptions = options.filter(
        (o) => o.label.toLowerCase() !== correctAnswer.toLowerCase(),
      );

      const toRemove: string[] = [];
      const shuffled = [...wrongOptions].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(2, shuffled.length); i++) {
        toRemove.push(shuffled[i]!.id);
      }

      client.emit('game:bonus5050', {
        removeOptionIds: toRemove,
        powerUpsLeft: player.powerUpsLeft,
      });

      client.emit('game:powerupUsed', {
        type: data.type,
        powerUpsLeft: player.powerUpsLeft,
      });
    }
  }

  // ─── Post-game review (host-driven) ───────────────────────

  @SubscribeMessage('game:hostOverride')
  handleHostOverride(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string; questionId: string; isCorrect: boolean },
  ) {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result || !result.player.isHost) {
      client.emit('error', { message: "Seul l'hôte peut modifier les résultats" });
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
    @MessageBody() data: { view: 'podium' | 'review'; questionIdx: number },
  ) {
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result || !result.player.isHost) return;

    this.server.to(result.room.id).emit('review:navigated', {
      view: data.view,
      questionIdx: data.questionIdx,
    });
  }

  // ─── Timer internals ──────────────────────────────────────

  private startQuestionTimer(room: Room) {
    this.clearQuestionTimer(room.id);

    const question = room.questions[room.currentQuestionIndex];
    if (!question) return;

    const isFlash = this.roomsService.isCurrentFlash(room);
    const timerSec = isFlash
      ? this.scoringService.getFlashTimer()
      : this.scoringService.computeTimer(question);
    const timerMs = timerSec * 1000 + 2000;

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
            correctAnswer: question.answer,
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

  private clearQuestionTimer(roomId: string) {
    const timer = this.roomTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roomTimers.delete(roomId);
    }
  }

  private advanceToNextQuestion(room: Room) {
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
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  private cleanupStaleRooms(): void {
    const staleRoomIds = this.roomsService.getStaleRoomIds(ROOM_MAX_IDLE_AGE);
    for (const roomId of staleRoomIds) {
      Logger.log(`[WS] Cleaning up stale room: ${roomId}`);
      this.clearQuestionTimer(roomId);
      this.roomsService.deleteRoom(roomId);
    }
  }
}
