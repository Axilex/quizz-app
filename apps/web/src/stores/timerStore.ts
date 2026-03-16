import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useTimerStore = defineStore('timer', () => {
  // === State ===
  const remaining = ref(0); // Seconds remaining
  const total = ref(0); // Total seconds
  const isRunning = ref(false);

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let startTime: number = 0;
  let onCompleteCallback: (() => void) | null = null;

  // === Computed ===
  const percentage = computed(() => {
    if (total.value === 0) return 100;
    return Math.round((remaining.value / total.value) * 100);
  });

  const elapsed = computed(() => total.value - remaining.value);

  // === Actions ===

  /**
   * Start timer countdown
   * @param durationSeconds Total duration in seconds
   * @param onComplete Callback when timer reaches 0
   */
  function start(durationSeconds: number, onComplete?: () => void) {
    stop(); // Clear any existing timer

    total.value = durationSeconds;
    remaining.value = durationSeconds;
    isRunning.value = true;
    startTime = Date.now();
    onCompleteCallback = onComplete || null;

    intervalId = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      remaining.value = Math.max(0, durationSeconds - elapsedSec);

      if (remaining.value <= 0) {
        stop();
        onCompleteCallback?.();
      }
    }, 100); // Update every 100ms for smooth progress bar
  }

  /**
   * Stop timer
   */
  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning.value = false;
  }

  /**
   * Get elapsed time in milliseconds (for scoring)
   */
  function getElapsed(): number {
    if (!isRunning.value && !startTime) return 0;
    return Date.now() - startTime;
  }

  /**
   * Reset timer to initial state
   */
  function reset() {
    stop();
    remaining.value = 0;
    total.value = 0;
    startTime = 0;
    onCompleteCallback = null;
  }

  return {
    // State
    remaining,
    total,
    isRunning,

    // Computed
    percentage,
    elapsed,

    // Actions
    start,
    stop,
    getElapsed,
    reset,
  };
});
