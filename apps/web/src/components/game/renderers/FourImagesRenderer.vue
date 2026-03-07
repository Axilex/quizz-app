<script setup lang="ts">
  import type { FourImagesQuestion } from '@/types';
  import { generateFourImageItem } from '@/utils/svgPlaceholders';

  interface Props {
    question: FourImagesQuestion;
  }

  const props = defineProps<Props>();

  const IMG_EMOJIS: Record<string, string> = {
    flame: '🔥',
    firefighter: '🧑‍🚒',
    fireplace: '🏠',
    dragon: '🐉',
    king: '👑',
    tooth: '🦷',
    flower: '🌸',
    ring: '💍',
    night_sky: '🌃',
    starfish: '🌟',
    sheriff: '⭐',
    christmas_tree: '🎄',
    table: '🪑',
    vine: '🍇',
    kick: '⚽',
    house: '🏡',
    mirror: '🪞',
    ice_cream: '🍦',
    iceberg: '🧊',
    skating: '⛸️',
  };

  function getImage(svg: string, alt: string, index: number): string {
    const emoji = IMG_EMOJIS[svg] ?? '🖼️';
    return generateFourImageItem(emoji, alt, index);
  }
</script>

<template>
  <div class="four-images">
    <div class="four-images__grid">
      <div v-for="(img, i) in props.question.images" :key="i" class="four-images__item">
        <img :src="getImage(img.svg, img.alt, i)" :alt="img.alt" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .four-images__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    max-width: 360px;
    margin: 0 auto;
  }
  .four-images__item img {
    width: 100%;
    border-radius: 12px;
    aspect-ratio: 1;
    object-fit: cover;
  }
</style>
