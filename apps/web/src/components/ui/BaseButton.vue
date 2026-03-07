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
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    position: relative;
    letter-spacing: 0.01em;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn--full {
    width: 100%;
  }

  /* Sizes */
  .btn--sm {
    padding: 0.45rem 1rem;
    font-size: 0.85rem;
    border-radius: 8px;
  }
  .btn--md {
    padding: 0.7rem 1.6rem;
    font-size: 0.95rem;
  }
  .btn--lg {
    padding: 0.9rem 2.2rem;
    font-size: 1.1rem;
    border-radius: 14px;
  }

  /* Variants */
  .btn--primary {
    background: var(--accent);
    color: var(--bg-primary);
    border-color: var(--accent);
  }
  .btn--primary:hover:not(:disabled) {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--accent-glow);
  }

  .btn--secondary {
    background: transparent;
    color: var(--text-primary);
    border-color: var(--border);
  }
  .btn--secondary:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .btn--ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: transparent;
  }
  .btn--ghost:hover:not(:disabled) {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  .btn--danger {
    background: var(--error);
    color: white;
    border-color: var(--error);
  }
  .btn--danger:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  /* Loading spinner */
  .btn--loading {
    color: transparent !important;
  }

  .btn__spinner {
    position: absolute;
    width: 1.1em;
    height: 1.1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .btn--loading .btn__spinner {
    color: var(--bg-primary);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
