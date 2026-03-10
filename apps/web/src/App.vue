<script setup lang="ts">
  import AppShell from '@/components/ui/AppShell.vue';
</script>

<template>
  <AppShell>
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <div :key="route.fullPath" class="page-shell">
          <component :is="Component" />
        </div>
      </Transition>
    </RouterView>
  </AppShell>
</template>

<style scoped>
  .page-shell {
    min-height: 100%;
  }
</style>
