import { io, Socket } from 'socket.io-client';
import type {
  MultiplayerGateway,
  MultiplayerEvent,
  Room,
  Player,
  ReviewViewMode,
  PowerUpType,
} from '@/types';
import { logger } from '@/utils';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const CONNECTION_CONFIG = {
  connectTimeout: 8000,
  operationTimeout: 8000,
  maxReconnectAttempts: 8,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 15000,
} as const;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

type StateListener = (state: ConnectionState) => void;
type EventListener = (event: MultiplayerEvent) => void;

export class SocketIOMultiplayerGateway implements MultiplayerGateway {
  private socket: Socket | null = null;
  private listeners = new Set<EventListener>();
  private stateListeners = new Set<StateListener>();

  private _playerId: string | null = null;
  private _connectionState: ConnectionState = 'disconnected';
  private _lastRoomCode: string | null = null;
  private _lastPlayerName: string | null = null;

  private didSetupListeners = false;

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get playerId(): string | null {
    return this._playerId;
  }

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  onStateChange(handler: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(handler);
    return () => {
      this.stateListeners.delete(handler);
    };
  }

  private setConnectionState(state: ConnectionState): void {
    if (this._connectionState === state) return;
    this._connectionState = state;
    this.stateListeners.forEach((fn) => fn(state));
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    this.destroySocket();
    this.setConnectionState('connecting');

    await new Promise<void>((resolve, reject) => {
      const socket = io(`${API_URL}/game`, {
        autoConnect: true,
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: CONNECTION_CONFIG.maxReconnectAttempts,
        reconnectionDelay: CONNECTION_CONFIG.reconnectBaseDelay,
        reconnectionDelayMax: CONNECTION_CONFIG.reconnectMaxDelay,
        timeout: CONNECTION_CONFIG.connectTimeout,
      });

      this.socket = socket;
      this.didSetupListeners = false;
      this.setupListeners();

      let settled = false;

      const cleanupInitListeners = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
      };

      const onConnect = () => {
        if (settled) return;
        settled = true;
        cleanupInitListeners();
        resolve();
      };

      const onConnectError = (err: Error) => {
        if (settled) return;
        settled = true;
        cleanupInitListeners();
        this.setConnectionState('disconnected');
        reject(err);
      };

      socket.once('connect', onConnect);
      socket.once('connect_error', onConnectError);
    });
  }

  disconnect(): void {
    this.destroySocket();
    this._playerId = null;
    this._lastRoomCode = null;
    this._lastPlayerName = null;
    this.setConnectionState('disconnected');
  }

  leaveRoom(): void {
    this.socket?.emit('room:leave');
    this._playerId = null;
    this._lastRoomCode = null;
  }

  async createRoom(playerName: string): Promise<Room> {
    this._lastPlayerName = playerName;

    return this.emitWithTimeout<Room>('room:create', { playerName }, 'room:created', (data) => {
      const { room, playerId } = data as { room: Room; playerId: string };
      this._playerId = playerId;
      this._lastRoomCode = room.code;
      return room;
    });
  }

  async joinRoom(code: string, playerName: string): Promise<Room> {
    this._lastPlayerName = playerName;
    this._lastRoomCode = code;

    return this.emitWithTimeout<Room>('room:join', { code, playerName }, 'room:joined', (data) => {
      const { room, playerId } = data as { room: Room; playerId: string };
      this._playerId = playerId;
      this._lastRoomCode = room.code;
      return room;
    });
  }

  configureGame(config: {
    questionCount: number;
    difficulties: string[];
    categories?: string[];
  }): void {
    this.socket?.emit('game:configure', config);
  }

  startGame(): void {
    this.socket?.emit('game:start');
  }

  submitAnswer(questionId: string, answer: string, timeSpent?: number): void {
    this.socket?.emit('game:answer', {
      questionId,
      answer,
      timeSpent: timeSpent ?? 0,
    });
  }

  usePowerUp(type: PowerUpType, targetPlayerId?: string): void {
    this.socket?.emit('game:powerup', { type, targetPlayerId });
  }

  hostOverride(playerId: string, questionId: string, isCorrect: boolean): void {
    this.socket?.emit('game:hostOverride', { playerId, questionId, isCorrect });
  }

  reviewNavigate(view: ReviewViewMode, questionIdx: number): void {
    this.socket?.emit('review:navigate', { view, questionIdx });
  }

  onEvent(handler: (event: MultiplayerEvent) => void): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  async manualReconnect(): Promise<void> {
    if (this.socket && !this.socket.connected) {
      this.setConnectionState('reconnecting');
      this.socket.connect();
      return;
    }

    await this.connect();
  }

  private destroySocket(): void {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.socket.io.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.didSetupListeners = false;
  }

  private emitWithTimeout<T>(
    emitEvent: string,
    payload: unknown,
    successEvent: string,
    transform: (data: unknown) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const socket = this.socket;

      if (!socket || !socket.connected) {
        reject(new Error('Non connecté'));
        return;
      }

      const timeout = setTimeout(() => {
        socket.off(successEvent, onSuccess);
        socket.off('error', onError);
        reject(new Error('Le serveur ne répond pas (timeout)'));
      }, CONNECTION_CONFIG.operationTimeout);

      const onSuccess = (data: unknown) => {
        clearTimeout(timeout);
        socket.off('error', onError);

        try {
          resolve(transform(data));
        } catch (err) {
          reject(err);
        }
      };

      const onError = (data: { message: string }) => {
        clearTimeout(timeout);
        socket.off(successEvent, onSuccess);
        reject(new Error(data.message));
      };

      socket.once(successEvent, onSuccess);
      socket.once('error', onError);
      socket.emit(emitEvent, payload);
    });
  }

  private emit(event: MultiplayerEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }

  private setupListeners(): void {
    if (!this.socket || this.didSetupListeners) return;

    const socket = this.socket;
    this.didSetupListeners = true;

    socket.on('connect', () => {
      logger.log('[WS] Connected:', socket.id);
      this.setConnectionState('connected');

      if (this._playerId && this._lastRoomCode) {
        logger.log('[WS] Restoring room session for player:', this._playerId);
        socket.emit('room:reconnect', { playerId: this._playerId });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.warn('[WS] Disconnected:', reason);

      if (reason === 'io client disconnect') {
        this.setConnectionState('disconnected');
        return;
      }

      if (reason === 'io server disconnect') {
        this.setConnectionState('reconnecting');
        socket.connect();
        return;
      }

      this.setConnectionState('reconnecting');
    });

    socket.on('connect_error', (err) => {
      logger.error('[WS] Connection error:', err.message);
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      logger.log(`[WS] Reconnect attempt ${attempt}/${CONNECTION_CONFIG.maxReconnectAttempts}`);
      this.setConnectionState('reconnecting');
    });

    socket.io.on('reconnect_error', (err) => {
      logger.error('[WS] Reconnect error:', err);
      this.setConnectionState('reconnecting');
    });

    socket.io.on('reconnect_failed', () => {
      logger.error('[WS] Reconnect failed');
      this.setConnectionState('disconnected');
      this.emit({
        type: 'error',
        message: 'Connexion perdue. Appuyez sur "Reconnecter".',
      });
    });

    socket.on('player:joined', (data: { player: Player; room: Room }) => {
      this.emit({ type: 'player:joined', player: data.player });
    });

    socket.on('player:left', (data: { playerId: string }) => {
      this.emit({ type: 'player:left', playerId: data.playerId });
    });

    socket.on('player:reconnected', (data: { playerId: string }) => {
      this.emit({ type: 'player:reconnected', playerId: data.playerId });
    });

    socket.on('player:disconnected', (data: { playerId: string }) => {
      this.emit({ type: 'player:left', playerId: data.playerId });
    });

    socket.on(
      'room:reconnected',
      (data: {
        room: Room;
        playerId: string;
        scores: Record<string, unknown>;
        currentQuestion?: unknown;
        questionIndex: number;
        totalQuestions: number;
        timer: number;
        isFlash: boolean;
        isGameStarted: boolean;
      }) => {
        logger.log('[WS] Room reconnected, restoring state');
        this._playerId = data.playerId;

        this.emit({
          type: 'room:reconnected',
          room: data.room,
          playerId: data.playerId,
          scores: data.scores,
          currentQuestion: data.currentQuestion,
          questionIndex: data.questionIndex,
          totalQuestions: data.totalQuestions,
          timer: data.timer,
          isFlash: data.isFlash,
          isGameStarted: data.isGameStarted,
        } as MultiplayerEvent);
      },
    );

    socket.on(
      'game:started',
      (data: {
        totalQuestions: number;
        question: unknown;
        questionIndex: number;
        timer: number;
        isFlash: boolean;
      }) => {
        this.emit({
          type: 'game:started',
          questions: [],
          totalQuestions: data.totalQuestions,
          isFlash: data.isFlash,
        } as MultiplayerEvent);

        this.emit({
          type: 'game:question',
          index: data.questionIndex,
          question: data.question,
          timer: data.timer,
          isFlash: data.isFlash,
          totalQuestions: data.totalQuestions,
        } as MultiplayerEvent);
      },
    );

    socket.on(
      'game:nextQuestion',
      (data: {
        question: unknown;
        questionIndex: number;
        timer: number;
        scores: Record<string, unknown>;
        isFlash: boolean;
        totalQuestions: number;
      }) => {
        this.emit({
          type: 'game:question',
          index: data.questionIndex,
          question: data.question,
          timer: data.timer,
          isFlash: data.isFlash,
          totalQuestions: data.totalQuestions,
        } as MultiplayerEvent);
      },
    );

    socket.on(
      'game:answerResult',
      (data: {
        questionId: string;
        isCorrect: boolean;
        correctAnswer: string;
        explanation?: string;
        timedOut?: boolean;
        points: number;
        flashLate?: boolean;
      }) => {
        this.emit({ type: 'game:answerResult', ...data } as MultiplayerEvent);
      },
    );

    socket.on(
      'player:answered',
      (data: { playerId: string; isCorrect: boolean; scores?: Record<string, unknown> }) => {
        this.emit({
          type: 'player:answered',
          playerId: data.playerId,
          isCorrect: data.isCorrect,
          scores: data.scores,
        } as MultiplayerEvent);
      },
    );

    socket.on('game:timeout', (data: { questionId: string }) => {
      this.emit({
        type: 'game:timeout',
        questionId: data.questionId,
      } as MultiplayerEvent);
    });

    socket.on('game:finished', (data: { scores: Record<string, unknown>; review?: unknown[] }) => {
      this.emit({
        type: 'game:finished',
        scores: data.scores,
        review: data.review,
      } as MultiplayerEvent);
    });

    socket.on(
      'game:reviewUpdated',
      (data: { review: unknown[]; scores: Record<string, unknown> }) => {
        this.emit({
          type: 'game:reviewUpdated',
          review: data.review,
          scores: data.scores,
        } as MultiplayerEvent);
      },
    );

    socket.on('review:navigated', (data: { view: ReviewViewMode; questionIdx: number }) => {
      this.emit({
        type: 'review:navigated',
        view: data.view,
        questionIdx: data.questionIdx,
      } as MultiplayerEvent);
    });

    socket.on('game:configured', (data: { config: unknown }) => {
      this.emit({
        type: 'game:configured',
        config: data.config,
      } as MultiplayerEvent);
    });

    socket.on('game:malus', (data: { fromPlayerName: string; duration: number }) => {
      this.emit({
        type: 'game:malus',
        fromPlayerName: data.fromPlayerName,
        duration: data.duration,
      } as MultiplayerEvent);
    });

    socket.on('game:bonus5050', (data: { removeOptionIds: string[]; powerUpsLeft: number }) => {
      this.emit({
        type: 'game:bonus5050',
        removeOptionIds: data.removeOptionIds,
        powerUpsLeft: data.powerUpsLeft,
      } as MultiplayerEvent);
    });

    socket.on(
      'game:powerupUsed',
      (data: { type: PowerUpType; powerUpsLeft: number; targetName?: string }) => {
        this.emit({
          type: 'game:powerupUsed',
          powerUpType: data.type,
          powerUpsLeft: data.powerUpsLeft,
          targetName: data.targetName,
        } as MultiplayerEvent);
      },
    );

    socket.on(
      'game:powerupEvent',
      (data: { fromName: string; targetName?: string; type: PowerUpType }) => {
        this.emit({
          type: 'game:powerupEvent',
          fromName: data.fromName,
          targetName: data.targetName,
          powerUpType: data.type,
        } as MultiplayerEvent);
      },
    );

    socket.on('error', (data: { message: string }) => {
      this.emit({ type: 'error', message: data.message } as MultiplayerEvent);
    });
  }
}

export const multiplayerGateway = new SocketIOMultiplayerGateway();
