<script setup lang="ts">
  import { computed } from 'vue';
  import type { BlindTestQuestion } from '@/types';
  import { getImageUrl } from '@/utils/imageLibrary';

  interface Props {
    question: BlindTestQuestion;
    timerTotal: number;
    timerRemaining: number;
  }

  const props = defineProps<Props>();

  const imageSrc = computed(() => getImageUrl(props.question.svg));

  // Blur decreases as time passes: starts very blurred, ends fully clear
  const blurAmount = computed(() => {
    if (props.timerTotal <= 0) return 0;
    const ratio = props.timerRemaining / props.timerTotal;
    const maxBlur = 28;
    return Math.max(0, maxBlur * ratio);
  });

  const revealPercent = computed(() => {
    if (props.timerTotal <= 0) return 100;
    return Math.round((1 - props.timerRemaining / props.timerTotal) * 100);
  });
</script>

<template>
  <div class="blind-test">
    <div class="blind-test__image-container">
      <img
        :src="imageSrc"
        alt="Image à deviner"
        class="blind-test__image"
        :style="{ filter: `blur(${blurAmount}px)` }"
      />
      <div class="blind-test__reveal-badge">{{ revealPercent }}% révélé</div>
    </div>
  </div>
</template>

<style scoped>
  .blind-test {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .blind-test__image-container {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg-tertiary);
  }
  .blind-test__image {
    width: 280px;
    height: 220px;
    object-fit: cover;
    display: block;
    transition: filter 1s linear;
  }
  .blind-test__reveal-badge {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }
  @media (max-width: 640px) {
    .blind-test__image {
      width: 100%;
      max-width: 280px;
      height: 180px;
    }
  }
</style>
