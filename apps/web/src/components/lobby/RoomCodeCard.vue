<script setup lang="ts">
  import { ref, computed } from 'vue';

  interface Props {
    code: string;
  }

  const props = defineProps<Props>();

  const copied = ref(false);

  /** Build the full shareable join URL */
  const joinUrl = computed(() => {
    const base = window.location.origin;
    return `${base}/join/${props.code}`;
  });

  function copyUrl() {
    navigator.clipboard.writeText(joinUrl.value).then(() => {
      copied.value = true;
      setTimeout(() => (copied.value = false), 2500);
    });
  }

  /** Native share (mobile) if available, else fallback to copy */
  async function shareOrCopy() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins ma partie Quizzy !',
          url: joinUrl.value,
        });
        return;
      } catch {
        // User cancelled or share failed — fallback to copy
      }
    }
    copyUrl();
  }
</script>

<template>
  <div class="room-code-card" @click="shareOrCopy">
    <span class="room-code-card__label">Invite tes amis</span>
    <span class="room-code-card__code">{{ code }}</span>
    <span class="room-code-card__url">{{ joinUrl }}</span>
    <span class="room-code-card__copy">
      {{ copied ? '✓ Lien copié !' : 'Cliquer pour copier le lien' }}
    </span>
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

  .room-code-card__url {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    word-break: break-all;
    text-align: center;
    max-width: 100%;
    line-height: 1.5;
  }

  .room-code-card__copy {
    font-size: 0.78rem;
    color: var(--text-muted);
    transition: color 0.2s;
  }

  .room-code-card:hover .room-code-card__copy {
    color: var(--accent);
  }
</style>
