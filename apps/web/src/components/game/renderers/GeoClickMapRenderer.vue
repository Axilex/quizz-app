<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import type { GeoClickMapQuestion } from '@/types';
  import worldMapImg from '@/assets/img/world-map.png';

  interface Props {
    question: GeoClickMapQuestion;
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), { disabled: false });
  const emit = defineEmits<{ submit: [answer: string] }>();

  const mapRef = ref<HTMLDivElement | null>(null);
  const pin = ref<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const confirmed = ref(false);

  /** Equirectangular projection: pixel → lat/lng */
  function pixelToLatLng(x: number, y: number, width: number, height: number) {
    const lng = (x / width) * 360 - 180;
    const lat = 90 - (y / height) * 180;
    return { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
  }

  function handleMapClick(e: MouseEvent) {
    if (props.disabled || confirmed.value) return;
    const el = mapRef.value;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { lat, lng } = pixelToLatLng(x, y, rect.width, rect.height);

    pin.value = { x, y, lat, lng };
  }

  function handleConfirm() {
    if (!pin.value || confirmed.value) return;
    confirmed.value = true;
    emit('submit', `${pin.value.lat},${pin.value.lng}`);
  }

  onMounted(() => {});
  onUnmounted(() => {});
</script>

<template>
  <div class="geo-click">
    <div class="geo-click__hint" v-if="question.geoHint">
      📍 Région : <strong>{{ question.geoHint }}</strong>
    </div>

    <div
      ref="mapRef"
      class="geo-click__map"
      :class="{ 'geo-click__map--disabled': disabled || confirmed }"
      @click="handleMapClick"
    >
      <!-- Equirectangular world map (public domain) -->
      <img :src="worldMapImg" alt="Carte du monde" class="geo-click__img" draggable="false" />

      <!-- Pin marker -->
      <div v-if="pin" class="geo-click__pin" :style="{ left: `${pin.x}px`, top: `${pin.y}px` }">
        📍
      </div>

      <!-- Overlay when disabled -->
      <div v-if="disabled || confirmed" class="geo-click__overlay" />
    </div>

    <div class="geo-click__controls">
      <span v-if="pin" class="geo-click__coords">
        {{ pin.lat.toFixed(1) }}°, {{ pin.lng.toFixed(1) }}°
      </span>
      <span v-else class="geo-click__prompt">Cliquez sur la carte pour placer un marqueur</span>

      <button
        v-if="pin && !confirmed"
        class="geo-click__confirm"
        :disabled="disabled"
        @click="handleConfirm"
      >
        ✓ Confirmer
      </button>
    </div>
  </div>
</template>

<style scoped>
  .geo-click {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    width: 100%;
  }

  .geo-click__hint {
    font-size: 0.85rem;
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.4rem 0.9rem;
  }

  .geo-click__hint strong {
    color: var(--accent);
  }

  .geo-click__map {
    position: relative;
    width: 100%;
    max-width: 520px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid var(--border);
    cursor: crosshair;
    aspect-ratio: 2 / 1;
    background: #0e1d35;
    transition: border-color 0.2s;
  }

  .geo-click__map:hover:not(.geo-click__map--disabled) {
    border-color: var(--accent);
  }

  .geo-click__map--disabled {
    cursor: default;
  }

  .geo-click__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    user-select: none;
  }

  .geo-click__pin {
    position: absolute;
    transform: translate(-50%, -100%);
    font-size: 1.6rem;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
    pointer-events: none;
    animation: pin-drop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes pin-drop {
    from {
      transform: translate(-50%, -200%) scale(0.5);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -100%) scale(1);
      opacity: 1;
    }
  }

  .geo-click__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  .geo-click__controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .geo-click__prompt {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .geo-click__coords {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .geo-click__confirm {
    padding: 0.55rem 1.4rem;
    background: var(--accent);
    color: var(--bg-primary);
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .geo-click__confirm:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--accent-glow);
  }

  .geo-click__confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
