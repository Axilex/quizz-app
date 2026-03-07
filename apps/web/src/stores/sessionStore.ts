import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Difficulty, GameConfig, GameMode } from '@/types';

const QUESTION_COUNT_OPTIONS = [20, 30, 40, 50] as const;
export type QuestionCountOption = (typeof QUESTION_COUNT_OPTIONS)[number] | 'custom';

export const useSessionStore = defineStore('session', () => {
  const playerName = ref('Joueur');
  const mode = ref<GameMode>('solo');
  const questionCount = ref<number>(20);
  const customCount = ref<number>(10);
  const selectedDifficulties = ref<Difficulty[]>(['easy', 'medium', 'hard']);
  const selectedCategories = ref<string[]>([]);

  const effectiveCount = computed(() => questionCount.value);

  const gameConfig = computed<GameConfig>(() => ({
    mode: mode.value,
    questionCount: effectiveCount.value,
    difficulties: selectedDifficulties.value,
    categories: selectedCategories.value.length ? selectedCategories.value : undefined,
  }));

  const isValid = computed(() => selectedDifficulties.value.length > 0 && effectiveCount.value > 0);

  function setMode(m: GameMode) {
    mode.value = m;
  }

  function setQuestionCount(count: number) {
    questionCount.value = count;
  }

  function toggleDifficulty(d: Difficulty) {
    const idx = selectedDifficulties.value.indexOf(d);
    if (idx >= 0) {
      if (selectedDifficulties.value.length > 1) {
        selectedDifficulties.value.splice(idx, 1);
      }
    } else {
      selectedDifficulties.value.push(d);
    }
  }

  function reset() {
    mode.value = 'solo';
    questionCount.value = 20;
    selectedDifficulties.value = ['easy', 'medium', 'hard'];
    selectedCategories.value = [];
  }

  return {
    playerName,
    mode,
    questionCount,
    customCount,
    selectedDifficulties,
    selectedCategories,
    effectiveCount,
    gameConfig,
    isValid,
    QUESTION_COUNT_OPTIONS,
    setMode,
    setQuestionCount,
    toggleDifficulty,
    reset,
  };
});
