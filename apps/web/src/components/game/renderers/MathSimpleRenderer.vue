<script setup lang="ts">
  import type { MathSimpleQuestion } from '@/types';

  interface Props {
    question: MathSimpleQuestion;
  }
  defineProps<Props>();
</script>

<template>
  <div class="math-simple">
    <div class="math-simple__expression">
      {{ question.expression }}
    </div>
    <p class="math-simple__equals">= ?</p>
  </div>
</template>

<style scoped>
  .math-simple {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0;
  }

  .math-simple__expression {
    font-family: var(--font-mono);
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1rem 2rem;
    text-align: center;
  }

  .math-simple__equals {
    font-family: var(--font-mono);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--accent);
  }

  @media (max-width: 640px) {
    .math-simple__expression {
      font-size: 1.8rem;
      padding: 0.75rem 1.5rem;
    }
    .math-simple__equals {
      font-size: 1.4rem;
    }
  }
</style>
