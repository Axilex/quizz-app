<script setup lang="ts">
  import type { FourImagesQuestion } from '@/types';

  interface Props {
    question: FourImagesQuestion;
  }

  const props = defineProps<Props>();
</script>

<template>
  <div class="four-images">
    <div class="four-images__grid">
      <div v-for="(img, i) in props.question.images" :key="i" class="four-images__item">
        <img :src="img.imageUrl" :alt="img.alt" loading="lazy" />
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
    background: var(--bg-tertiary);
  }
</style>
