<script setup lang="ts">
  import type { GeoMapQuestion } from '@/types';

  interface Props {
    question: GeoMapQuestion;
  }

  const props = defineProps<Props>();
</script>

<template>
  <div class="geo-map">
    <div class="geo-map__container">
      <!-- SVG path outline provided by backend -->
      <svg v-if="props.question.outlineSvgPath" viewBox="0 0 160 150" class="geo-map__svg">
        <rect width="160" height="150" rx="12" fill="#141820" />
        <path
          :d="props.question.outlineSvgPath"
          fill="none"
          stroke="var(--accent)"
          stroke-width="2.5"
          stroke-linejoin="round"
          opacity="0.8"
        />
        <path :d="props.question.outlineSvgPath" fill="var(--accent)" opacity="0.08" />
      </svg>
      <!-- Image outline provided by backend -->
      <img
        v-else-if="props.question.outlineUrl"
        :src="props.question.outlineUrl"
        alt="Carte"
        class="geo-map__fallback"
      />
      <!-- Fallback -->
      <div v-else class="geo-map__placeholder">🗺️</div>
    </div>
    <span class="geo-map__region">{{ props.question.region }}</span>
  </div>
</template>

<style scoped>
  .geo-map {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .geo-map__container {
    border-radius: 14px;
    overflow: hidden;
    background: #141820;
    border: 1px solid var(--border);
  }
  .geo-map__svg {
    width: 220px;
    height: 200px;
    display: block;
  }
  .geo-map__fallback {
    width: 220px;
    height: 200px;
    object-fit: cover;
  }
  .geo-map__placeholder {
    width: 220px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
  }
  .geo-map__region {
    font-size: 0.78rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
</style>
