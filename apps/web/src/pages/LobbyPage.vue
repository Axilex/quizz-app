<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useLobbyStore, useSessionStore } from '@/stores';
  import BaseButton from '@/components/ui/BaseButton.vue';
  import LobbyPlayersList from '@/components/lobby/LobbyPlayersList.vue';
  import RoomCodeCard from '@/components/lobby/RoomCodeCard.vue';
  import GameSettingsPanel from '@/components/lobby/GameSettingsPanel.vue';

  const router = useRouter();
  const lobby = useLobbyStore();
  const session = useSessionStore();

  const playerName = ref('Joueur');
  const joinCode = ref('');
  const view = ref<'choice' | 'join' | 'room'>('choice');

  async function handleCreate() {
    if (!playerName.value.trim()) return;
    await lobby.createRoom(playerName.value.trim());
    if (lobby.room) view.value = 'room';
  }

  async function handleJoin() {
    if (!joinCode.value.trim() || !playerName.value.trim()) return;
    await lobby.joinRoom(joinCode.value.trim(), playerName.value.trim());
    if (lobby.room) view.value = 'room';
  }

  function handleConfigAndStart() {
    lobby.configureGame({
      questionCount: session.questionCount,
      difficulties: session.selectedDifficulties,
      categories: session.selectedCategories.length ? session.selectedCategories : undefined,
    });
    setTimeout(() => lobby.startGame(), 200);
  }

  function handleLeave() {
    lobby.leaveRoom();
    view.value = 'choice';
  }

  function handleBack() {
    lobby.leaveRoom();
    router.push('/');
  }

  watch(
    () => lobby.isGameStarted,
    (started) => {
      if (started) router.push('/play-multi');
    },
  );
</script>

<template>
  <div class="lobby-page">
    <div class="lobby-page__container">
      <div class="lobby-page__header">
        <BaseButton variant="ghost" size="sm" @click="handleBack">← Accueil</BaseButton>
        <h1 class="lobby-page__title">Multijoueur</h1>
        <p v-if="lobby.isMockMode" class="lobby-page__mock-badge">
          Mode démo — lancez le backend pour le vrai multi
        </p>
      </div>

      <!-- Step 1: Choose name + create or join -->
      <div v-if="view === 'choice'" class="lobby-flow">
        <div class="name-field">
          <label class="name-field__label">Votre pseudo</label>
          <input
            v-model="playerName"
            class="name-field__input"
            placeholder="Pseudo..."
            @keydown.enter="handleCreate"
          />
        </div>

        <BaseButton
          size="lg"
          full-width
          :loading="lobby.isConnecting"
          :disabled="!playerName.trim()"
          @click="handleCreate"
        >
          Créer une room
        </BaseButton>

        <div class="lobby-divider">
          <span class="lobby-divider__line" />
          <span class="lobby-divider__text">ou</span>
          <span class="lobby-divider__line" />
        </div>

        <BaseButton variant="secondary" size="lg" full-width @click="view = 'join'">
          Rejoindre une room
        </BaseButton>
      </div>

      <!-- Step 1b: Join with code -->
      <div v-else-if="view === 'join'" class="lobby-flow">
        <BaseButton variant="ghost" size="sm" @click="view = 'choice'">← Retour</BaseButton>

        <div class="name-field">
          <label class="name-field__label">Votre pseudo</label>
          <input v-model="playerName" class="name-field__input" placeholder="Pseudo..." />
        </div>

        <div class="name-field">
          <label class="name-field__label">Code de la room</label>
          <input
            v-model="joinCode"
            class="name-field__input code-input"
            placeholder="ABC123"
            maxlength="6"
            @keydown.enter="handleJoin"
          />
        </div>

        <BaseButton
          size="lg"
          full-width
          :loading="lobby.isConnecting"
          :disabled="!joinCode.trim() || !playerName.trim()"
          @click="handleJoin"
        >
          Rejoindre
        </BaseButton>
      </div>

      <!-- Step 2: In the room -->
      <div v-else-if="view === 'room' && lobby.room" class="lobby-flow">
        <RoomCodeCard :code="lobby.roomCode" />

        <div class="lobby-room-info">
          <span class="lobby-room-info__count"
            >{{ lobby.playerCount }} joueur{{ lobby.playerCount > 1 ? 's' : '' }}</span
          >
        </div>

        <LobbyPlayersList :players="lobby.players" />

        <!-- Host sees game config + start -->
        <div v-if="lobby.isHost" class="lobby-host-panel">
          <h3 class="lobby-host-panel__title">Configuration de la partie</h3>
          <GameSettingsPanel @start="handleConfigAndStart" />
        </div>

        <!-- Non-host waits -->
        <div v-else class="lobby-waiting">
          <div class="lobby-waiting__spinner" />
          <p class="lobby-waiting__text">En attente du lancement par l'hôte...</p>
        </div>

        <BaseButton variant="ghost" size="sm" @click="handleLeave"> Quitter la room </BaseButton>
      </div>

      <p v-if="lobby.error" class="lobby-error">{{ lobby.error }}</p>
    </div>
  </div>
</template>

<style scoped>
  .lobby-page {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 1rem 0;
  }
  .lobby-page__container {
    max-width: 460px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .lobby-page__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .lobby-page__title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0.5rem 0 0;
  }
  .lobby-page__mock-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--warning);
    background: color-mix(in srgb, var(--warning) 12%, transparent);
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    margin: 0.25rem 0 0;
    width: fit-content;
  }
  .lobby-flow {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .name-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .name-field__label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .name-field__input {
    padding: 0.8rem 1rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 10px;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .name-field__input:focus {
    border-color: var(--accent);
  }
  .code-input {
    text-transform: uppercase;
    text-align: center;
    letter-spacing: 0.25em;
    font-weight: 700;
    font-family: var(--font-mono);
    font-size: 1.3rem;
  }

  /* Divider */
  .lobby-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .lobby-divider__line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  .lobby-divider__text {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }

  /* Room info */
  .lobby-room-info {
    display: flex;
    justify-content: center;
  }
  .lobby-room-info__count {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* Host panel */
  .lobby-host-panel {
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }
  .lobby-host-panel__title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.75rem;
  }

  /* Waiting */
  .lobby-waiting {
    text-align: center;
    padding: 2rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .lobby-waiting__spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .lobby-waiting__text {
    color: var(--text-muted);
    font-size: 0.95rem;
    margin: 0;
  }

  .lobby-error {
    color: var(--error);
    font-size: 0.9rem;
    text-align: center;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
