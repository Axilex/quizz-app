<script setup lang="ts">
  import { computed } from 'vue';
  import type { SilhouetteQuestion } from '@/types';

  interface Props {
    question: SilhouetteQuestion;
  }

  const props = defineProps<Props>();

  const hasImage = computed(() => !!props.question.imageUrl);
  const hasSvg = computed(() => !!props.question.svgShape);
  const hints = computed(() => props.question.contextHints ?? []);
</script>

<template>
  <div class="silhouette">
    <!-- SVG silhouette shape -->
    <div v-if="hasSvg" class="silhouette__container silhouette__container--svg">
      <svg
        viewBox="0 0 160 90"
        class="silhouette__svg"
        aria-label="Silhouette à identifier"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="sil-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M 16 0 L 0 0 0 16"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              stroke-width="0.5"
            />
          </pattern>
          <filter id="sil-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#0e1015" rx="4" />
        <rect width="100%" height="100%" fill="url(#sil-grid)" rx="4" />
        <!-- Glow -->
        <path
          :d="question.svgShape!"
          fill="rgba(180,180,200,0.12)"
          stroke="rgba(200,200,220,0.25)"
          stroke-width="4"
          stroke-linejoin="round"
          filter="url(#sil-glow)"
        />
        <!-- Main silhouette -->
        <path
          :d="question.svgShape!"
          fill="rgba(210,210,230,0.92)"
          stroke="rgba(240,240,255,0.5)"
          stroke-width="0.6"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <!-- Image-based silhouette (CSS filter) -->
    <div v-else-if="hasImage" class="silhouette__container silhouette__container--img">
      <img
        :src="question.imageUrl!"
        alt="Silhouette à deviner"
        class="silhouette__img"
        loading="lazy"
      />
    </div>

    <!-- Fallback -->
    <div v-else class="silhouette__container silhouette__container--fallback">
      <span class="silhouette__fallback-icon">🌑</span>
    </div>

    <!-- Context hints -->
    <div v-if="hints.length > 0" class="silhouette__hints">
      <div class="silhouette__hint-header">
        <span>💡</span>
        <span>Indices</span>
      </div>
      <ul class="silhouette__hint-list">
        <li v-for="(hint, i) in hints" :key="i" class="silhouette__hint-item">{{ hint }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
  .silhouette {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .silhouette__container {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: #0e1015;
  }
  .silhouette__container--svg {
    width: 100%;
    max-width: 340px;
  }
  .silhouette__svg {
    width: 100%;
    display: block;
    aspect-ratio: 16/9;
  }
  .silhouette__container--img {
    width: 220px;
    height: 220px;
  }
  .silhouette__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0) invert(0.9);
  }
  .silhouette__container--fallback {
    width: 180px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .silhouette__fallback-icon {
    font-size: 4rem;
    opacity: 0.5;
  }
  .silhouette__hints {
    width: 100%;
    max-width: 340px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.75rem 1rem;
  }
  .silhouette__hint-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }
  .silhouette__hint-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .silhouette__hint-item {
    font-size: 0.82rem;
    color: var(--text-secondary);
    padding-left: 0.5rem;
    border-left: 2px solid var(--border);
  }
  @media (max-width: 640px) {
    .silhouette__container--svg {
      max-width: 100%;
    }
  }
</style>
