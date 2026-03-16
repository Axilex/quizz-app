<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue';
  import type {
    Question,
    QcmQuestion,
    ChronologyQuestion,
    IntruderQuestion,
    MathMaxQuestion,
  } from '@/types';
  import ChronologyRenderer from './renderers/ChronologyRenderer.vue';
  import IntruderRenderer from './renderers/IntruderRenderer.vue';
  import MathMaxRenderer from './renderers/MathMaxRenderer.vue';

  interface Props {
    question: Question;
    disabled?: boolean;
    removedOptionIds?: string[];
  }

  const props = withDefaults(defineProps<Props>(), { disabled: false, removedOptionIds: () => [] });
  const emit = defineEmits<{ submit: [answer: string] }>();

  const textAnswer = ref('');
  const inputRef = ref<HTMLInputElement | null>(null);

  const isQcm = computed(() => props.question.type === 'qcm');
  const isNumber = computed(() => props.question.type === 'number');
  const isChronology = computed(() => props.question.type === 'chronology');
  const isIntruder = computed(() => props.question.type === 'intruder');
  const isMathMax = computed(() => props.question.type === 'mathMax');
  const isMathSimple = computed(() => props.question.type === 'mathSimple');
  const isGeoClick = computed(() => props.question.type === 'geoClickMap');

  const isInteractive = computed(
    () => isChronology.value || isIntruder.value || isMathMax.value || isGeoClick.value,
  );
  const isTextInput = computed(() => !isQcm.value && !isInteractive.value);

  const qcmOptions = computed(() => {
    if (!isQcm.value) return [];
    const opts = (props.question as QcmQuestion).options;
    if (!props.removedOptionIds?.length) return opts;
    return opts.filter((o) => !props.removedOptionIds!.includes(o.id));
  });

  const placeholder = computed(() => {
    if (isNumber.value || isMathSimple.value) return 'Entrez un nombre…';
    if (props.question.type === 'rebus') return 'Quel mot se cache dans ce rébus ?';
    if (props.question.type === 'fourImages') return 'Quel mot relie ces images ?';
    if (props.question.type === 'blindTest') return 'Que voyez-vous ?';
    if (props.question.type === 'geoMap') return 'Quel pays ou lieu ?';
    if (props.question.type === 'silhouette') return 'Que représente cette silhouette ?';
    if (props.question.type === 'splitImage') return 'Quelle est la réponse ?';
    return 'Tapez votre réponse…';
  });

  function handleSubmit() {
    const answer = textAnswer.value.trim();
    if (!answer || props.disabled) return;
    emit('submit', answer);
  }

  function handleQcmSelect(label: string) {
    if (props.disabled) return;
    emit('submit', label);
  }

  function handleInteractiveSubmit(answer: string) {
    if (props.disabled) return;
    emit('submit', answer);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  watch(
    () => props.question.id,
    () => {
      textAnswer.value = '';
      nextTick(() => inputRef.value?.focus());
    },
    { immediate: true },
  );
</script>

<template>
  <div class="answer-input">
    <ChronologyRenderer
      v-if="isChronology"
      :question="question as ChronologyQuestion"
      :disabled="disabled"
      @submit="handleInteractiveSubmit"
    />
    <IntruderRenderer
      v-else-if="isIntruder"
      :question="question as IntruderQuestion"
      :disabled="disabled"
      @submit="handleInteractiveSubmit"
    />
    <MathMaxRenderer
      v-else-if="isMathMax"
      :question="question as MathMaxQuestion"
      :disabled="disabled"
      @submit="handleInteractiveSubmit"
    />

    <!-- QCM -->
    <div v-else-if="isQcm" class="qcm-grid">
      <button
        v-for="opt in qcmOptions"
        :key="opt.id"
        class="qcm-option"
        :disabled="disabled"
        @click="handleQcmSelect(opt.label)"
      >
        <span class="qcm-option__key">{{ opt.id.toUpperCase() }}</span>
        <span class="qcm-option__label">{{ opt.label }}</span>
      </button>
    </div>

    <!-- Text/Number input -->
    <div v-else-if="isTextInput" class="text-input-wrapper">
      <input
        ref="inputRef"
        v-model="textAnswer"
        type="text"
        :inputmode="isNumber ? 'numeric' : 'text'"
        :placeholder="placeholder"
        :disabled="disabled"
        class="text-input"
        autocomplete="off"
        @keydown="handleKeydown"
      />
      <button class="submit-btn" :disabled="disabled || !textAnswer.trim()" @click="handleSubmit">
        <span class="submit-btn__text">Valider</span>
        <span class="submit-btn__arrow">→</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .answer-input {
    width: 100%;
  }

  /* QCM Grid */
  .qcm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .qcm-option {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-md);
    background: var(--bg-secondary);
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s var(--ease-out-expo);
    text-align: left;
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: var(--text-primary);
    min-height: 56px;
    -webkit-tap-highlight-color: transparent;
  }

  .qcm-option:hover:not(:disabled) {
    border-color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .qcm-option:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }

  .qcm-option:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .qcm-option__key {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: var(--radius-sm);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    font-weight: 700;
    font-size: var(--text-xs);
    color: var(--text-secondary);
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .qcm-option:hover:not(:disabled) .qcm-option__key {
    background: var(--accent-soft);
    border-color: rgba(232, 178, 80, 0.3);
    color: var(--accent);
  }

  .qcm-option__label {
    flex: 1;
    line-height: 1.35;
  }

  /* Text input */
  .text-input-wrapper {
    display: flex;
    gap: var(--space-sm);
  }

  .text-input {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    background: var(--bg-secondary);
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: var(--text-base);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    outline: none;
    min-height: 52px;
  }

  .text-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .text-input::placeholder {
    color: var(--text-muted);
  }

  .submit-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: var(--space-md) var(--space-xl);
    background: linear-gradient(135deg, var(--accent), #d4a03a);
    color: var(--bg-base);
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    font-weight: 700;
    font-size: var(--text-base);
    cursor: pointer;
    transition: all 0.2s var(--ease-out-expo);
    white-space: nowrap;
    min-height: 52px;
  }

  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #f0c060, var(--accent));
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(232, 178, 80, 0.3);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .submit-btn__arrow {
    font-size: 1.1em;
    transition: transform 0.2s;
  }

  .submit-btn:hover:not(:disabled) .submit-btn__arrow {
    transform: translateX(3px);
  }

  @media (max-width: 640px) {
    .qcm-grid {
      grid-template-columns: 1fr;
    }
    .text-input-wrapper {
      flex-direction: column;
    }
    .submit-btn {
      justify-content: center;
    }
  }

  @media (hover: none) {
    .qcm-option:hover:not(:disabled) {
      transform: none;
    }
    .qcm-option:active:not(:disabled) {
      transform: scale(0.97);
    }
    .submit-btn:hover:not(:disabled) {
      transform: none;
    }
    .submit-btn:active:not(:disabled) {
      transform: scale(0.97);
    }
  }
</style>
