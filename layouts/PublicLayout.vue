
<script setup lang="ts">
import HeaderShell from '@/shells/HeaderShell.vue'
import FooterShell from '@/shells/FooterShell.vue'
</script>
<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <HeaderShell />
    <main class="flex-1"><router-view /></main>
    <FooterShell />
  </div>
</template>