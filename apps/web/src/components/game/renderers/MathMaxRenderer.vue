<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import type { MathMaxQuestion, MathTile } from '@/types';

  interface Props {
    question: MathMaxQuestion;
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), { disabled: false });
  const emit = defineEmits<{ submit: [answer: string] }>();

  // Available tiles (not yet placed)
  const availableTiles = ref<MathTile[]>([]);
  // The expression slots: numbers and operators alternate
  const slots = ref<Array<MathTile | null>>([]);

  // Reset when question changes
  watch(
    () => props.question.id,
    () => reset(),
    { immediate: true },
  );

  function reset() {
    availableTiles.value = [...props.question.tiles];
    // Total slots = all tiles (numbers + operators + parentheses)
    const total = props.question.tiles.length;
    slots.value = Array(total).fill(null);
  }

  // ─── Drag logic ───────────────────────────────────────────────────────────
  const draggingTile = ref<{ tile: MathTile; from: 'available' | number } | null>(null);

  function onDragStartAvailable(tile: MathTile) {
    if (props.disabled) return;
    draggingTile.value = { tile, from: 'available' };
  }

  function onDragStartSlot(tile: MathTile, slotIdx: number) {
    if (props.disabled) return;
    draggingTile.value = { tile, from: slotIdx };
  }

  function onDropSlot(slotIdx: number) {
    if (!draggingTile.value || props.disabled) return;
    const { tile, from } = draggingTile.value;
    const existing = slots.value[slotIdx];

    // Place tile in slot
    slots.value[slotIdx] = tile;

    // Return displaced tile
    if (existing) {
      availableTiles.value.push(existing);
    }

    // Remove from source
    if (from === 'available') {
      availableTiles.value = availableTiles.value.filter((t) => t.id !== tile.id);
    } else {
      slots.value[from as number] = null;
    }

    draggingTile.value = null;
  }

  function onDropAvailable() {
    if (!draggingTile.value || props.disabled) return;
    const { tile, from } = draggingTile.value;

    if (from !== 'available') {
      slots.value[from as number] = null;
      availableTiles.value.push(tile);
    }
    draggingTile.value = null;
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  // ─── Touch support ────────────────────────────────────────────────────────
  function onTileClick(tile: MathTile, from: 'available' | number) {
    if (props.disabled) return;
    // Find first empty slot
    const emptyIdx = slots.value.findIndex((s) => s === null);
    if (emptyIdx === -1) return;

    if (from === 'available') {
      slots.value[emptyIdx] = tile;
      availableTiles.value = availableTiles.value.filter((t) => t.id !== tile.id);
    } else {
      // Return to available
      slots.value[from as number] = null;
      availableTiles.value.push(tile);
    }
  }

  // ─── Evaluate & submit ────────────────────────────────────────────────────

  /** Tokenize the slots into a string expression and evaluate with proper math rules */
  function evaluateExpression(tokens: MathTile[]): number | null {
    // Build expression string from tiles
    const expr = tokens
      .map((t) => {
        if (t.value === '×') return '*';
        if (t.value === '÷') return '/';
        return t.value;
      })
      .join(' ');

    try {
      // Safe math evaluation using Function (no eval)
      // Only allows digits, operators, parentheses, spaces, and dots
      const sanitized = expr.replace(/[^0-9+\-*/().  ]/g, '');
      if (!sanitized.trim()) return null;

      // Check balanced parentheses
      let depth = 0;
      for (const ch of sanitized) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (depth < 0) return null;
      }
      if (depth !== 0) return null;

      const result = new Function(`return (${sanitized})`)() as number;
      if (typeof result !== 'number' || !isFinite(result)) return null;
      return Math.round(result * 1000) / 1000; // avoid floating point weirdness
    } catch {
      return null;
    }
  }

  const currentValue = computed<number | null>(() => {
    if (slots.value.some((s) => s === null)) return null;
    const tiles = slots.value.filter((s): s is MathTile => s !== null);
    return evaluateExpression(tiles);
  });

  const isComplete = computed(() => slots.value.every((s) => s !== null));

  function handleSubmit() {
    if (!isComplete.value || currentValue.value === null || props.disabled) return;
    emit('submit', String(currentValue.value));
  }
</script>

