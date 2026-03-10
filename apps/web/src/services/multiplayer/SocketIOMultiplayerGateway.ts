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
  heartbeatInterval: 25000,
  heartbeatTimeout: 10000,
  disconnectGracePeriod: 5000,
} as const;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export class SocketIOMultiplayerGateway implements MultiplayerGateway {
  private socket: Socket | null = null;
  private listeners = new Set<(event: MultiplayerEvent) => void>();
  private _playerId: string | null = null;
  private _connectionState: ConnectionState = 'disconnected';
  private _lastRoomCode: string | null = null;
  private _lastPlayerName: string | null = null;

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private stateListeners = new Set<(state: ConnectionState) => void>();

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
    return () => this.stateListeners.delete(handler);
  }

  private setConnectionState(state: ConnectionState): void {
    if (this._connectionState === state) return;
    this._connectionState = state;
    this.stateListeners.forEach((fn) => fn(state));
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    this.cleanup();
    this.setConnectionState('connecting');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error('Connexion au serveur impossible (timeout)'));
      }, CONNECTION_CONFIG.connectTimeout);

      this.socket = io(`${API_URL}/game`, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: false,
        timeout: CONNECTION_CONFIG.connectTimeout,
      });

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        logger.log('[WS] Connected');
        this.setConnectionState('connected');
        this.reconnectAttempts = 0;
        this.setupListeners();
        this.startHeartbeat();
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        logger.error('[WS] Connection error:', err.message);
        this.setConnectionState('disconnected');
        reject(err);
      });

      this.socket.on('disconnect', (reason) => {
        logger.warn('[WS] Disconnected:', reason);
        this.stopHeartbeat();

        if (reason === 'io server disconnect') {
          this.setConnectionState('disconnected');
          this.emit({ type: 'error', message: 'Déconnecté par le serveur' });
        } else {
          this.attemptReconnect();
        }
      });
    });
  }

  disconnect(): void {
    this.cleanup();
    this._playerId = null;
    this._lastRoomCode = null;
    this._lastPlayerName = null;
    this.setConnectionState('disconnected');
  }

  private cleanup(): void {
    this.stopHeartbeat();
    this.cancelReconnect();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.socket?.connected) {
        this.stopHeartbeat();
        return;
      }
      this.heartbeatTimeoutTimer = setTimeout(() => {
        logger.warn('[WS] Heartbeat timeout — connection stale');
        this.socket?.disconnect();
      }, CONNECTION_CONFIG.heartbeatTimeout);

      this.socket.volatile.emit('ping', () => {
        if (this.heartbeatTimeoutTimer) {
          clearTimeout(this.heartbeatTimeoutTimer);
          this.heartbeatTimeoutTimer = null;
        }
      });
    }, CONNECTION_CONFIG.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= CONNECTION_CONFIG.maxReconnectAttempts) {
      logger.error('[WS] Max reconnect attempts reached');
      this.setConnectionState('disconnected');
      this.emit({ type: 'error', message: 'Connexion perdue. Appuyez sur "Reconnecter".' });
      return;
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      CONNECTION_CONFIG.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
      CONNECTION_CONFIG.reconnectMaxDelay,
    );

    logger.log(
      `[WS] Reconnect attempt ${this.reconnectAttempts}/${CONNECTION_CONFIG.maxReconnectAttempts} in ${delay}ms`,
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        // If we had a room session, attempt to rejoin
        if (this._playerId && this._lastRoomCode) {
          logger.log('[WS] Attempting session reconnect for player:', this._playerId);
          this.socket?.emit('room:reconnect', { playerId: this._playerId });
        }
      } catch (err) {
        logger.error('[WS] Reconnect failed:', err);
        this.attemptReconnect();
      }
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
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
      return room;
    });
  }

  leaveRoom(): void {
    this.socket?.emit('room:leave');
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
    this.socket?.emit('game:answer', { questionId, answer, timeSpent: timeSpent ?? 0 });
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
    return () => this.listeners.delete(handler);
  }

  // ─── Manual reconnect (called from UI) ───────────────────

  async manualReconnect(): Promise<void> {
    this.cancelReconnect();
    this.reconnectAttempts = 0;
    await this.connect();
    if (this._playerId && this._lastRoomCode) {
      this.socket?.emit('room:reconnect', { playerId: this._playerId });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  private emitWithTimeout<T>(
    emitEvent: string,
    payload: unknown,
    successEvent: string,
    transform: (data: unknown) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Non connecté'));

      const timeout = setTimeout(() => {
        this.socket?.off(successEvent);
        this.socket?.off('error');
        reject(new Error('Le serveur ne répond pas (timeout)'));
      }, CONNECTION_CONFIG.operationTimeout);

      const cleanup = () => {
        clearTimeout(timeout);
        this.socket?.off(successEvent);
        this.socket?.off('error');
      };

      this.socket.once(successEvent, (data: unknown) => {
        cleanup();
        try {
          resolve(transform(data));
        } catch (err) {
          reject(err);
        }
      });

      this.socket.once('error', (data: { message: string }) => {
        cleanup();
        reject(new Error(data.message));
      });

      this.socket.emit(emitEvent, payload);
    });
  }

  private emit(event: MultiplayerEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('player:joined', (data: { player: Player; room: Room }) => {
      this.emit({ type: 'player:joined', player: data.player });
    });

    this.socket.on('player:left', (data: { playerId: string }) => {
      this.emit({ type: 'player:left', playerId: data.playerId });
    });

    this.socket.on('player:reconnected', (data: { playerId: string }) => {
      this.emit({ type: 'player:reconnected', playerId: data.playerId });
    });

    this.socket.on('player:disconnected', (data: { playerId: string }) => {
      this.emit({ type: 'player:left', playerId: data.playerId });
    });

    // ─── Reconnection state restore ───────────────────────
    this.socket.on(
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
        });
      },
    );

    this.socket.on(
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
        });
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

    this.socket.on(
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

    this.socket.on(
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

    this.socket.on(
      'player:answered',
      (data: { playerId: string; isCorrect: boolean; scores?: Record<string, unknown> }) => {
        this.emit({
          type: 'player:answered',
          playerId: data.playerId,
          isCorrect: data.isCorrect,
          scores: data.scores,
        });
      },
    );

    this.socket.on('game:timeout', (data: { questionId: string }) => {
      this.emit({ type: 'game:timeout', questionId: data.questionId } as MultiplayerEvent);
    });

    this.socket.on(
      'game:finished',
      (data: { scores: Record<string, unknown>; review?: unknown[] }) => {
        this.emit({
          type: 'game:finished',
          scores: data.scores,
          review: data.review,
        } as MultiplayerEvent);
      },
    );

    this.socket.on(
      'game:reviewUpdated',
      (data: { review: unknown[]; scores: Record<string, unknown> }) => {
        this.emit({
          type: 'game:reviewUpdated',
          review: data.review,
          scores: data.scores,
        } as MultiplayerEvent);
      },
    );

    this.socket.on('review:navigated', (data: { view: ReviewViewMode; questionIdx: number }) => {
      this.emit({ type: 'review:navigated', view: data.view, questionIdx: data.questionIdx });
    });

    this.socket.on('game:configured', (data: { config: unknown }) => {
      this.emit({ type: 'game:configured', config: data.config } as MultiplayerEvent);
    });

    // PowerUp events
    this.socket.on('game:malus', (data: { fromPlayerName: string; duration: number }) => {
      this.emit({
        type: 'game:malus',
        fromPlayerName: data.fromPlayerName,
        duration: data.duration,
      });
    });

    this.socket.on(
      'game:bonus5050',
      (data: { removeOptionIds: string[]; powerUpsLeft: number }) => {
        this.emit({
          type: 'game:bonus5050',
          removeOptionIds: data.removeOptionIds,
          powerUpsLeft: data.powerUpsLeft,
        });
      },
    );

    this.socket.on(
      'game:powerupUsed',
      (data: { type: PowerUpType; powerUpsLeft: number; targetName?: string }) => {
        this.emit({
          type: 'game:powerupUsed',
          powerUpType: data.type,
          powerUpsLeft: data.powerUpsLeft,
          targetName: data.targetName,
        });
      },
    );

    this.socket.on(
      'game:powerupEvent',
      (data: { fromName: string; targetName?: string; type: PowerUpType }) => {
        this.emit({
          type: 'game:powerupEvent',
          fromName: data.fromName,
          targetName: data.targetName,
          powerUpType: data.type,
        });
      },
    );

    this.socket.on('error', (data: { message: string }) => {
      this.emit({ type: 'error', message: data.message });
    });
  }
}

export const multiplayerGateway = new SocketIOMultiplayerGateway();
