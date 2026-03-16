import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AnswerResult } from '@/types';

export const useFeedbackStore = defineStore('feedback', () => {
  // === State ===
  const lastResult = ref<AnswerResult | null>(null);
  const isVisible = ref(false);

  // === Actions ===

  /**
   * Set answer result
   */
  function setResult(result: AnswerResult) {
    lastResult.value = result;
  }

  /**
   * Show feedback UI
   */
  function show() {
    isVisible.value = true;
  }

  /**
   * Hide feedback UI
   */
  function hide() {
    isVisible.value = false;
  }

  /**
   * Reset feedback state
   */
  function reset() {
    lastResult.value = null;
    isVisible.value = false;
  }

  return {
    // State
    lastResult,
    isVisible,

    // Actions
    setResult,
    show,
    hide,
    reset,
  };
});
