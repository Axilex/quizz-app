<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import type {
    Question,
    RebusQuestion,
    FourImagesQuestion,
    BlindTestQuestion,
    GeoMapQuestion,
    GeoClickMapQuestion,
    SilhouetteQuestion,
    SplitImageQuestion,
    MathSimpleQuestion,
  } from '@/types';
  import { QUESTION_TYPE_LABELS, QUESTION_TYPE_ICONS } from '@/types';
  import DifficultyBadge from '@/components/ui/DifficultyBadge.vue';
  import RebusRenderer from './renderers/RebusRenderer.vue';
  import FourImagesRenderer from './renderers/FourImagesRenderer.vue';
  import BlindTestRenderer from './renderers/BlindTestRenderer.vue';
  import GeoMapRenderer from './renderers/GeoMapRenderer.vue';
  import GeoClickMapRenderer from './renderers/GeoClickMapRenderer.vue';
  import SilhouetteRenderer from './renderers/SilhouetteRenderer.vue';
  import SplitImageRenderer from './renderers/SplitImageRenderer.vue';
  import MathSimpleRenderer from './renderers/MathSimpleRenderer.vue';

  interface Props {
    question: Question;
    timerTotal?: number;
    timerRemaining?: number;
    isFlash?: boolean;
    isMalusActive?: boolean;
    malusFromName?: string;
    isFreezeActive?: boolean;
    freezeFromName?: string;
    isSpeedActive?: boolean;
    speedFromName?: string;
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    timerTotal: 0,
    timerRemaining: 0,
    isFlash: false,
    isMalusActive: false,
    malusFromName: '',
    isFreezeActive: false,
    freezeFromName: '',
    isSpeedActive: false,
    speedFromName: '',
    disabled: false,
  });

  const emit = defineEmits<{ submit: [answer: string] }>();

  const typeLabel = computed(() => QUESTION_TYPE_LABELS[props.question.type]);
  const typeIcon = computed(() => QUESTION_TYPE_ICONS[props.question.type]);

  const hasVisualRenderer = computed(() =>
    [
      'rebus',
      'fourImages',
      'blindTest',
      'geoMap',
      'geoClickMap',
      'silhouette',
      'splitImage',
      'mathSimple',
    ].includes(props.question.type),
  );

  const isGeoClick = computed(() => props.question.type === 'geoClickMap');

  function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  const blurredWordIndices = ref<Set<number>>(new Set());

  watch(
    () => [props.question.id, props.isMalusActive] as const,
    ([qId, active]) => {
      if (!active) {
        blurredWordIndices.value = new Set();
        return;
      }
      const words = props.question.label.split(/\s+/);
      const count = words.length;
      if (count <= 2) {
        blurredWordIndices.value = new Set([simpleHash(qId) % count]);
        return;
      }
      const numToBlur = Math.max(1, Math.min(count - 1, Math.ceil(count * 0.4)));
      const seed = simpleHash(qId);
      const indices = new Set<number>();
      let attempt = 0;
      while (indices.size < numToBlur && attempt < count * 3) {
        const idx = (seed + attempt * 7 + attempt * attempt) % count;
        indices.add(idx);
        attempt++;
      }
      blurredWordIndices.value = indices;
    },
    { immediate: true },
  );

  const labelWords = computed(() => props.question.label.split(/\s+/));
</script>

