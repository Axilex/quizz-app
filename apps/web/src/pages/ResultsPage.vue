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
        <div class="score-hero__glow" />
        <span class="score-hero__emoji">{{ results.grade.emoji }}</span>
        <h1 class="score-hero__percentage">
          {{ results.totalPoints }}<span class="score-hero__max">/{{ results.maxPoints }} pts</span>
        </h1>
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
        <BaseButton v-if="wrongAnswers.length > 0" size="lg" full-width @click="handleReplay">
          Revoir les erreurs ({{ wrongAnswers.length }})
        </BaseButton>
        <BaseButton variant="secondary" size="md" full-width @click="handleNewGame">
          Nouvelle partie
        </BaseButton>
        <BaseButton variant="ghost" size="sm" @click="handleHome">Accueil</BaseButton>
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
    padding: var(--space-lg) 0 var(--space-2xl);
  }

  .results-page__container {
    max-width: 560px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  /* Score hero */
  .score-hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xl);
    background: var(--bg-secondary);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .score-hero__glow {
    position: absolute;
    top: -40%;
    left: 50%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232, 178, 80, 0.08), transparent 70%);
    transform: translateX(-50%);
    pointer-events: none;
  }

  .score-hero__emoji {
    font-size: clamp(2.5rem, 2rem + 2vw, 3.5rem);
    line-height: 1;
    position: relative;
    z-index: 1;
  }

  .score-hero__percentage {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 900;
    color: var(--accent);
    margin: 0;
    line-height: 1.1;
    position: relative;
    z-index: 1;
  }

  .score-hero__max {
    font-size: clamp(0.9rem, 0.7rem + 0.6vw, 1.3rem);
    font-weight: 400;
    color: var(--text-muted);
  }

  .score-hero__grade {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: 0 0 var(--space-md);
    font-weight: 500;
    position: relative;
    z-index: 1;
  }

  .score-hero__stats {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex-wrap: wrap;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .stat__value {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
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
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .stat__divider {
    width: 1px;
    height: 2rem;
    background: var(--border-strong);
  }

  /* Actions */
  .results-page__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }

  /* List */
  .results-page__list-title {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 var(--space-sm);
  }

  .results-page__cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
</style>
