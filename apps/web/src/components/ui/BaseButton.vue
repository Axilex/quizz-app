<script setup lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    fullWidth: false,
  });
</script>

<template>
  <button
    class="btn"
    :class="[
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--full': fullWidth, 'btn--loading': loading },
    ]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="btn__spinner" />
    <slot />
  </button>
</template>

<style scoped>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    font-family: var(--font-body);
    font-weight: 600;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all 0.22s var(--ease-out-expo);
    white-space: nowrap;
    position: relative;
    letter-spacing: 0.02em;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  .btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  .btn--full {
    width: 100%;
  }

  /* Sizes — generous touch targets */
  .btn--sm {
    padding: 0.55rem 1.1rem;
    font-size: var(--text-sm);
    border-radius: var(--radius-sm);
    min-height: 38px;
  }
  .btn--md {
    padding: 0.75rem 1.8rem;
    font-size: var(--text-base);
    border-radius: var(--radius-md);
    min-height: 48px;
  }
  .btn--lg {
    padding: 1rem 2.4rem;
    font-size: clamp(1rem, 0.9rem + 0.3vw, 1.12rem);
    border-radius: var(--radius-lg);
    min-height: 56px;
  }

  /* Primary — golden with glow */
  .btn--primary {
    background: linear-gradient(135deg, var(--accent), #d4a03a);
    color: var(--bg-base);
    border-color: transparent;
    box-shadow: 0 2px 12px rgba(232, 178, 80, 0.15);
  }
  .btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #f0c060, var(--accent));
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(232, 178, 80, 0.3);
  }
  .btn--primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(232, 178, 80, 0.2);
  }

  /* Secondary — glass */
  .btn--secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--border-strong);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .btn--secondary:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }

  /* Ghost */
  .btn--ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: transparent;
  }
  .btn--ghost:hover:not(:disabled) {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.04);
  }

  /* Danger */
  .btn--danger {
    background: var(--error);
    color: white;
    border-color: transparent;
  }
  .btn--danger:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 107, 107, 0.25);
  }

  /* Loading */
  .btn--loading {
    color: transparent !important;
  }
  .btn__spinner {
    position: absolute;
    width: 1.2em;
    height: 1.2em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  .btn--loading .btn__spinner {
    color: var(--bg-base);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Touch devices: no hover transform */
  @media (hover: none) {
    .btn:hover:not(:disabled) {
      transform: none;
    }
    .btn:active:not(:disabled) {
      transform: scale(0.97);
    }
  }
</style>
