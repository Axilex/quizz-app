<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import { useSessionStore } from '@/stores';
  import { questionRepository } from '@/services';
  import type { CategoryInfo } from '@/services/questions/QuestionRepository';
  import BaseButton from '@/components/ui/BaseButton.vue';

  const emit = defineEmits<{ start: [] }>();
  const session = useSessionStore();

  const countOptions = [20, 30, 40, 50];
  const categories = ref<CategoryInfo[]>([]);
  const isLoadingCategories = ref(true);
  const loadError = ref<string | null>(null);

  onMounted(async () => {
    try {
      categories.value = await questionRepository.fetchCategories();
    } catch (err) {
      console.log(String(err));
      loadError.value = 'Impossible de charger les thèmes. Vérifiez que le backend est lancé.';
    }
    isLoadingCategories.value = false;
  });

  const availableCount = computed(() => {
    if (session.selectedCategories.length === 0) {
      return categories.value.reduce((sum, c) => sum + c.count, 0);
    }
    return categories.value
      .filter((c) => session.selectedCategories.includes(c.id))
      .reduce((sum, c) => sum + c.count, 0);
  });

  function isCategoryActive(catId: string): boolean {
    return session.selectedCategories.length === 0 || session.selectedCategories.includes(catId);
  }
</script>

<template>
  <div class="settings-panel">
    <!-- Error banner -->
    <div v-if="loadError" class="settings-panel__error">
      <p>{{ loadError }}</p>
    </div>

    <!-- Categories -->
    <section class="settings-section">
      <h3 class="settings-section__title">Thèmes</h3>
      <p class="settings-section__hint">
        {{
          session.selectedCategories.length === 0
            ? 'Tous les thèmes sélectionnés'
            : `${session.selectedCategories.length} thème(s)`
        }}
        <template v-if="!isLoadingCategories && !loadError">
          — {{ availableCount }} questions disponibles
        </template>
      </p>
      <div v-if="isLoadingCategories" class="settings-section__loading">Chargement des thèmes…</div>
      <div v-else-if="!loadError" class="category-grid">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-chip"
          :class="{
            'category-chip--active': isCategoryActive(cat.id),
            'category-chip--filtered':
              session.selectedCategories.length > 0 && !session.selectedCategories.includes(cat.id),
          }"
          @click="session.toggleCategory(cat.id)"
        >
          <span class="category-chip__icon">{{ cat.icon }}</span>
          <span class="category-chip__label">{{ cat.label }}</span>
          <span class="category-chip__count">{{ cat.count }}</span>
        </button>
      </div>
    </section>

    <!-- Question count -->
    <section class="settings-section">
      <h3 class="settings-section__title">Nombre de questions</h3>
      <div class="count-grid">
        <button
          v-for="count in countOptions"
          :key="count"
          class="count-btn"
          :class="{
            'count-btn--active': session.questionCount === count,
            'count-btn--disabled': availableCount > 0 && count > availableCount,
          }"
          :disabled="availableCount > 0 && count > availableCount"
          @click="session.setQuestionCount(count)"
        >
          {{ count }}
        </button>
      </div>
    </section>

    <BaseButton
      size="lg"
      full-width
      :disabled="!session.isValid || !!loadError"
      @click="emit('start')"
    >
      Lancer la partie
    </BaseButton>
  </div>
</template>

<style scoped>
  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }
  .settings-panel__error {
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--error) 10%, var(--bg-secondary));
    border: 1px solid var(--error);
    border-radius: 10px;
    color: var(--error);
    font-size: 0.88rem;
    text-align: center;
  }
  .settings-panel__error p {
    margin: 0;
  }
  .settings-section__title {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 0.35rem;
  }
  .settings-section__hint {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: 0 0 0.6rem;
  }
  .settings-section__loading {
    font-size: 0.85rem;
    color: var(--text-muted);
    padding: 0.5rem 0;
  }
  .category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .category-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.75rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--text-primary);
  }
  .category-chip:hover {
    border-color: var(--accent);
  }
  .category-chip--active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
  }
  .category-chip--filtered {
    opacity: 0.4;
    border-color: var(--border);
  }
  .category-chip__icon {
    font-size: 1rem;
  }
  .category-chip__label {
    font-weight: 600;
  }
  .category-chip__count {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }
  .count-grid {
    display: flex;
    gap: 0.5rem;
  }
  .count-btn {
    flex: 1;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 10px;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .count-btn:hover:not(:disabled) {
    border-color: var(--accent);
  }
  .count-btn--active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
    color: var(--accent);
  }
  .count-btn--disabled,
  .count-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
