
<script setup lang="ts">
import HeaderShell from '@/shells/HeaderShell.vue'
import FooterShell from '@/shells/FooterShell.vue'
import RouteTransition from '@/components/common/RouteTransition.vue'
</script>
<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <HeaderShell />
    <main class="flex-1"><RouteTransition /></main>
    <FooterShell />
  </div>
</template>