<template>
  <div
    class="quiz-card"
    :class="{
      'quiz-card--flash': isFlash,
      'quiz-card--malus': isMalusActive,
      'quiz-card--freeze': isFreezeActive,
      'quiz-card--speed': isSpeedActive,
    }"
  >
    <!-- Accent line -->
    <div class="quiz-card__accent-line" />

    <!-- Flash badge -->
    <div v-if="isFlash" class="quiz-card__flash-badge">⚡ FLASH — Premier correct gagne !</div>

    <!-- Malus banner -->
    <Transition name="malus">
      <div v-if="isMalusActive" class="quiz-card__malus-banner">
        <span class="quiz-card__malus-icon">🌫️</span>
        <span class="quiz-card__malus-text">{{ malusFromName }} vous a brouillé !</span>
      </div>
    </Transition>

    <!-- Freeze banner + overlay -->
    <Transition name="malus">
      <div v-if="isFreezeActive" class="quiz-card__freeze-banner">
        <span class="quiz-card__malus-icon">❄️</span>
        <span class="quiz-card__freeze-text">{{ freezeFromName }} vous a gelé !</span>
      </div>
    </Transition>
    <div v-if="isFreezeActive" class="quiz-card__freeze-overlay" />

    <!-- Speed banner -->
    <Transition name="malus">
      <div v-if="isSpeedActive" class="quiz-card__speed-banner">
        <span class="quiz-card__malus-icon">⚡</span>
        <span class="quiz-card__speed-text">{{ speedFromName }} a accéléré votre timer !</span>
      </div>
    </Transition>

    <div class="quiz-card__meta">
      <DifficultyBadge :difficulty="question.difficulty" />
      <span class="quiz-card__category">{{ question.category }}</span>
      <span class="quiz-card__type">{{ typeIcon }} {{ typeLabel }}</span>
    </div>

    <!-- Image media -->
    <div v-if="question.media" class="quiz-card__media">
      <img :src="question.media.url" :alt="question.media.alt || 'Image'" loading="eager" />
    </div>

    <!-- Question label -->
    <h2 class="quiz-card__label">
      <template v-if="isMalusActive">
        <span
          v-for="(word, idx) in labelWords"
          :key="idx"
          class="quiz-card__word"
          :class="{ 'quiz-card__word--blurred': blurredWordIndices.has(idx) }"
          >{{ word }}</span
        >
      </template>
      <template v-else>{{ question.label }}</template>
    </h2>

    <!-- Visual renderers -->
    <div v-if="hasVisualRenderer" class="quiz-card__visual">
      <RebusRenderer v-if="question.type === 'rebus'" :question="question as RebusQuestion" />
      <FourImagesRenderer
        v-if="question.type === 'fourImages'"
        :question="question as FourImagesQuestion"
      />
      <BlindTestRenderer
        v-if="question.type === 'blindTest'"
        :question="question as BlindTestQuestion"
        :timer-total="timerTotal"
        :timer-remaining="timerRemaining"
      />
      <GeoMapRenderer v-if="question.type === 'geoMap'" :question="question as GeoMapQuestion" />
      <GeoClickMapRenderer
        v-if="isGeoClick"
        :question="question as GeoClickMapQuestion"
        :disabled="disabled"
        @submit="(answer) => emit('submit', answer)"
      />
      <SilhouetteRenderer
        v-if="question.type === 'silhouette'"
        :question="question as SilhouetteQuestion"
      />
      <SplitImageRenderer
        v-if="question.type === 'splitImage'"
        :question="question as SplitImageQuestion"
      />
      <MathSimpleRenderer
        v-if="question.type === 'mathSimple'"
        :question="question as MathSimpleQuestion"
      />
    </div>
  </div>
</template>

