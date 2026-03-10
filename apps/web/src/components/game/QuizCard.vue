<script setup lang="ts">
  import { computed } from 'vue';
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
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    timerTotal: 0,
    timerRemaining: 0,
    isFlash: false,
    isMalusActive: false,
    malusFromName: '',
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

  // geoClickMap submits directly from renderer
  const isGeoClick = computed(() => props.question.type === 'geoClickMap');
</script>

<template>
  <div
    class="quiz-card"
    :class="{
      'quiz-card--flash': isFlash,
      'quiz-card--malus': isMalusActive,
    }"
  >
    <!-- Flash round badge -->
    <div v-if="isFlash" class="quiz-card__flash-badge">⚡ FLASH — Premier correct gagne !</div>

    <div class="quiz-card__meta">
      <DifficultyBadge :difficulty="question.difficulty" />
      <span class="quiz-card__category">{{ question.category }}</span>
      <span class="quiz-card__type">{{ typeIcon }} {{ typeLabel }}</span>
    </div>

    <!-- Standard image media -->
    <div v-if="question.media" class="quiz-card__media">
      <img :src="question.media.url" :alt="question.media.alt || 'Image'" />
    </div>

    <h2 class="quiz-card__label" :class="{ 'quiz-card__label--blur': isMalusActive }">
      {{ question.label }}
    </h2>

    <!-- Malus blur overlay -->
    <Transition name="malus">
      <div v-if="isMalusActive" class="quiz-card__malus-overlay">
        <span class="quiz-card__malus-text"> 🌫️ {{ malusFromName }} vous a brouillé ! </span>
      </div>
    </Transition>

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
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    position: relative;
    overflow: hidden;
    transition:
      border-color 0.3s,
      box-shadow 0.3s;
  }

  .quiz-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--accent) 30%,
      rgba(229, 166, 62, 0.3) 70%,
      transparent 100%
    );
    opacity: 0.6;
  }

  .quiz-card--flash {
    border-color: #f59e0b;
    box-shadow:
      0 0 0 1px rgba(245, 158, 11, 0.2),
      0 4px 24px rgba(245, 158, 11, 0.12);
  }

  .quiz-card--flash::before {
    background: linear-gradient(90deg, transparent, #f59e0b, rgba(245, 158, 11, 0.3), transparent);
    opacity: 1;
    height: 3px;
  }

  .quiz-card--malus {
    border-color: rgba(224, 108, 108, 0.4);
  }

  .quiz-card__flash-badge {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #1a1c20;
    font-weight: 800;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.4rem 1rem;
    border-radius: 8px;
    text-align: center;
    animation: flash-pulse 1s ease-in-out infinite alternate;
  }

  @keyframes flash-pulse {
    from {
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
    }
    to {
      box-shadow: 0 0 18px rgba(245, 158, 11, 0.8);
    }
  }

  .quiz-card__meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .quiz-card__category {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }

  .quiz-card__type {
    font-size: 0.72rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.2rem 0.55rem;
    border-radius: 5px;
    font-weight: 500;
    margin-left: auto;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .quiz-card__media {
    width: 100%;
    max-height: 280px;
    overflow: hidden;
    border-radius: 12px;
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
  }

  .quiz-card__media img {
    max-width: 100%;
    max-height: 280px;
    object-fit: contain;
  }

  .quiz-card__label {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--text-primary);
    margin: 0;
    transition: filter 0.3s;
  }

  .quiz-card__label--blur {
    filter: blur(6px);
    user-select: none;
  }

  .quiz-card__malus-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(224, 108, 108, 0.08);
    backdrop-filter: blur(2px);
    border-radius: 18px;
    pointer-events: none;
    z-index: 5;
  }

  .quiz-card__malus-text {
    background: rgba(224, 108, 108, 0.9);
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    padding: 0.5rem 1.2rem;
    border-radius: 10px;
  }

  .malus-enter-active {
    animation: malus-in 0.3s ease;
  }
  .malus-leave-active {
    animation: malus-in 0.3s ease reverse;
  }
  @keyframes malus-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .quiz-card__visual {
    padding: 0.25rem 0;
    display: flex;
    justify-content: center;
  }

  @media (max-width: 640px) {
    .quiz-card {
      padding: 1.1rem;
    }
    .quiz-card__label {
      font-size: 1.15rem;
    }
  }
</style>
