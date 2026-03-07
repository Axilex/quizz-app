<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useGameStore } from '@/stores';
  import BaseButton from '@/components/ui/BaseButton.vue';
  import ResultCard from '@/components/results/ResultCard.vue';

  const router = useRouter();
  const game = useGameStore();

  const results = computed(() => game.getResults());
  const wrongAnswers = computed(() => game.getWrongAnswers());

  function handleReplay() {
    if (wrongAnswers.value.length > 0) {
      router.push('/review');
    }
  }

  function handleNewGame() {
    game.resetGame();
    router.push('/setup');
  }

  function handleHome() {
    game.resetGame();
    router.push('/');
  }

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec.toString().padStart(2, '0')}s`;
  }
</script>

<template>
  <div class="results-page" v-if="results">
    <div class="results-page__container">
      <!-- Score hero -->
      <div class="score-hero">
        <span class="score-hero__emoji">{{ results.grade.emoji }}</span>
        <h1 class="score-hero__percentage">{{ results.percentage }}%</h1>
        <p class="score-hero__grade">{{ results.grade.label }}</p>
        <div class="score-hero__stats">
          <div class="stat">
            <span class="stat__value stat__value--correct">{{ results.correct }}</span>
            <span class="stat__label">Correct</span>
          </div>
          <div class="stat__divider" />
          <div class="stat">
            <span class="stat__value stat__value--wrong">{{ results.wrong }}</span>
            <span class="stat__label">Erreurs</span>
          </div>
          <div class="stat__divider" />
          <div class="stat">
            <span class="stat__value">{{ results.avgTime }}s</span>
            <span class="stat__label">Moy.</span>
          </div>
          <div class="stat__divider" />
          <div class="stat">
            <span class="stat__value">{{ formatDuration(results.duration) }}</span>
            <span class="stat__label">Durée</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="results-page__actions">
        <BaseButton
          v-if="wrongAnswers.length > 0"
          size="lg"
          full-width
          @click="handleReplay"
        >
          Revoir les erreurs ({{ wrongAnswers.length }})
        </BaseButton>
        <BaseButton variant="secondary" size="md" full-width @click="handleNewGame">
          Nouvelle partie
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="handleHome">
          Accueil
        </BaseButton>
      </div>

      <!-- Answer list -->
      <div class="results-page__list">
        <h2 class="results-page__list-title">Détail des réponses</h2>
        <div class="results-page__cards">
          <ResultCard
            v-for="(answer, i) in results.answers"
            :key="answer.questionId"
            :result="answer"
            :index="i"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .results-page {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 1rem 0 3rem;
  }

  .results-page__container {
    max-width: 540px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Score hero */
  .score-hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 2rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 20px;
  }

  .score-hero__emoji {
    font-size: 3rem;
    line-height: 1;
  }

  .score-hero__percentage {
    font-family: var(--font-display);
    font-size: 4.5rem;
    font-weight: 900;
    color: var(--accent);
    margin: 0;
    line-height: 1.1;
  }

  .score-hero__grade {
    font-size: 1.1rem;
    color: var(--text-secondary);
    margin: 0 0 1rem;
    font-weight: 500;
  }

  .score-hero__stats {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .stat__value {
    font-family: var(--font-mono);
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat__value--correct {
    color: var(--success);
  }

  .stat__value--wrong {
    color: var(--error);
  }

  .stat__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .stat__divider {
    width: 1px;
    height: 2rem;
    background: var(--border);
  }

  /* Actions */
  .results-page__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  /* List */
  .results-page__list-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 0.75rem;
  }

  .results-page__cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
