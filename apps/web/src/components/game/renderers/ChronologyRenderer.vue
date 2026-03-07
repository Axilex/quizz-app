<script setup lang="ts">
  import { ref, watch } from 'vue';
  import type { ChronologyQuestion, ChronologyItem } from '@/types';

  interface Props {
    question: ChronologyQuestion;
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), { disabled: false });
  const emit = defineEmits<{ submit: [answer: string] }>();

  const items = ref<ChronologyItem[]>([]);
  const draggedIndex = ref<number | null>(null);
  const dropTargetIndex = ref<number | null>(null);

  watch(
    () => props.question.id,
    () => {
      items.value = [...props.question.items].sort(() => Math.random() - 0.5);
    },
    { immediate: true },
  );

  const ORDINALS = ['1ᵉʳ', '2ᵉ', '3ᵉ', '4ᵉ', '5ᵉ', '6ᵉ'];

  function onDragStart(index: number) {
    if (props.disabled) return;
    draggedIndex.value = index;
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    dropTargetIndex.value = index;
    if (draggedIndex.value === null || draggedIndex.value === index) return;
    const arr = [...items.value];
    const dragged = arr[draggedIndex.value]!;
    arr.splice(draggedIndex.value, 1);
    arr.splice(index, 0, dragged);
    items.value = arr;
    draggedIndex.value = index;
  }

  function onDragEnd() {
    draggedIndex.value = null;
    dropTargetIndex.value = null;
  }

  function moveItem(fromIndex: number, direction: 'up' | 'down') {
    if (props.disabled) return;
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= items.value.length) return;
    const arr = [...items.value];
    [arr[fromIndex], arr[toIndex]] = [arr[toIndex]!, arr[fromIndex]!];
    items.value = arr;
  }

  // Touch support
  let touchIndex = -1;

  function onTouchStart(_e: TouchEvent, index: number) {
    if (props.disabled) return;
    touchIndex = index;
    draggedIndex.value = index;
  }

  function onTouchMove(e: TouchEvent) {
    if (touchIndex < 0) return;
    e.preventDefault();
    const touch = e.touches[0]!;
    const elements = document.querySelectorAll('.tl-item');
    for (let i = 0; i < elements.length; i++) {
      const rect = elements[i]!.getBoundingClientRect();
      if (touch.clientY > rect.top && touch.clientY < rect.bottom && i !== touchIndex) {
        const arr = [...items.value];
        const dragged = arr[touchIndex]!;
        arr.splice(touchIndex, 1);
        arr.splice(i, 0, dragged);
        items.value = arr;
        touchIndex = i;
        draggedIndex.value = i;
        break;
      }
    }
  }

  function onTouchEnd() {
    touchIndex = -1;
    draggedIndex.value = null;
  }

  function handleValidate() {
    const answer = items.value.map((item) => item.id).join(',');
    emit('submit', answer);
  }
</script>

