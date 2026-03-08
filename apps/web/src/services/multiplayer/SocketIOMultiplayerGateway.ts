import { io, Socket } from 'socket.io-client';
import type { MultiplayerGateway, MultiplayerEvent, Room, Player, ReviewViewMode } from '@/types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Socket.IO gateway — connects to the NestJS backend.
 * The backend is the single authority for:
 *   - Answer validation & scoring
 *   - Question progression / navigation
 *   - Timer management
 *   - Review data & host overrides
 *   - Review screen navigation (shared screen)
 */
export class SocketIOMultiplayerGateway implements MultiplayerGateway {
  private socket: Socket | null = null;
  private listeners = new Set<(event: MultiplayerEvent) => void>();
  private _playerId: string | null = null;

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get playerId(): string | null {
    return this._playerId;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    return new Promise((resolve, reject) => {
      this.socket = io(`${API_URL}/game`, {
        transports: ['websocket'],
        autoConnect: true,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('[WS] Connected to server');
        this.setupListeners();
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('[WS] Connection error:', err.message);
        reject(err);
      });
    });
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this._playerId = null;
  }

  async createRoom(playerName: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      this.socket.once('room:created', (data: { room: Room; playerId: string }) => {
        clearTimeout(timeout);
        this._playerId = data.playerId;
        resolve(data.room);
      });
      this.socket.once('error', (data: { message: string }) => {
        clearTimeout(timeout);
        reject(new Error(data.message));
      });

      this.socket.emit('room:create', { playerName });
    });
  }

  async joinRoom(code: string, playerName: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      this.socket.once('room:joined', (data: { room: Room; playerId: string }) => {
        clearTimeout(timeout);
        this._playerId = data.playerId;
        resolve(data.room);
      });
      this.socket.once('error', (data: { message: string }) => {
        clearTimeout(timeout);
        reject(new Error(data.message));
      });

      this.socket.emit('room:join', { code, playerName });
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
    this.socket?.emit('game:answer', {
      questionId,
      answer,
      timeSpent: timeSpent ?? 0,
    });
  }

  hostOverride(playerId: string, questionId: string, isCorrect: boolean): void {
    this.socket?.emit('game:hostOverride', { playerId, questionId, isCorrect });
  }

  /** Host navigates the shared review screen — broadcasts to all clients */
  reviewNavigate(view: ReviewViewMode, questionIdx: number): void {
    this.socket?.emit('review:navigate', { view, questionIdx });
  }

  reconnect(playerId: string): void {
    this.socket?.emit('room:reconnect', { playerId });
  }

  onEvent(handler: (event: MultiplayerEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
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

    this.socket.on(
      'game:started',
      (data: {
        totalQuestions: number;
        question: unknown;
        questionIndex: number;
        timer: number;
      }) => {
        this.emit({ type: 'game:started', questions: [] });
        this.emit({
          type: 'game:question',
          index: data.questionIndex,
          question: data.question,
          timer: data.timer,
        } as MultiplayerEvent);
      },
    );

    this.socket.on(
      'game:nextQuestion',
      (data: { question: unknown; questionIndex: number; timer: number }) => {
        this.emit({
          type: 'game:question',
          index: data.questionIndex,
          question: data.question,
          timer: data.timer,
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
      }) => {
        this.emit({ type: 'game:answerResult', ...data } as MultiplayerEvent);
      },
    );

    this.socket.on('player:answered', (data: { playerId: string; isCorrect: boolean }) => {
      this.emit({ type: 'player:answered', playerId: data.playerId, isCorrect: data.isCorrect });
    });

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

    // Shared review navigation — host drives, all clients follow
    this.socket.on('review:navigated', (data: { view: ReviewViewMode; questionIdx: number }) => {
      this.emit({
        type: 'review:navigated',
        view: data.view,
        questionIdx: data.questionIdx,
      });
    });

    this.socket.on('game:configured', (data: { config: unknown }) => {
      this.emit({ type: 'game:configured', config: data.config } as MultiplayerEvent);
    });

    this.socket.on('error', (data: { message: string }) => {
      this.emit({ type: 'error', message: data.message });
    });
  }
}

export const multiplayerGateway = new SocketIOMultiplayerGateway();
