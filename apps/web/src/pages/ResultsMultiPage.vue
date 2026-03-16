<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useLobbyStore } from '@/stores';
  import BaseButton from '@/components/ui/BaseButton.vue';

  const router = useRouter();
  const lobby = useLobbyStore();

  const viewMode = computed(() => lobby.reviewViewMode);
  const currentQuestionIdx = computed(() => lobby.reviewQuestionIdx);

  const rankings = computed(() => {
    if (!lobby.finalScores) return [];
    return Object.entries(lobby.finalScores)
      .map(([id, data]) => ({
        id,
        name: (data as { name: string; score: number }).name,
        score: (data as { name: string; score: number }).score,
        isMe: id === lobby.playerId,
      }))
      .sort((a, b) => b.score - a.score);
  });

  const hasReview = computed(() => lobby.reviewData.length > 0);
  const totalQ = computed(() => lobby.totalQuestions);
  const currentReview = computed(() => lobby.reviewData[currentQuestionIdx.value] ?? null);

  const sortedAnswers = computed(() => {
    if (!currentReview.value) return [];
    return [...currentReview.value.playerAnswers].sort((a, b) => {
      if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1;
      return a.timeSpent - b.timeSpent;
    });
  });

  function switchToView(view: 'podium' | 'review') {
    lobby.navigateReview(view, currentQuestionIdx.value);
  }

  function nextQuestion() {
    if (currentQuestionIdx.value < lobby.reviewData.length - 1) {
      lobby.navigateReview('review', currentQuestionIdx.value + 1);
    }
  }

  function prevQuestion() {
    if (currentQuestionIdx.value > 0) {
      lobby.navigateReview('review', currentQuestionIdx.value - 1);
    }
  }

  function goToQuestion(idx: number) {
    lobby.navigateReview('review', idx);
  }

  function formatTime(ms: number): string {
    return (ms / 1000).toFixed(1) + 's';
  }

  function overrideAnswer(playerId: string, isCorrect: boolean) {
    lobby.overrideAnswer(currentQuestionIdx.value, playerId, isCorrect);
  }

  function handleBackToLobby() {
    lobby.resetMultiGame();
    router.push('/lobby');
  }

  function handleHome() {
    lobby.leaveRoom();
    router.push('/');
  }
</script>

