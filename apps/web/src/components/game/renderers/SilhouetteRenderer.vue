<script setup lang="ts">
  import { computed } from 'vue';
  import type { SilhouetteQuestion } from '@/types';
  import { generateSilhouette } from '@/utils/svgPlaceholders';

  interface Props {
    question: SilhouetteQuestion;
  }

  const props = defineProps<Props>();

  const SILHOUETTE_SHAPES: Record<string, string> = {
    eiffel_silhouette: '🗼',
    elephant_silhouette: '🐘',
    saxophone_silhouette: '🎷',
    liberty_silhouette: '🗽',
    kangaroo_silhouette: '🦘',
  };

  const imageSrc = computed(() => {
    const shape = SILHOUETTE_SHAPES[props.question.svg] ?? '❓';
    return generateSilhouette(shape, '');
  });
</script>

<template>
  <div class="silhouette">
    <div class="silhouette__container">
      <img :src="imageSrc" alt="Silhouette à deviner" class="silhouette__img" />
    </div>
  </div>
</template>

<style scoped>
  .silhouette {
    display: flex;
    justify-content: center;
  }
  .silhouette__container {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: #141618;
  }
  .silhouette__img {
    width: 200px;
    height: 200px;
    display: block;
    object-fit: cover;
  }
</style>
