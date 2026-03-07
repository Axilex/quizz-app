export { questionRepository, LocalQuestionRepository } from './questions/QuestionRepository';
export { gameEngine, GameEngineService } from './game/GameEngineService';
export { timerService, TimerService } from './game/TimerService';
export { scoreService, ScoreService } from './game/ScoreService';
export { SocketIOMultiplayerGateway } from './multiplayer/SocketIOMultiplayerGateway';
export { MockMultiplayerGateway } from './multiplayer/MockMultiplayerGateway';

import { SocketIOMultiplayerGateway } from './multiplayer/SocketIOMultiplayerGateway';
import { MockMultiplayerGateway } from './multiplayer/MockMultiplayerGateway';
import type { MultiplayerGateway } from '@/types';

/**
 * Adaptive gateway — wraps Socket.IO gateway and falls back to mock
 * if the backend is unreachable. Transparent to consumers.
 */
class AdaptiveMultiplayerGateway implements MultiplayerGateway {
  private real = new SocketIOMultiplayerGateway();
  private mock = new MockMultiplayerGateway();
  private _useReal = false;
  private _isMock = false;

  get isConnected() {
    return this._useReal ? this.real.isConnected : this.mock.isConnected;
  }

  get isMockMode() {
    return this._isMock;
  }

  get playerId() {
    return this._useReal ? this.real.playerId : null;
  }

  async connect(): Promise<void> {
    try {
      await this.real.connect();
      this._useReal = true;
      this._isMock = false;
    } catch {
      console.warn('[Gateway] Backend unreachable, falling back to mock mode');
      await this.mock.connect();
      this._useReal = false;
      this._isMock = true;
    }
  }

  disconnect() {
    this._useReal ? this.real.disconnect() : this.mock.disconnect();
  }

  async createRoom(playerName: string) {
    return this._useReal ? this.real.createRoom(playerName) : this.mock.createRoom(playerName);
  }

  async joinRoom(code: string, playerName: string) {
    return this._useReal
      ? this.real.joinRoom(code, playerName)
      : this.mock.joinRoom(code, playerName);
  }

  leaveRoom() {
    this._useReal ? this.real.leaveRoom() : this.mock.leaveRoom();
  }

  startGame() {
    this._useReal ? this.real.startGame() : this.mock.startGame();
  }

  submitAnswer(questionId: string, answer: string, timeSpent?: number) {
    this._useReal
      ? this.real.submitAnswer(questionId, answer, timeSpent)
      : this.mock.submitAnswer(questionId, answer);
  }

  configureGame(config: { questionCount: number; difficulties: string[]; categories?: string[] }) {
    if (this._useReal) this.real.configureGame(config);
  }

  onEvent(handler: (event: import('@/types').MultiplayerEvent) => void) {
    return this._useReal ? this.real.onEvent(handler) : this.mock.onEvent(handler);
  }
}

export const multiplayerGateway = new AdaptiveMultiplayerGateway();
