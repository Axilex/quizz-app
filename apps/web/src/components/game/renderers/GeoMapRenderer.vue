<script setup lang="ts">
  import { computed } from 'vue';
  import type { GeoMapQuestion } from '@/types';
  import { generateGeoMap } from '@/utils/svgPlaceholders';

  interface Props {
    question: GeoMapQuestion;
  }

  const props = defineProps<Props>();

  const mapSrc = computed(() => generateGeoMap(props.question.region));

  // Simplified country outlines as SVG paths
  const COUNTRY_PATHS: Record<string, string> = {
    france:
      'M65,25 L85,20 L105,25 L120,40 L125,65 L115,90 L105,105 L85,115 L65,105 L45,85 L40,60 L50,35 Z',
    japan:
      'M70,20 L80,30 L85,50 L80,70 L75,90 L70,110 L65,130 L60,120 L55,100 L60,75 L65,55 L60,35 Z',
    brazil:
      'M50,25 L85,20 L110,30 L125,50 L130,80 L120,110 L100,130 L70,135 L45,120 L35,90 L40,55 Z',
    norway:
      'M80,15 L90,20 L95,40 L90,60 L85,80 L80,100 L75,120 L65,130 L60,110 L65,85 L70,60 L75,35 Z',
    italy:
      'M70,20 L80,25 L85,40 L80,60 L90,75 L85,95 L75,110 L65,115 L60,100 L65,80 L60,60 L65,35 Z',
  };

  const countryPath = computed(() => {
    const key = props.question.outlineSvg ?? '';
    return COUNTRY_PATHS[key] ?? null;
  });
</script>

<template>
  <div class="geo-map">
    <div class="geo-map__container">
      <svg v-if="countryPath" viewBox="0 0 160 150" class="geo-map__svg">
        <rect width="160" height="150" rx="12" fill="#141820" />
        <path
          :d="countryPath"
          fill="none"
          stroke="var(--accent)"
          stroke-width="2.5"
          stroke-linejoin="round"
          opacity="0.8"
        />
        <path :d="countryPath" fill="var(--accent)" opacity="0.08" />
      </svg>
      <img v-else :src="mapSrc" alt="Carte" class="geo-map__fallback" />
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
  .geo-map__region {
    font-size: 0.78rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
</style>
