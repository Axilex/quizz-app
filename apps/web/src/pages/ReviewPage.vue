<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useGameStore } from '@/stores';
  import BaseButton from '@/components/ui/BaseButton.vue';
  import ResultCard from '@/components/results/ResultCard.vue';

  const router = useRouter();
  const game = useGameStore();

  const wrongAnswers = computed(() => game.getWrongAnswers());

  function handleReplay() {
    game.startReplay(wrongAnswers.value);
    router.push('/play');
  }

  function handleBack() {
    router.push('/results');
  }
</script>

<template>
  <div class="review-page">
    <div class="review-page__container">
      <div class="review-page__header">
        <BaseButton variant="ghost" size="sm" @click="handleBack">
          ← Résultats
        </BaseButton>
        <h1 class="review-page__title">Revue des erreurs</h1>
        <p class="review-page__desc">
          {{ wrongAnswers.length }} question{{ wrongAnswers.length > 1 ? 's' : '' }} à retravailler
        </p>
      </div>

      <div class="review-page__cards">
        <ResultCard
          v-for="(answer, i) in wrongAnswers"
          :key="answer.questionId"
          :result="answer"
          :index="i"
        />
      </div>

      <BaseButton size="lg" full-width @click="handleReplay">
        Rejouer ces questions
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
  .review-page {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 1rem 0 3rem;
  }

  .review-page__container {
    max-width: 540px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .review-page__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .review-page__title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0.5rem 0 0;
  }

  .review-page__desc {
    color: var(--text-secondary);
    margin: 0;
  }

  .review-page__cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