<template>
  <div class="math-max">
    <!-- Expression slots -->
    <div class="math-max__slots">
      <div
        v-for="(slot, i) in slots"
        :key="i"
        class="math-max__slot"
        :class="{
          'math-max__slot--filled': !!slot,
          'math-max__slot--number': slot?.tileType === 'number',
          'math-max__slot--operator': slot?.tileType === 'operator',
          'math-max__slot--parenthesis': slot?.tileType === 'parenthesis',
        }"
        @dragover="onDragOver"
        @drop="onDropSlot(i)"
        @click="slot && onTileClick(slot, i)"
      >
        <span
          v-if="slot"
          class="math-max__tile-value"
          draggable="true"
          @dragstart="onDragStartSlot(slot, i)"
        >
          {{ slot.value }}
        </span>
        <span v-else class="math-max__slot-placeholder">?</span>
      </div>
    </div>

    <!-- Live result preview -->
    <div class="math-max__preview">
      <span class="math-max__equals">=</span>
      <span class="math-max__result" :class="{ 'math-max__result--ready': isComplete }">
        {{ isComplete && currentValue !== null ? currentValue : '…' }}
      </span>
    </div>

    <!-- Available tiles -->
    <div class="math-max__available" @dragover="onDragOver" @drop="onDropAvailable">
      <button
        v-for="tile in availableTiles"
        :key="tile.id"
        class="math-max__tile"
        :class="`math-max__tile--${tile.tileType}`"
        :disabled="disabled"
        draggable="true"
        @dragstart="onDragStartAvailable(tile)"
        @click="onTileClick(tile, 'available')"
      >
        {{ tile.value }}
      </button>
      <span v-if="availableTiles.length === 0" class="math-max__all-placed">
        Toutes les tuiles sont placées ✓
      </span>
    </div>

    <!-- Submit -->
    <button class="math-max__submit" :disabled="!isComplete || disabled" @click="handleSubmit">
      Valider → {{ isComplete && currentValue !== null ? currentValue : '?' }}
    </button>
  </div>
</template>

<style scoped>
  .math-max {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 0.5rem 0;
  }

  /* ─── Slots ─────────────────── */
  .math-max__slots {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .math-max__slot {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    border: 2px dashed var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    cursor: pointer;
    background: var(--bg-tertiary);
  }

  .math-max__slot:hover:not(.math-max__slot--filled) {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 5%, var(--bg-tertiary));
  }

  .math-max__slot--filled {
    border-style: solid;
    border-color: var(--border);
    cursor: pointer;
  }

  .math-max__slot--number.math-max__slot--filled {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
  }

  .math-max__slot--operator.math-max__slot--filled {
    border-color: var(--text-muted);
    background: var(--bg-secondary);
  }

  .math-max__slot--parenthesis.math-max__slot--filled {
    border-color: var(--warning, #f0ad4e);
    background: color-mix(in srgb, var(--warning, #f0ad4e) 10%, var(--bg-secondary));
  }

  .math-max__slot-placeholder {
    font-size: 1.5rem;
    color: var(--text-muted);
    opacity: 0.4;
    font-family: var(--font-mono);
  }

  .math-max__tile-value {
    font-family: var(--font-mono);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-primary);
    cursor: grab;
    user-select: none;
  }

  /* ─── Preview ───────────────── */
  .math-max__preview {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: var(--font-mono);
  }

  .math-max__equals {
    font-size: 1.6rem;
    color: var(--text-muted);
    font-weight: 700;
  }

  .math-max__result {
    font-size: 2rem;
    font-weight: 900;
    color: var(--text-muted);
    transition: color 0.3s;
    min-width: 60px;
    text-align: center;
  }

  .math-max__result--ready {
    color: var(--accent);
  }

  /* ─── Available tiles ────────── */
  .math-max__available {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
    min-height: 64px;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 14px;
    width: 100%;
    max-width: 360px;
  }

  .math-max__tile {
    width: 60px;
    height: 60px;
    border-radius: 10px;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 1.3rem;
    font-weight: 700;
    cursor: grab;
    transition: all 0.2s;
    user-select: none;
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .math-max__tile--number {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
    color: var(--accent);
  }

  .math-max__tile--operator {
    background: var(--bg-secondary);
    font-size: 1.5rem;
  }

  .math-max__tile--parenthesis {
    border-color: var(--warning, #f0ad4e);
    background: color-mix(in srgb, var(--warning, #f0ad4e) 10%, var(--bg-secondary));
    color: var(--warning, #f0ad4e);
    font-size: 1.6rem;
    font-weight: 900;
  }

  .math-max__tile:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  .math-max__tile:active {
    cursor: grabbing;
    transform: scale(0.95);
  }

  .math-max__tile:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .math-max__all-placed {
    font-size: 0.82rem;
    color: var(--success);
    align-self: center;
  }

  /* ─── Submit ─────────────────── */
  .math-max__submit {
    padding: 0.75rem 2rem;
    border-radius: 12px;
    border: 2px solid var(--accent);
    background: var(--accent);
    color: var(--bg-primary);
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .math-max__submit:hover:not(:disabled) {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--accent-glow);
  }

  .math-max__submit:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
