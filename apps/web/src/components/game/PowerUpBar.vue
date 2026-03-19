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
    isDoubleActive?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    isFlash: false,
    isDoubleActive: false,
  });
  const emit = defineEmits<{
    malus: [targetPlayerId: string];
    freeze: [targetPlayerId: string];
    speed: [targetPlayerId: string];
    bonus50: [];
    double: [];
    time: [];
  }>();

  const opponents = computed(() =>
    props.players.filter((p) => p.id !== props.myPlayerId && p.status !== 'disconnected'),
  );

  const hasPowerUps = computed(() => props.powerUpsLeft > 0 && !props.disabled);
  const hasOpponents = computed(() => opponents.value.length > 0);

  const canUseMalus = computed(() => hasPowerUps.value && hasOpponents.value);
  const canUseFreeze = computed(() => hasPowerUps.value && hasOpponents.value);
  const canUseSpeed = computed(() => hasPowerUps.value && hasOpponents.value);
  const canUseBonus = computed(() => hasPowerUps.value && props.currentQuestionType === 'qcm');
  const canUseDouble = computed(() => hasPowerUps.value && !props.isDoubleActive);
  const canUseTime = computed(() => hasPowerUps.value);

  const dots = computed(() => Array.from({ length: 3 }, (_, i) => i < props.powerUpsLeft));

  function pickTarget(): string {
    if (opponents.value.length === 1) return opponents.value[0]!.id;
    return opponents.value[Math.floor(Math.random() * opponents.value.length)]!.id;
  }

  function handleMalus() {
    if (!canUseMalus.value) return;
    emit('malus', pickTarget());
  }
  function handleFreeze() {
    if (!canUseFreeze.value) return;
    emit('freeze', pickTarget());
  }
  function handleSpeed() {
    if (!canUseSpeed.value) return;
    emit('speed', pickTarget());
  }
  function handleBonus() {
    if (!canUseBonus.value) return;
    emit('bonus50');
  }
  function handleDouble() {
    if (!canUseDouble.value) return;
    emit('double');
  }
  function handleTime() {
    if (!canUseTime.value) return;
    emit('time');
  }

  const malusTitle = computed(() =>
    canUseMalus.value ? "Flouter la question d'un adversaire (6s)" : 'Malus indisponible',
  );
  const freezeTitle = computed(() =>
    canUseFreeze.value ? "Geler les contrôles d'un adversaire (4s)" : 'Malus indisponible',
  );
  const speedTitle = computed(() =>
    canUseSpeed.value ? "Accélérer le timer d'un adversaire (x3, 8s)" : 'Malus indisponible',
  );
  const bonusTitle = computed(() => {
    if (props.currentQuestionType !== 'qcm') return 'Réservé aux QCM';
    return canUseBonus.value ? 'Éliminer 2 mauvaises réponses QCM' : 'Bonus indisponible';
  });
  const doubleTitle = computed(() => {
    if (props.isDoubleActive) return 'Double déjà activé';
    return canUseDouble.value ? 'Doubler les points de la prochaine réponse' : 'Bonus indisponible';
  });
  const timeTitle = computed(() =>
    canUseTime.value ? 'Ajouter 10 secondes au timer' : 'Bonus indisponible',
  );
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

    <div class="powerup-bar__group">
      <span class="powerup-bar__group-label">Malus</span>
      <div class="powerup-bar__buttons">
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
          class="powerup-btn powerup-btn--malus"
          :class="{ 'powerup-btn--disabled': !canUseFreeze }"
          :disabled="!canUseFreeze"
          :title="freezeTitle"
          @click="handleFreeze"
        >
          <span class="powerup-btn__icon">❄️</span>
          <span class="powerup-btn__label">Gel</span>
        </button>

        <button
          class="powerup-btn powerup-btn--malus"
          :class="{ 'powerup-btn--disabled': !canUseSpeed }"
          :disabled="!canUseSpeed"
          :title="speedTitle"
          @click="handleSpeed"
        >
          <span class="powerup-btn__icon">⚡</span>
          <span class="powerup-btn__label">Accéléré</span>
        </button>
      </div>
    </div>

    <div class="powerup-bar__group">
      <span class="powerup-bar__group-label">Bonus</span>
      <div class="powerup-bar__buttons">
        <button
          class="powerup-btn powerup-btn--bonus"
          :class="{ 'powerup-btn--disabled': !canUseBonus }"
          :disabled="!canUseBonus"
          :title="bonusTitle"
          @click="handleBonus"
        >
          <span class="powerup-btn__icon">🎯</span>
          <span class="powerup-btn__label">50/50</span>
        </button>

        <button
          class="powerup-btn powerup-btn--bonus"
          :class="{ 'powerup-btn--disabled': !canUseDouble, 'powerup-btn--active': isDoubleActive }"
          :disabled="!canUseDouble"
          :title="doubleTitle"
          @click="handleDouble"
        >
          <span class="powerup-btn__icon">✨</span>
          <span class="powerup-btn__label">Double</span>
        </button>

        <button
          class="powerup-btn powerup-btn--bonus"
          :class="{ 'powerup-btn--disabled': !canUseTime }"
          :disabled="!canUseTime"
          :title="timeTitle"
          @click="handleTime"
        >
          <span class="powerup-btn__icon">⏱️</span>
          <span class="powerup-btn__label">+10s</span>
        </button>
      </div>
    </div>
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

  .powerup-bar__group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .powerup-bar__group-label {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
  }
  .powerup-bar__buttons {
    display: flex;
    gap: 0.3rem;
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
  .powerup-btn--active {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
    animation: active-pulse 1.5s ease-in-out infinite alternate;
  }
  @keyframes active-pulse {
    from {
      box-shadow: 0 0 4px rgba(232, 178, 80, 0.2);
    }
    to {
      box-shadow: 0 0 12px rgba(232, 178, 80, 0.4);
    }
  }
  .powerup-btn__icon {
    font-size: 1rem;
  }

  @media (max-width: 640px) {
    .powerup-bar__group-label {
      display: none;
    }
    .powerup-btn__label {
      display: none;
    }
    .powerup-btn {
      padding: 0.45rem 0.6rem;
    }
  }
</style>
