<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useLobbyStore, useSessionStore } from '@/stores';
  import { multiplayerGateway } from '@/services';
  import type { ConnectionState } from '@/services/multiplayer/SocketIOMultiplayerGateway';
  import BaseButton from '@/components/ui/BaseButton.vue';
  import LobbyPlayersList from '@/components/lobby/LobbyPlayersList.vue';
  import RoomCodeCard from '@/components/lobby/RoomCodeCard.vue';
  import GameSettingsPanel from '@/components/lobby/GameSettingsPanel.vue';

  const router = useRouter();
  const route = useRoute();
  const lobby = useLobbyStore();
  const session = useSessionStore();

  const playerName = ref('Joueur');
  const joinCode = ref('');
  const view = ref<'choice' | 'join' | 'room'>('choice');
  const debugMode = ref(false);
  const connectionState = ref<ConnectionState>(multiplayerGateway.connectionState);

  const unsubState = multiplayerGateway.onStateChange((state) => {
    connectionState.value = state;
  });

  const isReconnecting = computed(() => connectionState.value === 'reconnecting');

  onUnmounted(() => {
    unsubState();
  });

  onMounted(() => {
    const codeFromUrl = route.params.code as string | undefined;
    if (codeFromUrl) {
      joinCode.value = codeFromUrl.toUpperCase();
      view.value = 'join';
    }
  });

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
      mode: 'multi',
      questionCount: session.questionCount,
      difficulties: ['easy', 'medium', 'hard'],
      categories: session.selectedCategories.length ? session.selectedCategories : undefined,
      debug: debugMode.value || undefined,
    });
    setTimeout(() => lobby.startGame(), 200);
  }

  function handleLeave() {
    lobby.leaveRoom();
    view.value = 'choice';
  }
  function handleBack() {
    lobby.leaveRoom();
    unsubState();
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
      </div>

      <!-- Reconnecting -->
      <div v-if="isReconnecting" class="lobby-reconnecting">
        <div class="lobby-reconnecting__spinner" />
        <span>Reconnexion en cours…</span>
      </div>

      <!-- Choice -->
      <div v-if="view === 'choice'" class="lobby-flow">
        <div class="name-field">
          <label class="name-field__label">Votre pseudo</label>
          <input
            v-model="playerName"
            class="name-field__input"
            placeholder="Pseudo…"
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

      <!-- Join -->
      <div v-else-if="view === 'join'" class="lobby-flow">
        <BaseButton variant="ghost" size="sm" @click="view = 'choice'">← Retour</BaseButton>

        <div v-if="route.params.code" class="join-invite">
          <span class="join-invite__label">Tu as été invité à rejoindre</span>
          <span class="join-invite__code">{{ joinCode }}</span>
        </div>

        <div class="name-field">
          <label class="name-field__label">Choisis ton pseudo</label>
          <input
            v-model="playerName"
            class="name-field__input"
            placeholder="Pseudo…"
            autofocus
            @keydown.enter="handleJoin"
          />
        </div>

        <div v-if="!route.params.code" class="name-field">
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
          Rejoindre la partie
        </BaseButton>
      </div>

      <!-- Room -->
      <div v-else-if="view === 'room' && lobby.room" class="lobby-flow">
        <RoomCodeCard :code="lobby.roomCode" />

        <div class="lobby-room-info">
          <span class="lobby-room-info__count"
            >{{ lobby.playerCount }} joueur{{ lobby.playerCount > 1 ? 's' : '' }}</span
          >
        </div>

        <LobbyPlayersList :players="lobby.players" />

        <div v-if="lobby.isHost" class="lobby-host-panel">
          <h3 class="lobby-host-panel__title">Configuration de la partie</h3>
          <GameSettingsPanel @start="handleConfigAndStart" />

          <label class="lobby-debug-toggle">
            <input v-model="debugMode" type="checkbox" />
            Mode debug (1 question par type)
          </label>
        </div>

        <div v-else class="lobby-waiting">
          <div class="lobby-waiting__spinner" />
          <p class="lobby-waiting__text">En attente du lancement par l'hôte…</p>
        </div>

        <BaseButton variant="ghost" size="sm" @click="handleLeave">Quitter la room</BaseButton>
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
    padding: var(--space-lg) 0;
  }
  .lobby-page__container {
    max-width: 480px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
  .lobby-page__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .lobby-page__title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 800;
    color: var(--text-primary);
    margin: var(--space-xs) 0 0;
  }
  .lobby-flow {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .lobby-reconnecting {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.7rem var(--space-md);
    background: rgba(232, 178, 80, 0.08);
    border: 1px solid rgba(232, 178, 80, 0.2);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--warning);
  }
  .lobby-reconnecting__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(232, 178, 80, 0.3);
    border-top-color: var(--warning);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .join-invite {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-lg);
    background: var(--accent-soft);
    border: 1px solid rgba(232, 178, 80, 0.18);
    border-radius: var(--radius-lg);
  }
  .join-invite__label {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-weight: 500;
  }
  .join-invite__code {
    font-family: var(--font-mono);
    font-size: var(--text-xl);
    font-weight: 900;
    letter-spacing: 0.25em;
    color: var(--accent);
  }

  .name-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .name-field__label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .name-field__input {
    padding: var(--space-md) var(--space-md);
    background: var(--bg-secondary);
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: var(--text-base);
    outline: none;
    transition: border-color 0.2s;
    min-height: 52px;
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
    font-size: var(--text-lg);
  }

  .lobby-divider {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .lobby-divider__line {
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  .lobby-divider__text {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }

  .lobby-room-info {
    display: flex;
    justify-content: center;
  }
  .lobby-room-info__count {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-weight: 500;
  }

  .lobby-host-panel {
    border-top: 1px solid var(--border);
    padding-top: var(--space-md);
  }
  .lobby-host-panel__title {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--space-sm);
  }

  .lobby-waiting {
    text-align: center;
    padding: var(--space-xl) 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }
  .lobby-waiting__spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .lobby-waiting__text {
    color: var(--text-muted);
    font-size: var(--text-sm);
    margin: 0;
  }
  .lobby-debug-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--text-sm);
    color: var(--text-muted);
    cursor: pointer;
    margin-top: var(--space-xs);
  }

  .lobby-error {
    color: var(--error);
    font-size: var(--text-sm);
    text-align: center;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
