<!-- components/complex/manager/ConfirmDeleteModal.vue -->
<script setup lang="ts">
import { AlertTriangleIcon, XIcon, Trash2Icon } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'

defineProps<{
  isOpen: boolean
  title: string
  message: string
  itemName?: string
  confirmLabel?: string
  isDeleting?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-modal-title"
  >
    <div
      class="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 card-creamy"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-border flex items-start justify-between gap-4 bg-destructive/10">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-destructive/20 border border-destructive/30 flex items-center justify-center text-destructive shrink-0">
            <AlertTriangleIcon class="size-5" />
          </div>
          <div>
            <h3 id="delete-modal-title" class="text-base font-bold text-foreground">
              {{ title }}
            </h3>
            <p class="text-xs text-muted-foreground">
              Irreversible governance action
            </p>
          </div>
        </div>

        <button
          type="button"
          class="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
          :disabled="isDeleting"
          @click="emit('close')"
          aria-label="Close modal"
        >
          <XIcon class="size-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-3 text-xs sm:text-sm text-foreground">
        <p class="leading-relaxed">
          {{ message }}
        </p>
        <div v-if="itemName" class="p-2.5 rounded-md bg-muted/40 border border-border font-mono text-xs font-semibold text-foreground">
          {{ itemName }}
        </div>
        <p class="text-[11px] text-muted-foreground">
          This operation cannot be undone. Associated records will be permanently decoupled.
        </p>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-2.5">
        <AppButton
          variant="outline"
          size="sm"
          type="button"
          :disabled="isDeleting"
          @click="emit('close')"
        >
          Cancel
        </AppButton>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="isDeleting"
          @click="emit('confirm')"
        >
          <Trash2Icon v-if="!isDeleting" class="size-3.5" />
          <span v-if="isDeleting">Deleting...</span>
          <span v-else>{{ confirmLabel || 'Confirm Deletion' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
