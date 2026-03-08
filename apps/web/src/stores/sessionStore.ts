import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Difficulty, GameConfig, GameMode } from '@/types';

export const useSessionStore = defineStore('session', () => {
  const playerName = ref('Joueur');
  const mode = ref<GameMode>('solo');
  const questionCount = ref<number>(20);
  const selectedCategories = ref<string[]>([]);

  const gameConfig = computed<GameConfig>(() => ({
    mode: mode.value,
    questionCount: questionCount.value,
    // Always all difficulties — no user choice needed
    difficulties: ['easy', 'medium', 'hard'] as Difficulty[],
    categories: selectedCategories.value.length ? selectedCategories.value : undefined,
  }));

  const isValid = computed(() => questionCount.value > 0);

  function setMode(m: GameMode) {
    mode.value = m;
  }

  function setQuestionCount(count: number) {
    questionCount.value = count;
  }

  function toggleCategory(catId: string) {
    const idx = selectedCategories.value.indexOf(catId);
    if (idx >= 0) {
      selectedCategories.value.splice(idx, 1);
    } else {
      selectedCategories.value.push(catId);
    }
  }

  function reset() {
    mode.value = 'solo';
    questionCount.value = 20;
    selectedCategories.value = [];
  }

  return {
    playerName,
    mode,
    questionCount,
    selectedCategories,
    gameConfig,
    isValid,
    setMode,
    setQuestionCount,
    toggleCategory,
    reset,
  };
});