<style scoped>
  .quiz-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    position: relative;
    overflow: hidden;
    transition:
      border-color 0.3s,
      box-shadow 0.3s;
    box-shadow:
      var(--shadow-md),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  /* Accent top line */
  .quiz-card__accent-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 5%,
      var(--accent) 30%,
      rgba(232, 178, 80, 0.3) 75%,
      transparent 95%
    );
    opacity: 0.6;
  }

  /* Flash variant */
  .quiz-card--flash {
    border-color: rgba(245, 158, 11, 0.3);
    box-shadow:
      var(--shadow-md),
      0 0 40px rgba(245, 158, 11, 0.08);
  }
  .quiz-card--flash .quiz-card__accent-line {
    background: linear-gradient(90deg, transparent, #f59e0b, transparent);
    opacity: 1;
    height: 3px;
  }

  .quiz-card__flash-badge {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: var(--bg-base);
    font-weight: 800;
    font-size: var(--text-xs);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.45rem 1rem;
    border-radius: var(--radius-sm);
    text-align: center;
    animation: flash-pulse 1s ease-in-out infinite alternate;
  }

  @keyframes flash-pulse {
    from {
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
    }
    to {
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
    }
  }

  /* Malus */
  .quiz-card--malus {
    border-color: rgba(239, 107, 107, 0.25);
  }

  /* Freeze */
  .quiz-card--freeze {
    border-color: rgba(96, 165, 250, 0.35);
    box-shadow:
      var(--shadow-md),
      0 0 30px rgba(96, 165, 250, 0.1);
  }

  .quiz-card__freeze-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    background: rgba(96, 165, 250, 0.1);
    border: 1px solid rgba(96, 165, 250, 0.25);
    border-radius: var(--radius-md);
    animation: malus-shake 0.4s ease;
  }
  .quiz-card__freeze-text {
    font-size: var(--text-sm);
    font-weight: 700;
    color: #60a5fa;
  }

  .quiz-card__freeze-overlay {
    position: absolute;
    inset: 0;
    background: rgba(96, 165, 250, 0.08);
    backdrop-filter: blur(1px);
    border-radius: var(--radius-xl);
    z-index: 10;
    pointer-events: all;
    animation: freeze-pulse 1.5s ease-in-out infinite alternate;
  }

  @keyframes freeze-pulse {
    from {
      background: rgba(96, 165, 250, 0.06);
    }
    to {
      background: rgba(96, 165, 250, 0.12);
    }
  }

  /* Speed */
  .quiz-card--speed {
    border-color: rgba(251, 191, 36, 0.35);
    box-shadow:
      var(--shadow-md),
      0 0 30px rgba(251, 191, 36, 0.1);
  }

  .quiz-card__speed-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.25);
    border-radius: var(--radius-md);
    animation: malus-shake 0.4s ease;
  }
  .quiz-card__speed-text {
    font-size: var(--text-sm);
    font-weight: 700;
    color: #fbbf24;
  }

  .quiz-card__malus-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    background: var(--error-soft);
    border: 1px solid rgba(239, 107, 107, 0.2);
    border-radius: var(--radius-md);
    animation: malus-shake 0.4s ease;
  }
  .quiz-card__malus-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }
  .quiz-card__malus-text {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--error);
  }

  @keyframes malus-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    15% {
      transform: translateX(-4px);
    }
    30% {
      transform: translateX(4px);
    }
    45% {
      transform: translateX(-3px);
    }
    60% {
      transform: translateX(2px);
    }
  }

  .malus-enter-active {
    animation: malus-in 0.3s ease;
  }
  .malus-leave-active {
    animation: malus-in 0.25s ease reverse;
  }
  @keyframes malus-in {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Meta row */
  .quiz-card__meta {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .quiz-card__category {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }

  .quiz-card__type {
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.22rem 0.6rem;
    border-radius: 6px;
    font-weight: 500;
    margin-left: auto;
    border: 1px solid var(--border);
  }

  /* Media */
  .quiz-card__media {
    width: 100%;
    max-height: min(280px, 40vh);
    overflow: hidden;
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
  }

  .quiz-card__media img {
    max-width: 100%;
    max-height: min(280px, 40vh);
    object-fit: contain;
  }

  /* Label */
  .quiz-card__label {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.4;
    color: var(--text-primary);
    margin: 0;
  }

  .quiz-card__word {
    display: inline;
    transition:
      filter 0.3s,
      opacity 0.3s;
  }
  .quiz-card__word + .quiz-card__word {
    margin-left: 0.3em;
  }
  .quiz-card__word--blurred {
    filter: blur(7px);
    user-select: none;
    pointer-events: none;
    opacity: 0.7;
  }

  /* Visual renderers */
  .quiz-card__visual {
    padding: var(--space-xs) 0;
    display: flex;
    justify-content: center;
  }

  @media (max-width: 640px) {
    .quiz-card {
      padding: var(--space-lg);
      border-radius: var(--radius-lg);
    }
    .quiz-card__label {
      font-size: clamp(1.05rem, 0.9rem + 0.5vw, 1.25rem);
    }
  }
</style>
