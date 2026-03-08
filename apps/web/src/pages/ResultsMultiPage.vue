<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useLobbyStore } from '@/stores';
  import BaseButton from '@/components/ui/BaseButton.vue';

  const router = useRouter();
  const lobby = useLobbyStore();

  // ─── All state comes from the store (synced via WebSocket) ───
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

  const currentReview = computed(() => {
    return lobby.reviewData[currentQuestionIdx.value] ?? null;
  });

  const sortedAnswers = computed(() => {
    if (!currentReview.value) return [];
    return [...currentReview.value.playerAnswers].sort((a, b) => {
      if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1;
      return a.timeSpent - b.timeSpent;
    });
  });

  // ─── Host navigation — emits to server, server broadcasts ───

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
      <!-- Tab toggle — host can click, others see which tab is active -->
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

      <!-- Non-host indicator -->
      <p v-if="!lobby.isHost" class="results-multi__follower-hint">L'hôte contrôle la navigation</p>

      <!-- ═══ PODIUM VIEW ═══ -->
      <template v-if="viewMode === 'podium'">
        <h1 class="results-multi__title">Résultats</h1>

        <div v-if="totalQ > 0" class="results-multi__summary">
          {{ totalQ }} question{{ totalQ > 1 ? 's' : '' }} jouées
        </div>

        <div class="podium">
          <div
            v-for="(player, i) in rankings"
            :key="player.id"
            class="podium__item"
            :class="{ 'podium__item--winner': i === 0, 'podium__item--me': player.isMe }"
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
          <BaseButton variant="ghost" size="sm" @click="handleHome"> Accueil </BaseButton>
        </div>
      </template>

      <!-- ═══ REVIEW VIEW ═══ -->
      <template v-else-if="hasReview && currentReview">
        <!-- Question navigation — only host can interact -->
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

        <!-- Question dots — only host can click -->
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

        <!-- Player answers table -->
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

            <!-- Host-only override buttons -->
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

        <!-- Bottom nav — host only for navigation -->
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

      <!-- No review data fallback -->
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
    padding: 1rem 0 3rem;
  }
  .results-multi__container {
    max-width: 600px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .results-multi__follower-hint {
    text-align: center;
    font-size: 0.78rem;
    color: var(--text-muted);
    font-style: italic;
    margin: -0.75rem 0 0;
  }

  /* TAB TOGGLE */
  .tab-toggle {
    display: flex;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.25rem;
    gap: 0.25rem;
  }
  .tab-toggle__btn {
    flex: 1;
    padding: 0.6rem 1rem;
    background: none;
    border: none;
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
  }
  .tab-toggle__btn--active {
    background: var(--accent);
    color: var(--bg-primary);
  }
  .tab-toggle__btn:hover:not(.tab-toggle__btn--active):not(:disabled) {
    color: var(--text-primary);
  }
  .tab-toggle__btn:disabled:not(.tab-toggle__btn--active) {
    opacity: 0.4;
    cursor: default;
  }

  /* PODIUM */
  .results-multi__title {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-primary);
    text-align: center;
    margin: 0;
  }
  .results-multi__summary {
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-muted);
    font-weight: 500;
  }
  .podium {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .podium__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.2rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 12px;
    transition: all 0.2s;
  }
  .podium__item--winner {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
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
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--accent);
  }
  .podium__unit {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--text-muted);
  }
  .results-multi__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  /* REVIEW NAV */
  .review-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }
  .review-nav__arrow {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    width: 36px;
    height: 36px;
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
    opacity: 0.3;
    cursor: default;
  }
  .review-nav__label {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  /* DOTS */
  .review-dots {
    display: flex;
    gap: 0.35rem;
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
    transform: scale(1.3);
  }
  .review-dots__dot--all-correct:not(.review-dots__dot--active) {
    border-color: var(--success);
    background: var(--success);
    opacity: 0.6;
  }
  .review-dots__dot--some-wrong:not(.review-dots__dot--active) {
    border-color: var(--error);
    background: var(--error);
    opacity: 0.5;
  }

  /* QUESTION CARD */
  .review-question {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .review-question__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .review-question__type {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    font-weight: 600;
  }
  .review-question__badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    margin-left: auto;
  }
  .review-question__badge--auto {
    background: color-mix(in srgb, var(--success) 15%, transparent);
    color: var(--success);
  }
  .review-question__badge--manual {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    color: var(--accent);
  }
  .review-question__label {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.35;
  }
  .review-question__answer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .review-question__answer-label {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-weight: 500;
  }
  .review-question__answer-value {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--success);
  }
  .review-question__explanation {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin: 0;
    font-style: italic;
    line-height: 1.5;
  }

  /* ANSWERS TABLE */
  .answers-table {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .answers-table__header {
    display: flex;
    padding: 0.6rem 1rem;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    font-weight: 700;
  }
  .answers-table__row {
    display: flex;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    align-items: center;
    transition: background 0.15s;
  }
  .answers-table__row:last-child {
    border-bottom: none;
  }
  .answers-table__row--me {
    background: color-mix(in srgb, var(--accent) 4%, transparent);
  }
  .answers-table__row:hover {
    background: color-mix(in srgb, var(--accent) 3%, var(--bg-secondary));
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
    font-size: 0.9rem;
  }
  .answers-table__col--time {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 0.82rem;
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
    font-size: 0.88rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .answers-table__me-badge {
    font-size: 0.65rem;
    background: var(--accent);
    color: var(--bg-primary);
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .answers-table__timeout-text {
    color: var(--text-muted);
    font-style: italic;
    font-size: 0.82rem;
  }

  .status-icon {
    width: 1.4rem;
    height: 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: 900;
  }
  .status-icon--correct {
    background: color-mix(in srgb, var(--success) 18%, transparent);
    color: var(--success);
  }
  .status-icon--wrong {
    background: color-mix(in srgb, var(--error) 18%, transparent);
    color: var(--error);
  }

  .validate-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 2px solid var(--border);
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
    background: color-mix(in srgb, var(--success) 15%, transparent);
    border-color: var(--success);
  }
  .validate-btn--reject {
    color: var(--error);
  }
  .validate-btn--reject:hover,
  .validate-btn--reject.validate-btn--active {
    background: color-mix(in srgb, var(--error) 15%, transparent);
    border-color: var(--error);
  }

  /* BOTTOM NAV */
  .review-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  /* NO REVIEW */
  .no-review {
    text-align: center;
    color: var(--text-muted);
    padding: 3rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .results-multi__title {
      font-size: 2rem;
    }
    .answers-table__col--time {
      display: none;
    }
    .answers-table__col--answer {
      flex: 2;
    }
    .review-question__label {
      font-size: 1rem;
    }
  }
</style>
