import { describe, it, expect } from 'vitest';
import { TimerService } from '@/services/game/TimerService';

describe('TimerService', () => {
  describe('computeDuration', () => {
    it('uses base timer when provided', () => {
      expect(TimerService.computeDuration('easy', 'text', 20)).toBe(20);
    });

    it('computes easy + text = 15', () => {
      expect(TimerService.computeDuration('easy', 'text')).toBe(15);
    });

    it('computes medium + number = 30', () => {
      expect(TimerService.computeDuration('medium', 'number')).toBe(30);
    });

    it('computes hard + image = 43', () => {
      expect(TimerService.computeDuration('hard', 'image')).toBe(43);
    });

    it('computes easy + qcm = 15', () => {
      expect(TimerService.computeDuration('easy', 'qcm')).toBe(15);
    });

    it('computes hard + text = 35', () => {
      expect(TimerService.computeDuration('hard', 'text')).toBe(35);
    });
  });
});