<template>
  <div class="results-multi">
    <div class="results-multi__container">
      <!-- Tab toggle -->
      <div class="tab-toggle">
        <button
          class="tab-toggle__btn"
          :class="{ 'tab-toggle__btn--active': viewMode === 'podium' }"
          :disabled="!lobby.isHost"
          @click="switchToView('podium')"
        >
          Classement
        </button>
        <button
          class="tab-toggle__btn"
          :class="{ 'tab-toggle__btn--active': viewMode === 'review' }"
          :disabled="!lobby.isHost || !hasReview"
          @click="switchToView('review')"
        >
          Revue des questions
        </button>
      </div>

      <p v-if="!lobby.isHost" class="results-multi__follower-hint">L'hôte contrôle la navigation</p>

      <!-- ═══ PODIUM ═══ -->
      <template v-if="viewMode === 'podium'">
        <div class="podium-header">
          <h1 class="results-multi__title">Résultats</h1>
          <div v-if="totalQ > 0" class="results-multi__summary">
            {{ totalQ }} question{{ totalQ > 1 ? 's' : '' }} jouées
          </div>
        </div>

        <div class="podium">
          <div
            v-for="(player, i) in rankings"
            :key="player.id"
            class="podium__item"
            :class="{
              'podium__item--gold': i === 0,
              'podium__item--silver': i === 1,
              'podium__item--bronze': i === 2,
              'podium__item--me': player.isMe,
            }"
          >
            <span class="podium__rank">{{
              i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
            }}</span>
            <span class="podium__name">{{ player.name }}</span>
            <span class="podium__score"
              >{{ player.score }}<span class="podium__unit"> pts</span></span
            >
          </div>
        </div>

        <div class="results-multi__actions">
          <BaseButton
            v-if="hasReview && lobby.isHost"
            size="lg"
            full-width
            @click="switchToView('review')"
          >
            Voir le détail des réponses
          </BaseButton>
          <BaseButton variant="secondary" size="md" full-width @click="handleBackToLobby">
            Rejouer
          </BaseButton>
          <BaseButton variant="ghost" size="sm" @click="handleHome">Accueil</BaseButton>
        </div>
      </template>

      <!-- ═══ REVIEW ═══ -->
      <template v-else-if="hasReview && currentReview">
        <div class="review-nav">
          <button
            class="review-nav__arrow"
            :disabled="!lobby.isHost || currentQuestionIdx === 0"
            @click="prevQuestion"
          >
            ←
          </button>
          <span class="review-nav__label">
            Question {{ currentQuestionIdx + 1 }} / {{ lobby.reviewData.length }}
          </span>
          <button
            class="review-nav__arrow"
            :disabled="!lobby.isHost || currentQuestionIdx === lobby.reviewData.length - 1"
            @click="nextQuestion"
          >
            →
          </button>
        </div>

        <!-- Dots -->
        <div class="review-dots">
          <button
            v-for="(q, idx) in lobby.reviewData"
            :key="q.questionId"
            class="review-dots__dot"
            :class="{
              'review-dots__dot--active': idx === currentQuestionIdx,
              'review-dots__dot--all-correct': q.playerAnswers.every((a) => a.isCorrect),
              'review-dots__dot--some-wrong': !q.playerAnswers.every((a) => a.isCorrect),
            }"
            :disabled="!lobby.isHost"
            @click="goToQuestion(idx)"
          />
        </div>

        <!-- Question card -->
        <div class="review-question">
          <div class="review-question__meta">
            <span class="review-question__type">{{ currentReview.questionType }}</span>
            <span
              v-if="currentReview.autoValidated"
              class="review-question__badge review-question__badge--auto"
              >Auto-validé</span
            >
            <span v-else class="review-question__badge review-question__badge--manual"
              >Validation manuelle</span
            >
          </div>
          <h2 class="review-question__label">{{ currentReview.questionLabel }}</h2>
          <div class="review-question__answer">
            <span class="review-question__answer-label">Réponse :</span>
            <span class="review-question__answer-value">{{ currentReview.correctAnswer }}</span>
          </div>
          <p v-if="currentReview.explanation" class="review-question__explanation">
            {{ currentReview.explanation }}
          </p>
        </div>

        <!-- Answers table -->
        <div class="answers-table">
          <div class="answers-table__header">
            <span class="answers-table__col answers-table__col--player">Joueur</span>
            <span class="answers-table__col answers-table__col--answer">Réponse</span>
            <span class="answers-table__col answers-table__col--time">Temps</span>
            <span class="answers-table__col answers-table__col--status">Statut</span>
            <span
              v-if="!currentReview.autoValidated && lobby.isHost"
              class="answers-table__col answers-table__col--action"
              >Valider</span
            >
          </div>

          <div
            v-for="pa in sortedAnswers"
            :key="pa.playerId"
            class="answers-table__row"
            :class="{
              'answers-table__row--correct': pa.isCorrect,
              'answers-table__row--wrong': !pa.isCorrect && !pa.timedOut,
              'answers-table__row--timeout': pa.timedOut,
              'answers-table__row--me': pa.playerId === lobby.playerId,
            }"
          >
            <span class="answers-table__col answers-table__col--player">
              <span class="answers-table__player-name">{{ pa.playerName }}</span>
              <span v-if="pa.playerId === lobby.playerId" class="answers-table__me-badge">moi</span>
            </span>
            <span class="answers-table__col answers-table__col--answer">
              <span v-if="pa.timedOut" class="answers-table__timeout-text">Temps écoulé</span>
              <span v-else-if="!pa.answer" class="answers-table__timeout-text">—</span>
              <span v-else>{{ pa.answer }}</span>
            </span>
            <span class="answers-table__col answers-table__col--time">
              {{ pa.timedOut ? '—' : formatTime(pa.timeSpent) }}
            </span>
            <span class="answers-table__col answers-table__col--status">
              <span v-if="pa.isCorrect" class="status-icon status-icon--correct">✓</span>
              <span v-else class="status-icon status-icon--wrong">✗</span>
            </span>

            <span
              v-if="!currentReview.autoValidated && lobby.isHost"
              class="answers-table__col answers-table__col--action"
            >
              <button
                class="validate-btn validate-btn--accept"
                :class="{ 'validate-btn--active': pa.hostOverride === true }"
                title="Accepter"
                @click="overrideAnswer(pa.playerId, true)"
              >
                ✓
              </button>
              <button
                class="validate-btn validate-btn--reject"
                :class="{ 'validate-btn--active': pa.hostOverride === false }"
                title="Refuser"
                @click="overrideAnswer(pa.playerId, false)"
              >
                ✗
              </button>
            </span>
          </div>
        </div>

        <!-- Bottom nav -->
        <div class="review-bottom">
          <BaseButton v-if="lobby.isHost" variant="ghost" size="sm" @click="switchToView('podium')">
            ← Classement
          </BaseButton>
          <div v-else />
          <BaseButton
            v-if="lobby.isHost && currentQuestionIdx < lobby.reviewData.length - 1"
            size="md"
            @click="nextQuestion"
          >
            Question suivante →
          </BaseButton>
          <BaseButton
            v-else-if="lobby.isHost"
            variant="secondary"
            size="md"
            @click="switchToView('podium')"
          >
            Voir le classement final
          </BaseButton>
        </div>
      </template>

      <!-- No review -->
      <template v-else-if="viewMode === 'review' && !hasReview">
        <div class="no-review">
          <p>Aucune donnée de revue disponible pour cette partie.</p>
          <BaseButton v-if="lobby.isHost" variant="ghost" size="sm" @click="switchToView('podium')">
            ← Retour au classement
          </BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .results-multi {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: var(--space-lg) 0 var(--space-2xl);
  }
  .results-multi__container {
    max-width: 620px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .results-multi__follower-hint {
    text-align: center;
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-style: italic;
    margin: calc(-1 * var(--space-sm)) 0 0;
  }

  /* Tab toggle */
  .tab-toggle {
    display: flex;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 4px;
    gap: 4px;
  }
  .tab-toggle__btn {
    flex: 1;
    padding: 0.65rem var(--space-md);
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px;
  }
  .tab-toggle__btn--active {
    background: linear-gradient(135deg, var(--accent), #d4a03a);
    color: var(--bg-base);
    box-shadow: 0 2px 8px rgba(232, 178, 80, 0.2);
  }
  .tab-toggle__btn:hover:not(.tab-toggle__btn--active):not(:disabled) {
    color: var(--text-primary);
  }
  .tab-toggle__btn:disabled:not(.tab-toggle__btn--active) {
    opacity: 0.35;
    cursor: default;
  }

  /* Podium */
  .podium-header {
    text-align: center;
  }
  .results-multi__title {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
  }
  .results-multi__summary {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-weight: 500;
    margin-top: var(--space-xs);
  }

  .podium {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .podium__item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    background: var(--bg-secondary);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    transition: all 0.2s;
    min-height: 56px;
  }
  .podium__item--gold {
    border-color: rgba(232, 178, 80, 0.35);
    background: var(--accent-soft);
    box-shadow: 0 0 24px rgba(232, 178, 80, 0.06);
  }
  .podium__item--silver {
    border-color: rgba(192, 192, 192, 0.2);
  }
  .podium__item--bronze {
    border-color: rgba(205, 127, 50, 0.2);
  }
  .podium__item--me {
    border-color: var(--accent);
  }
  .podium__rank {
    font-size: 1.3rem;
    min-width: 2rem;
    text-align: center;
  }
  .podium__name {
    flex: 1;
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
  }
  .podium__score {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--accent);
  }
  .podium__unit {
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--text-muted);
  }
  .results-multi__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }

  /* Review nav */
  .review-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
  }
  .review-nav__arrow {
    background: var(--bg-secondary);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .review-nav__arrow:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }
  .review-nav__arrow:disabled {
    opacity: 0.25;
    cursor: default;
  }
  .review-nav__label {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-weight: 600;
  }

  /* Dots */
  .review-dots {
    display: flex;
    gap: 0.4rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .review-dots__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--border);
    background: transparent;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s;
  }
  .review-dots__dot:disabled {
    cursor: default;
  }
  .review-dots__dot--active {
    border-color: var(--accent);
    background: var(--accent);
    transform: scale(1.35);
    box-shadow: 0 0 8px var(--accent-glow);
  }
  .review-dots__dot--all-correct:not(.review-dots__dot--active) {
    border-color: var(--success);
    background: var(--success);
    opacity: 0.5;
  }
  .review-dots__dot--some-wrong:not(.review-dots__dot--active) {
    border-color: var(--error);
    background: var(--error);
    opacity: 0.45;
  }

  /* Question card */
  .review-question {
    background: var(--bg-secondary);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    box-shadow: var(--shadow-md);
  }
  .review-question__meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .review-question__type {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    font-weight: 600;
  }
  .review-question__badge {
    font-size: var(--text-xs);
    padding: 0.18rem 0.55rem;
    border-radius: 4px;
    font-weight: 600;
    margin-left: auto;
  }
  .review-question__badge--auto {
    background: var(--success-soft);
    color: var(--success);
  }
  .review-question__badge--manual {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .review-question__label {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.35;
  }
  .review-question__answer {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .review-question__answer-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-weight: 500;
  }
  .review-question__answer-value {
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--success);
  }
  .review-question__explanation {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0;
    font-style: italic;
    line-height: 1.5;
  }

  /* Answers table */
  .answers-table {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .answers-table__header {
    display: flex;
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    font-weight: 700;
  }
  .answers-table__row {
    display: flex;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--border);
    align-items: center;
    transition: background 0.15s;
    min-height: 48px;
  }
  .answers-table__row:last-child {
    border-bottom: none;
  }
  .answers-table__row--me {
    background: rgba(232, 178, 80, 0.03);
  }
  .answers-table__row:hover {
    background: rgba(232, 178, 80, 0.02);
  }
  .answers-table__col {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .answers-table__col--player {
    flex: 2;
    min-width: 0;
  }
  .answers-table__col--answer {
    flex: 3;
    min-width: 0;
    font-size: var(--text-sm);
  }
  .answers-table__col--time {
    flex: 1;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    justify-content: center;
  }
  .answers-table__col--status {
    flex: 0.6;
    justify-content: center;
  }
  .answers-table__col--action {
    flex: 1;
    justify-content: center;
    gap: 0.3rem;
  }
  .answers-table__player-name {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .answers-table__me-badge {
    font-size: 0.6rem;
    background: linear-gradient(135deg, var(--accent), #d4a03a);
    color: var(--bg-base);
    padding: 0.08rem 0.4rem;
    border-radius: 3px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .answers-table__timeout-text {
    color: var(--text-muted);
    font-style: italic;
    font-size: var(--text-sm);
  }

  .status-icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: 900;
  }
  .status-icon--correct {
    background: var(--success-soft);
    color: var(--success);
  }
  .status-icon--wrong {
    background: var(--error-soft);
    color: var(--error);
  }

  .validate-btn {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: 1.5px solid var(--border-strong);
    background: transparent;
    font-size: 0.8rem;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .validate-btn--accept {
    color: var(--success);
  }
  .validate-btn--accept:hover,
  .validate-btn--accept.validate-btn--active {
    background: var(--success-soft);
    border-color: var(--success);
  }
  .validate-btn--reject {
    color: var(--error);
  }
  .validate-btn--reject:hover,
  .validate-btn--reject.validate-btn--active {
    background: var(--error-soft);
    border-color: var(--error);
  }

  .review-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding-top: var(--space-sm);
  }

  .no-review {
    text-align: center;
    color: var(--text-muted);
    padding: var(--space-2xl) var(--space-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }

  @media (max-width: 640px) {
    .results-multi__title {
      font-size: var(--text-xl);
    }
    .answers-table__col--time {
      display: none;
    }
    .answers-table__col--answer {
      flex: 2;
    }
    .review-question__label {
      font-size: var(--text-base);
    }
  }
</style>
