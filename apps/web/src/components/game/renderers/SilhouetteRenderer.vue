<script setup lang="ts">
  import { computed } from 'vue';
  import type { SilhouetteQuestion } from '@/types';
  import { getImageUrl } from '@/utils/imageLibrary';

  interface Props {
    question: SilhouetteQuestion;
  }

  const props = defineProps<Props>();
  const imageSrc = computed(() => getImageUrl(props.question.svg));
</script>

<template>
  <div class="silhouette">
    <div class="silhouette__container">
      <img :src="imageSrc" alt="Silhouette à deviner" class="silhouette__img" loading="lazy" />
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
    filter: brightness(0) invert(0.85);
    transition: filter 0.5s ease;
  }
  .silhouette__container:hover .silhouette__img {
    filter: brightness(0) invert(0.95);
  }
</style>
