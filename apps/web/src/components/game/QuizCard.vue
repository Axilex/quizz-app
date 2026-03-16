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

  const isGeoClick = computed(() => props.question.type === 'geoClickMap');

  // ─── Malus: blur only random words, not the entire label ───
  // Simple hash from question ID to seed random word selection
  function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  // Pick which word indices should be blurred (seeded by question id)
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
        // Very short question: blur 1 word
        blurredWordIndices.value = new Set([simpleHash(qId) % count]);
        return;
      }
      // Blur ~35-50% of words (at least 1, at most count-1 so it stays partly readable)
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
    }"
  >
    <!-- Flash round badge -->
    <div v-if="isFlash" class="quiz-card__flash-badge">⚡ FLASH — Premier correct gagne !</div>

    <!-- Malus banner (small notification, NOT a full overlay) -->
    <Transition name="malus">
      <div v-if="isMalusActive" class="quiz-card__malus-banner">
        <span class="quiz-card__malus-icon">🌫️</span>
        <span class="quiz-card__malus-text">{{ malusFromName }} vous a brouillé !</span>
      </div>
    </Transition>

    <div class="quiz-card__meta">
      <DifficultyBadge :difficulty="question.difficulty" />
      <span class="quiz-card__category">{{ question.category }}</span>
      <span class="quiz-card__type">{{ typeIcon }} {{ typeLabel }}</span>
    </div>

    <!-- Standard image media -->
    <div v-if="question.media" class="quiz-card__media">
      <img :src="question.media.url" :alt="question.media.alt || 'Image'" />
    </div>

    <!-- Question label with per-word blur when malus is active -->
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
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    position: relative;
    overflow: hidden;
    transition:
      border-color 0.3s,
      box-shadow 0.3s;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .quiz-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--accent) 20%,
      color-mix(in srgb, var(--accent) 50%, transparent) 80%,
      transparent 100%
    );
    opacity: 0.5;
  }

  /* ─── Flash variant ─── */
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

  /* ─── Malus variant ─── */
  .quiz-card--malus {
    border-color: color-mix(in srgb, var(--error) 40%, var(--border));
  }

  /* Malus banner: small inline notification, NOT a full overlay */
  .quiz-card__malus-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.85rem;
    background: color-mix(in srgb, var(--error) 12%, var(--bg-tertiary));
    border: 1px solid color-mix(in srgb, var(--error) 25%, transparent);
    border-radius: 10px;
    animation: malus-shake 0.4s ease;
  }

  .quiz-card__malus-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .quiz-card__malus-text {
    font-size: 0.8rem;
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
    75% {
      transform: translateX(-1px);
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

  /* ─── Meta row ─── */
  .quiz-card__meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .quiz-card__category {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }

  .quiz-card__type {
    font-size: 0.7rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-weight: 500;
    margin-left: auto;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  /* ─── Media ─── */
  .quiz-card__media {
    width: 100%;
    max-height: 280px;
    overflow: hidden;
    border-radius: 14px;
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

  /* ─── Question label ─── */
  .quiz-card__label {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.4;
    color: var(--text-primary);
    margin: 0.15rem 0;
  }

  /* Per-word rendering for malus mode */
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

  /* ─── Visual renderers ─── */
  .quiz-card__visual {
    padding: 0.25rem 0;
    display: flex;
    justify-content: center;
  }

  /* ─── Responsive ─── */
  @media (max-width: 640px) {
    .quiz-card {
      padding: 1.2rem;
      border-radius: 16px;
    }
    .quiz-card__label {
      font-size: 1.2rem;
    }
  }
</style>
