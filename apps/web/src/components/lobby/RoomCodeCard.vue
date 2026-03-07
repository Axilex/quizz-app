<script setup lang="ts">
  import { ref } from 'vue';

  interface Props {
    code: string;
  }

  defineProps<Props>();

  const copied = ref(false);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      copied.value = true;
      setTimeout(() => (copied.value = false), 2000);
    });
  }
</script>

<template>
  <div class="room-code-card" @click="copyCode(code)">
    <span class="room-code-card__label">Code de la room</span>
    <span class="room-code-card__code">{{ code }}</span>
    <span class="room-code-card__copy">{{ copied ? 'Copié !' : 'Cliquer pour copier' }}</span>
  </div>
</template>

<style scoped>
  .room-code-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 2rem;
    background: var(--bg-secondary);
    border: 2px dashed var(--border);
    border-radius: 14px;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .room-code-card:hover {
    border-color: var(--accent);
  }

  .room-code-card__label {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .room-code-card__code {
    font-family: var(--font-mono);
    font-size: 2.5rem;
    font-weight: 900;
    letter-spacing: 0.25em;
    color: var(--accent);
  }

  .room-code-card__copy {
    font-size: 0.78rem;
    color: var(--text-muted);
  }
</style>
