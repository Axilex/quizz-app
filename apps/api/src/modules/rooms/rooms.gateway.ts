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
import type { GameConfig, Room } from '../../common/types';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  },
  namespace: '/game',
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private roomTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly questionsService: QuestionsService,
    private readonly scoringService: GameScoringService,
  ) {}

  handleConnection(client: Socket) {
    Logger.log(`[WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    Logger.log(`[WS] Client disconnected: ${client.id}`);
    const result = this.roomsService.getPlayerBySocket(client.id);
    if (!result) return;

    const { room, player } = result;
    player.status = 'disconnected';

    setTimeout(() => {
      if (player.status === 'disconnected') {
        const removal = this.roomsService.removePlayer(client.id);
        if (removal && !removal.isEmpty) {
          this.server.to(room.id).emit('player:left', {
            playerId: player.id,
            room: this.roomsService.serializeRoom(room),
          });
        }
      }
    }, 30000);

    this.server.to(room.id).emit('player:disconnected', { playerId: player.id });
  }

  @SubscribeMessage('room:create')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerName: string },
  ) {
    Logger.log(`[WS] room:create from ${client.id}, name: ${data.playerName}`);
    const room = this.roomsService.createRoom(client.id, data.playerName);
    client.join(room.id);

    const host = room.players.values().next().value!;

    // Emit directly to the client — this is what the front listens for
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

    // Tell the joiner
    client.emit('room:joined', {
      room: this.roomsService.serializeRoom(room),
      playerId: player.id,
    });

    // Notify others in the room
    client.to(room.id).emit('player:joined', {
      player: { id: player.id, name: player.name, score: 0, status: 'connected', isHost: false },
      room: this.roomsService.serializeRoom(room),
    });
  }

  @SubscribeMessage('room:reconnect')
  handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string },
  ) {
    const result = this.roomsService.handleReconnect(client.id, data.playerId);
    if (!result) {
      client.emit('error', { message: 'Impossible de reconnecter' });
      return;
    }

    const { room, player } = result;
    client.join(room.id);

    this.server.to(room.id).emit('player:reconnected', { playerId: player.id });

    const currentQ = room.questions[room.currentQuestionIndex];
    client.emit('room:reconnected', {
      room: this.roomsService.serializeRoom(room),
      playerId: player.id,
      currentQuestion: currentQ ? this.questionsService.toPublic(currentQ) : null,
      questionIndex: room.currentQuestionIndex,
    });
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const result = this.roomsService.removePlayer(client.id);
    if (!result) return;

    client.leave(result.room.id);

    if (!result.isEmpty) {
      this.server.to(result.room.id).emit('player:left', {
        playerId: result.player.id,
        room: this.roomsService.serializeRoom(result.room),
      });
    }
  }

  @SubscribeMessage('game:configure')
  handleConfigure(
    @ConnectedSocket() client: Socket,
    @MessageBody() config: GameConfig,
  ) {
    Logger.log(`[WS] game:configure from ${client.id}`, config);
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
    Logger.log(`[WS] game:start from ${client.id}`);
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
    const timer = this.scoringService.computeTimer(firstQuestion);

    Logger.log(`[WS] Game started in room ${room.code}, ${questions.length} questions`);

    this.server.to(room.id).emit('game:started', {
      totalQuestions: questions.length,
      question: this.questionsService.toPublic(firstQuestion),
      questionIndex: 0,
      timer,
    });

    this.startQuestionTimer(room);
  }

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

    const isCorrect = this.scoringService.validateAnswer(currentQuestion, data.answer);

    this.roomsService.recordAnswer(
      room, player.id, data.questionId, data.answer,
      isCorrect, data.timeSpent, false,
    );

    client.emit('game:answerResult', {
      questionId: data.questionId,
      isCorrect,
      correctAnswer: currentQuestion.answer,
      explanation: currentQuestion.explanation,
    });

    this.server.to(room.id).emit('player:answered', {
      playerId: player.id,
      isCorrect,
      scores: this.roomsService.getScores(room),
    });

    if (this.roomsService.allPlayersAnswered(room)) {
      this.clearQuestionTimer(room.id);
      this.advanceToNextQuestion(room);
    }
  }

  private startQuestionTimer(room: Room) {
    this.clearQuestionTimer(room.id);

    const question = room.questions[room.currentQuestionIndex];
    if (!question) return;

    const timerMs = this.scoringService.computeTimer(question) * 1000 + 2000;

    const timerId = setTimeout(() => {
      for (const player of room.players.values()) {
        if (player.status === 'answering') {
          this.roomsService.recordAnswer(
            room, player.id, question.id, '', false, timerMs, true,
          );

          this.server.to(player.socketId).emit('game:answerResult', {
            questionId: question.id,
            isCorrect: false,
            correctAnswer: question.answer,
            explanation: question.explanation,
            timedOut: true,
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
        this.server.to(room.id).emit('game:finished', {
          scores: this.roomsService.getScores(room),
          room: this.roomsService.serializeRoom(room),
        });
        room.isStarted = false;
        return;
      }

      const nextQuestion = room.questions[room.currentQuestionIndex];
      if (!nextQuestion) return;

      const timer = this.scoringService.computeTimer(nextQuestion);

      this.server.to(room.id).emit('game:nextQuestion', {
        question: this.questionsService.toPublic(nextQuestion),
        questionIndex: room.currentQuestionIndex,
        timer,
        scores: this.roomsService.getScores(room),
      });

      this.startQuestionTimer(room);
    }, 500);
  }
}
