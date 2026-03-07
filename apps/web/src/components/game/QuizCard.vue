<script setup lang="ts">
  import { computed } from 'vue';
  import type {
    Question,
    RebusQuestion,
    FourImagesQuestion,
    BlindTestQuestion,
    GeoMapQuestion,
    SilhouetteQuestion,
  } from '@/types';
  import { QUESTION_TYPE_LABELS, QUESTION_TYPE_ICONS } from '@/types';
  import DifficultyBadge from '@/components/ui/DifficultyBadge.vue';
  import RebusRenderer from './renderers/RebusRenderer.vue';
  import FourImagesRenderer from './renderers/FourImagesRenderer.vue';
  import BlindTestRenderer from './renderers/BlindTestRenderer.vue';
  import GeoMapRenderer from './renderers/GeoMapRenderer.vue';
  import SilhouetteRenderer from './renderers/SilhouetteRenderer.vue';

  interface Props {
    question: Question;
    timerTotal?: number;
    timerRemaining?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    timerTotal: 0,
    timerRemaining: 0,
  });

  const typeLabel = computed(() => QUESTION_TYPE_LABELS[props.question.type]);
  const typeIcon = computed(() => QUESTION_TYPE_ICONS[props.question.type]);

  // Visual question types that render inside the card
  const hasVisualRenderer = computed(() =>
    ['rebus', 'fourImages', 'blindTest', 'geoMap', 'silhouette'].includes(props.question.type),
  );
</script>

<template>
  <div class="quiz-card">
    <div class="quiz-card__meta">
      <DifficultyBadge :difficulty="question.difficulty" />
      <span class="quiz-card__category">{{ question.category }}</span>
      <span class="quiz-card__type">{{ typeIcon }} {{ typeLabel }}</span>
    </div>

    <!-- Standard image media -->
    <div v-if="question.media?.type === 'image'" class="quiz-card__media">
      <img :src="question.media.src" :alt="question.media.alt || 'Question image'" />
    </div>

    <h2 class="quiz-card__label">{{ question.label }}</h2>

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
      <SilhouetteRenderer
        v-if="question.type === 'silhouette'"
        :question="question as SilhouetteQuestion"
      />
    </div>
  </div>
</template>

<style scoped>
  .quiz-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .quiz-card__meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .quiz-card__category {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .quiz-card__type {
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
    margin-left: auto;
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
  }
  .quiz-card__media img {
    max-width: 100%;
    max-height: 280px;
    object-fit: contain;
  }
  .quiz-card__label {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--text-primary);
    margin: 0;
  }
  .quiz-card__visual {
    padding: 0.5rem 0;
  }
  @media (max-width: 640px) {
    .quiz-card {
      padding: 1rem;
    }
    .quiz-card__label {
      font-size: 1.1rem;
    }
  }
</style>
