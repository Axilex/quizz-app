<script setup lang="ts">
  import type { SplitImageQuestion } from '@/types';

  interface Props {
    question: SplitImageQuestion;
  }

  const props = defineProps<Props>();
</script>

<template>
  <div class="split-image">
    <div class="split-image__container">
      <!-- Top half of first image -->
      <div class="split-image__half split-image__half--top">
        <img
          :src="props.question.topHalf.imageUrl"
          :alt="props.question.topHalf.alt"
          class="split-image__img split-image__img--top"
          loading="lazy"
        />
      </div>

      <!-- Divider line -->
      <div class="split-image__divider">
        <div class="split-image__divider-line" />
        <span class="split-image__divider-icon">✂️</span>
        <div class="split-image__divider-line" />
      </div>

      <!-- Bottom half of second image -->
      <div class="split-image__half split-image__half--bottom">
        <img
          :src="props.question.bottomHalf.imageUrl"
          :alt="props.question.bottomHalf.alt"
          class="split-image__img split-image__img--bottom"
          loading="lazy"
        />
      </div>
    </div>

    <div v-if="props.question.hint" class="split-image__hint">💡 {{ props.question.hint }}</div>
  </div>
</template>

<style scoped>
  .split-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .split-image__container {
    width: 220px;
    border-radius: 16px;
    overflow: hidden;
    border: 2px solid var(--border);
    background: var(--bg-tertiary);
    position: relative;
  }

  .split-image__half {
    width: 100%;
    height: 110px;
    overflow: hidden;
    position: relative;
  }

  .split-image__img {
    width: 100%;
    height: 220px;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  .split-image__img--top {
    object-position: center top;
    transform: translateY(0);
  }

  .split-image__img--bottom {
    object-position: center bottom;
    transform: translateY(-50%);
  }

  .split-image__divider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem;
    background: var(--bg-primary);
    height: 28px;
    z-index: 2;
    position: relative;
  }

  .split-image__divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .split-image__divider-icon {
    font-size: 0.85rem;
    line-height: 1;
    color: var(--text-muted);
  }

  .split-image__hint {
    font-size: 0.82rem;
    color: var(--text-muted);
    text-align: center;
    max-width: 260px;
  }

  @media (max-width: 640px) {
    .split-image__container {
      width: 180px;
    }

    .split-image__half {
      height: 90px;
    }

    .split-image__img {
      height: 180px;
    }
  }
</style>
