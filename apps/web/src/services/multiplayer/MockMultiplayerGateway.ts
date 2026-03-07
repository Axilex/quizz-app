import type { MultiplayerEvent, MultiplayerGateway, Player, Room } from '@/types';

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createMockPlayer(name: string, isHost: boolean): Player {
  return {
    id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    score: 0,
    status: 'connected',
    isHost,
  };
}

/**
 * Mock implementation — simulates multiplayer behavior locally.
 * Will be replaced by a Socket.IO gateway in V2.
 */
export class MockMultiplayerGateway implements MultiplayerGateway {
  private _isConnected = false;
  private _room: Room | null = null;
  private listeners: Set<(event: MultiplayerEvent) => void> = new Set();

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 300));
    this._isConnected = true;
  }

  disconnect(): void {
    this._isConnected = false;
    this._room = null;
  }

  async createRoom(playerName: string): Promise<Room> {
    const host = createMockPlayer(playerName, true);
    this._room = {
      id: `room_${Date.now()}`,
      code: generateCode(),
      hostId: host.id,
      players: [host],
      maxPlayers: 8,
      isStarted: false,
      createdAt: Date.now(),
    };

    // Simulate a bot joining after 2s
    setTimeout(() => {
      if (!this._room) return;
      const bot = createMockPlayer('Bot Player', false);
      this._room.players.push(bot);
      this.emit({ type: 'player:joined', player: bot });
    }, 2000);

    return this._room;
  }

  async joinRoom(code: string, playerName: string): Promise<Room> {
    // In mock mode, create a room simulating joining
    const player = createMockPlayer(playerName, false);
    const host = createMockPlayer('Host', true);
    this._room = {
      id: `room_${Date.now()}`,
      code,
      hostId: host.id,
      players: [host, player],
      maxPlayers: 8,
      isStarted: false,
      createdAt: Date.now(),
    };
    return this._room;
  }

  leaveRoom(): void {
    this._room = null;
  }

  startGame(): void {
    if (!this._room) return;
    this._room.isStarted = true;
    this.emit({ type: 'game:started', questions: [] });
  }

  submitAnswer(questionId: string, _answer: string): void {
    // Mock: just emit that we answered
    this.emit({
      type: 'player:answered',
      playerId: this._room?.players[0]?.id ?? '',
      isCorrect: Math.random() > 0.3,
    });
  }

  onEvent(handler: (event: MultiplayerEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private emit(event: MultiplayerEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }
}

export const multiplayerGateway = new MockMultiplayerGateway();
