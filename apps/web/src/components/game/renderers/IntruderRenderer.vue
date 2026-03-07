<script setup lang="ts">
  import type { IntruderQuestion } from '@/types';
  import { generateIntruderItem } from '@/utils/svgPlaceholders';

  interface Props {
    question: IntruderQuestion;
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), { disabled: false });
  const emit = defineEmits<{ submit: [answer: string] }>();

  const ITEM_EMOJIS: Record<string, string> = {
    oxygen: '💨', nitrogen: '🌫️', helium: '🎈', mercury: '🌡️',
    paris: '🗼', tokyo: '🏯', sydney: '🐨', berlin: '🧱',
    violin: '🎻', guitar: '🎸', harp: '🎵', drums: '🥁',
    einstein: '🧑‍🔬', curie: '👩‍🔬', mozart: '🎹', newton: '🍎',
  };

  function getImage(svg: string, label: string, index: number): string {
    const emoji = ITEM_EMOJIS[svg] ?? '❓';
    return generateIntruderItem(emoji, label, index);
  }

  function handleSelect(optionId: string) {
    if (props.disabled) return;
    emit('submit', optionId);
  }
</script>

<template>
  <div class="intruder">
    <div class="intruder__grid">
      <button
        v-for="(opt, i) in props.question.options"
        :key="opt.id"
        class="intruder__option"
        :disabled="disabled"
        @click="handleSelect(opt.id)"
      >
        <img :src="getImage(opt.svg, opt.label, i)" :alt="opt.label" class="intruder__img" />
        <span class="intruder__label">{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .intruder__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
    max-width: 380px;
    margin: 0 auto;
  }
  .intruder__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .intruder__option:hover:not(:disabled) {
    border-color: var(--error);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(224, 108, 108, 0.15);
  }
  .intruder__option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .intruder__img {
    width: 100%;
    border-radius: 8px;
    aspect-ratio: 1;
    object-fit: cover;
  }
  .intruder__label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }
</style>
