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

  // Types that handle their own submit via interactive renderer
  const isInteractive = computed(
    () => isChronology.value || isIntruder.value || isMathMax.value || isGeoClick.value,
  );

  // Types that use text input
  const isTextInput = computed(() => !isQcm.value && !isInteractive.value);

  const qcmOptions = computed(() => {
    if (!isQcm.value) return [];
    const opts = (props.question as QcmQuestion).options;
    if (!props.removedOptionIds?.length) return opts;
    return opts.filter((o) => !props.removedOptionIds!.includes(o.id));
  });

  const placeholder = computed(() => {
    if (isNumber.value || isMathSimple.value) return 'Entrez un nombre...';
    if (props.question.type === 'rebus') return 'Quel mot se cache dans ce rébus ?';
    if (props.question.type === 'fourImages') return 'Quel mot relie ces images ?';
    if (props.question.type === 'blindTest') return 'Que voyez-vous ?';
    if (props.question.type === 'geoMap') return 'Quel pays ou lieu ?';
    if (props.question.type === 'silhouette') return 'Que représente cette silhouette ?';
    if (props.question.type === 'splitImage') return 'Quelle est la réponse ?';
    return 'Tapez votre réponse...';
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
    <!-- Chronology: drag & drop -->
    <ChronologyRenderer
      v-if="isChronology"
      :question="question as ChronologyQuestion"
      :disabled="disabled"
      @submit="handleInteractiveSubmit"
    />

    <!-- Intruder: click to select -->
    <IntruderRenderer
      v-else-if="isIntruder"
      :question="question as IntruderQuestion"
      :disabled="disabled"
      @submit="handleInteractiveSubmit"
    />

    <!-- MathMax: drag tiles (interactive) -->
    <MathMaxRenderer
      v-else-if="isMathMax"
      :question="question as MathMaxQuestion"
      :disabled="disabled"
      @submit="handleInteractiveSubmit"
    />

    <!-- QCM mode -->
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

    <!-- Text/Number/Visual with text answer -->
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
        Valider
      </button>
    </div>
  </div>
</template>

<style scoped>
  .answer-input {
    width: 100%;
  }
  .qcm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .qcm-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.2rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--text-primary);
  }
  .qcm-option:hover:not(:disabled) {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
    transform: translateY(-1px);
  }
  .qcm-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .qcm-option__key {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    background: var(--bg-tertiary);
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
  .qcm-option__label {
    flex: 1;
  }
  .text-input-wrapper {
    display: flex;
    gap: 0.75rem;
  }
  .text-input {
    flex: 1;
    padding: 0.85rem 1.2rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 12px;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 1rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .text-input:focus {
    border-color: var(--accent);
  }
  .text-input::placeholder {
    color: var(--text-muted);
  }
  .submit-btn {
    padding: 0.85rem 1.8rem;
    background: var(--accent);
    color: var(--bg-primary);
    border: none;
    border-radius: 12px;
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--accent-glow);
  }
  .submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  @media (max-width: 640px) {
    .qcm-grid {
      grid-template-columns: 1fr;
    }
    .text-input-wrapper {
      flex-direction: column;
    }
  }
</style>
