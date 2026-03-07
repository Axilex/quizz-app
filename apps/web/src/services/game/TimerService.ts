import { DIFFICULTY_TIMERS, TYPE_MODIFIERS } from '@/types';
import type { Difficulty, QuestionType } from '@/types';

export interface TimerCallbacks {
  onTick: (remaining: number, total: number) => void;
  onComplete: () => void;
}

export class TimerService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;
  private duration = 0;
  private callbacks: TimerCallbacks | null = null;
  private _isPaused = false;
  private _remaining = 0;

  /** Compute the timer duration in seconds for a given question */
  static computeDuration(difficulty: Difficulty, type: QuestionType, baseTimer?: number): number {
    if (baseTimer && baseTimer > 0) return baseTimer;
    return DIFFICULTY_TIMERS[difficulty] + TYPE_MODIFIERS[type];
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  start(durationSeconds: number, callbacks: TimerCallbacks): void {
    this.stop();
    this.duration = durationSeconds * 1000;
    this.callbacks = callbacks;
    this._isPaused = false;
    this.startTime = Date.now();
    this._remaining = this.duration;

    callbacks.onTick(durationSeconds, durationSeconds);

    this.intervalId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.duration - elapsed);
      this._remaining = remaining;

      callbacks.onTick(Math.ceil(remaining / 1000), durationSeconds);

      if (remaining <= 0) {
        this.stop();
        callbacks.onComplete();
      }
    }, 100); // 100ms for smooth progress bar
  }

  pause(): void {
    if (!this.intervalId || this._isPaused) return;
    this._isPaused = true;
    this._remaining = Math.max(0, this.duration - (Date.now() - this.startTime));
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume(): void {
    if (!this._isPaused || !this.callbacks) return;
    this._isPaused = false;
    this.duration = this._remaining;
    this.startTime = Date.now();

    this.intervalId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.duration - elapsed);
      this._remaining = remaining;

      const totalSeconds = Math.ceil(this.duration / 1000);
      this.callbacks!.onTick(Math.ceil(remaining / 1000), totalSeconds);

      if (remaining <= 0) {
        this.stop();
        this.callbacks!.onComplete();
      }
    }, 100);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._isPaused = false;
  }

  /** Returns elapsed time in ms since start */
  getElapsed(): number {
    if (this._isPaused) return this.duration - this._remaining;
    if (!this.isRunning) return 0;
    return Date.now() - this.startTime;
  }

  getRemainingMs(): number {
    return this._remaining;
  }
}

export const timerService = new TimerService();
