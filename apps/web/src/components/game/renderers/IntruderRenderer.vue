<script setup lang="ts">
  import type { IntruderQuestion } from '@/types';

  interface Props {
    question: IntruderQuestion;
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), { disabled: false });
  const emit = defineEmits<{ submit: [answer: string] }>();

  function handleSelect(optionId: string) {
    if (props.disabled) return;
    emit('submit', optionId);
  }
</script>

<template>
  <div class="intruder">
    <div class="intruder__grid">
      <button
        v-for="opt in props.question.options"
        :key="opt.id"
        class="intruder__option"
        :disabled="disabled"
        @click="handleSelect(opt.id)"
      >
        <img :src="opt.imageUrl" :alt="opt.label" class="intruder__img" loading="lazy" />
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
    background: var(--bg-tertiary);
  }
  .intruder__label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }
</style>