<template>
  <div class="chronology" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <div class="tl-hint">
      <span class="tl-hint__arrow">↑</span>
      <span>Plus ancien</span>
    </div>

    <div class="tl-list">
      <div
        v-for="(item, i) in items"
        :key="item.id"
        class="tl-item"
        :class="{
          'tl-item--dragging': draggedIndex === i,
          'tl-item--first': i === 0,
          'tl-item--last': i === items.length - 1,
        }"
        draggable="true"
        @dragstart="onDragStart(i)"
        @dragover="(e) => onDragOver(e, i)"
        @dragend="onDragEnd"
        @touchstart="(e) => onTouchStart(e, i)"
      >
        <!-- Timeline spine -->
        <div class="tl-item__spine">
          <div
            class="tl-item__line tl-item__line--top"
            :class="{ 'tl-item__line--hidden': i === 0 }"
          />
          <div class="tl-item__dot" />
          <div
            class="tl-item__line tl-item__line--bottom"
            :class="{ 'tl-item__line--hidden': i === items.length - 1 }"
          />
        </div>

        <!-- Content -->
        <div class="tl-item__content">
          <span class="tl-item__ordinal">{{ ORDINALS[i] ?? `${i + 1}ᵉ` }}</span>
          <span class="tl-item__label">{{ item.label }}</span>
        </div>

        <!-- Move arrows -->
        <div class="tl-item__arrows">
          <button
            class="tl-arrow"
            :disabled="disabled || i === 0"
            tabindex="-1"
            @click.stop="moveItem(i, 'up')"
          >
            ▲
          </button>
          <button
            class="tl-arrow"
            :disabled="disabled || i === items.length - 1"
            tabindex="-1"
            @click.stop="moveItem(i, 'down')"
          >
            ▼
          </button>
        </div>

        <!-- Drag handle -->
        <span class="tl-item__handle">⠿</span>
      </div>
    </div>

    <div class="tl-hint">
      <span class="tl-hint__arrow">↓</span>
      <span>Plus récent</span>
    </div>

    <button class="tl-validate" :disabled="disabled" @click="handleValidate">
      Valider l'ordre
    </button>
  </div>
</template>

<style scoped>
  .chronology {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tl-hint {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
    padding-left: 1.2rem;
  }
  .tl-hint__arrow {
    font-size: 0.9rem;
    color: var(--accent);
    opacity: 0.6;
  }

  .tl-list {
    display: flex;
    flex-direction: column;
  }

  .tl-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: grab;
    user-select: none;
    touch-action: none;
    transition: all 0.15s;
    padding: 0.15rem 0;
  }
  .tl-item:active {
    cursor: grabbing;
  }
  .tl-item--dragging {
    opacity: 0.5;
  }

  /* Timeline spine */
  .tl-item__spine {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 20px;
    flex-shrink: 0;
    align-self: stretch;
  }
  .tl-item__line {
    flex: 1;
    width: 2px;
    background: var(--border);
    transition: background 0.2s;
  }
  .tl-item__line--hidden {
    background: transparent;
  }
  .tl-item__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--bg-primary);
    box-shadow: 0 0 0 2px var(--accent);
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .tl-item:hover .tl-item__dot {
    transform: scale(1.2);
    box-shadow:
      0 0 0 3px var(--accent),
      0 0 8px var(--accent-glow);
  }
  .tl-item--dragging .tl-item__dot {
    background: var(--warning);
    box-shadow: 0 0 0 2px var(--warning);
  }

  /* Content */
  .tl-item__content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 0.9rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 10px;
    transition: all 0.15s;
    min-height: 3rem;
  }
  .tl-item:hover .tl-item__content {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 4%, var(--bg-secondary));
  }
  .tl-item--dragging .tl-item__content {
    border-color: var(--warning);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .tl-item__ordinal {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-tertiary));
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .tl-item__label {
    font-size: 0.92rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  /* Move arrows */
  .tl-item__arrows {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex-shrink: 0;
  }
  .tl-arrow {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.65rem;
    cursor: pointer;
    padding: 0.15rem 0.3rem;
    border-radius: 4px;
    transition: all 0.15s;
    line-height: 1;
  }
  .tl-arrow:hover:not(:disabled) {
    color: var(--accent);
    background: var(--bg-tertiary);
  }
  .tl-arrow:disabled {
    opacity: 0.2;
    cursor: default;
  }

  .tl-item__handle {
    color: var(--text-muted);
    font-size: 1rem;
    line-height: 1;
    opacity: 0.4;
    flex-shrink: 0;
  }
  .tl-item:hover .tl-item__handle {
    opacity: 0.8;
  }

  .tl-validate {
    margin-top: 0.5rem;
    padding: 0.8rem 1.5rem;
    background: var(--accent);
    color: var(--bg-primary);
    border: none;
    border-radius: 10px;
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tl-validate:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-1px);
  }
  .tl-validate:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
