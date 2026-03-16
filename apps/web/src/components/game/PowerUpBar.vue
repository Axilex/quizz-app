<script setup lang="ts">
  import { computed } from 'vue';
  import type { Player } from '@/types';

  interface Props {
    powerUpsLeft: number;
    players: Player[];
    myPlayerId: string | null;
    currentQuestionType: string;
    disabled?: boolean;
    isFlash?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), { disabled: false, isFlash: false });
  const emit = defineEmits<{
    malus: [targetPlayerId: string];
    bonus50: [];
  }>();

  const opponents = computed(() =>
    props.players.filter((p) => p.id !== props.myPlayerId && p.status !== 'disconnected'),
  );

  const canUseMalus = computed(
    () => props.powerUpsLeft > 0 && !props.disabled && opponents.value.length > 0,
  );
  const canUseBonus = computed(
    () => props.powerUpsLeft > 0 && !props.disabled && props.currentQuestionType === 'qcm',
  );

  const dots = computed(() => Array.from({ length: 3 }, (_, i) => i < props.powerUpsLeft));

  function handleMalus() {
    if (!canUseMalus.value) return;
    if (opponents.value.length === 1) {
      emit('malus', opponents.value[0]!.id);
    } else {
      const target = opponents.value[Math.floor(Math.random() * opponents.value.length)]!;
      emit('malus', target.id);
    }
  }

  const malusTitle = computed(() =>
    canUseMalus.value ? "Flouter la question d'un adversaire (6s)" : 'Malus indisponible',
  );
  const bonusTitle = computed(() => {
    if (props.currentQuestionType !== 'qcm') return 'Réservé aux QCM';
    return canUseBonus.value ? 'Éliminer 2 mauvaises réponses QCM' : 'Bonus indisponible';
  });

  function handleBonus() {
    if (!canUseBonus.value) return;
    emit('bonus50');
  }
</script>

<template>
  <div class="powerup-bar" :class="{ 'powerup-bar--flash': isFlash }">
    <div class="powerup-bar__uses">
      <span class="powerup-bar__label">Power-ups</span>
      <div class="powerup-bar__dots">
        <span
          v-for="(active, i) in dots"
          :key="i"
          class="powerup-bar__dot"
          :class="{ 'powerup-bar__dot--used': !active }"
        />
      </div>
    </div>

    <button
      class="powerup-btn powerup-btn--malus"
      :class="{ 'powerup-btn--disabled': !canUseMalus }"
      :disabled="!canUseMalus"
      :title="malusTitle"
      @click="handleMalus"
    >
      <span class="powerup-btn__icon">🌫️</span>
      <span class="powerup-btn__label">Brouillard</span>
    </button>

    <button
      class="powerup-btn powerup-btn--bonus"
      :class="{ 'powerup-btn--disabled': !canUseBonus }"
      :disabled="!canUseBonus"
      :title="bonusTitle"
      @click="handleBonus"
    >
      <span class="powerup-btn__icon">🎯</span>
      <span class="powerup-btn__label">50 / 50</span>
    </button>
  </div>
</template>

<style scoped>
  .powerup-bar {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
    justify-content: center;
    transition: all 0.3s;
  }

  .powerup-bar--flash {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.04);
  }

  .powerup-bar__uses {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-right: var(--space-xs);
  }
  .powerup-bar__label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .powerup-bar__dots {
    display: flex;
    gap: 0.25rem;
  }
  .powerup-bar__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    transition: all 0.3s;
  }
  .powerup-bar__dot--used {
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
  }

  .powerup-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.9rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-secondary);
    transition: all 0.2s;
    white-space: nowrap;
    min-height: 40px;
    -webkit-tap-highlight-color: transparent;
  }

  .powerup-btn--malus:hover:not(:disabled) {
    border-color: var(--error);
    color: var(--error);
    background: var(--error-soft);
  }
  .powerup-btn--bonus:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }
  .powerup-btn--disabled,
  .powerup-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .powerup-btn__icon {
    font-size: 1rem;
  }

  @media (max-width: 400px) {
    .powerup-btn__label {
      display: none;
    }
    .powerup-btn {
      padding: 0.45rem 0.6rem;
    }
  }
</style>
