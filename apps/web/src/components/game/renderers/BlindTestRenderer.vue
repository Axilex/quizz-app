<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import type { BlindTestQuestion } from '@/types';
  import { generateBlindTest } from '@/utils/svgPlaceholders';

  interface Props {
    question: BlindTestQuestion;
    timerTotal: number;
    timerRemaining: number;
  }

  const props = defineProps<Props>();

  const SUBJECT_EMOJIS: Record<string, string> = {
    eiffel_tower: '🗼', dna: '🧬', thinker: '🤔', saturn: '🪐',
  };

  const emoji = computed(() => SUBJECT_EMOJIS[props.question.svg] ?? '🖼️');
  const imageSrc = computed(() => generateBlindTest(emoji.value, ''));

  // Blur decreases as time passes (more revealed as timer runs down)
  const blurAmount = computed(() => {
    if (props.timerTotal <= 0) return 0;
    const progress = 1 - props.timerRemaining / props.timerTotal;
    const maxBlur = 20;
    const minBlur = 0;
    return Math.max(minBlur, maxBlur * (1 - progress));
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
    width: 240px;
    height: 200px;
    object-fit: cover;
    display: block;
    transition: filter 0.5s ease;
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
</style>
