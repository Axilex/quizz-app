<script setup lang="ts">
  import type { RebusQuestion } from '@/types';
  import { getImageUrl } from '@/utils/imageLibrary';

  interface Props {
    question: RebusQuestion;
  }

  const props = defineProps<Props>();
</script>

<template>
  <div class="rebus">
    <div class="rebus__clues">
      <div v-for="(clue, i) in props.question.clues" :key="i" class="rebus__clue">
        <img :src="getImageUrl(clue.svg)" :alt="clue.alt" class="rebus__img" loading="lazy" />
        <span v-if="i < props.question.clues.length - 1" class="rebus__plus">+</span>
      </div>
    </div>
    <span class="rebus__equals">=</span>
    <span class="rebus__hint">?</span>
  </div>
</template>

<style scoped>
  .rebus {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
    padding: 1rem 0;
  }
  .rebus__clues {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .rebus__clue {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .rebus__img {
    width: 90px;
    height: 90px;
    border-radius: 10px;
    object-fit: cover;
    background: var(--bg-tertiary);
  }
  .rebus__plus {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-muted);
    margin: 0 0.15rem;
  }
  .rebus__equals {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--accent);
  }
  .rebus__hint {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-muted);
    opacity: 0.5;
  }
  @media (max-width: 640px) {
    .rebus__img {
      width: 70px;
      height: 70px;
    }
  }
</style>
