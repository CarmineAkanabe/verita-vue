<!-- components/common/RouteTransition.vue -->
<script setup lang="ts">
/**
 * Page transition for the INNER router-view of a layout.
 * Keeping it inside each layout means persistent regions (header, sidebar,
 * footer) stay mounted while only the page content animates.
 */
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>
