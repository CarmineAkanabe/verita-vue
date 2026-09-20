<!-- components/complex/cases/EvidenceUploader.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UploadCloudIcon,
  FileTextIcon,
  ImageIcon,
  Trash2Icon,
  ShieldCheckIcon,
  PlusCircleIcon,
  AlertCircleIcon,
} from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: File[]
    maxFileSizeMb?: number
    error?: string
    disabled?: boolean
  }>(),
  {
    modelValue: () => [],
    maxFileSizeMb: 10,
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', files: File[]): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const validationError = ref<string | null>(null)

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
]
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function validateAndAddFiles(incoming: FileList | File[]) {
  validationError.value = null
  const currentFiles = [...props.modelValue]
  const newFiles: File[] = []
  const maxBytes = props.maxFileSizeMb * 1024 * 1024

  for (let i = 0; i < incoming.length; i++) {
    const file = incoming[i]

    // Check extension / MIME
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension)

    if (!isValidType) {
      validationError.value = `File "${file.name}" has an unsupported format. Only JPG, PNG, and PDF files are accepted.`
      return
    }

    // Check file size
    if (file.size > maxBytes) {
      validationError.value = `File "${file.name}" exceeds the maximum allowed size of ${props.maxFileSizeMb} MB.`
      return
    }

    // Check duplicate
    const isDuplicate = currentFiles.some(
      (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
    )
    if (!isDuplicate && !newFiles.some((f) => f.name === file.name && f.size === file.size)) {
      newFiles.push(file)
    }
  }

  if (newFiles.length > 0) {
    emit('update:modelValue', [...currentFiles, ...newFiles])
  }
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    validateAndAddFiles(target.files)
  }
  // Reset input value so re-selecting the same file triggers change
  target.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (props.disabled) return
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    validateAndAddFiles(e.dataTransfer.files)
  }
}

function removeFile(index: number) {
  if (props.disabled) return
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

function triggerBrowse() {
  if (!props.disabled) {
    fileInputRef.value?.click()
  }
}

const totalDossierSize = computed(() => {
  const totalBytes = props.modelValue.reduce((acc, f) => acc + f.size, 0)
  return formatFileSize(totalBytes)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Hidden Native File Input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
      class="sr-only"
      :disabled="disabled"
      @change="onFileSelect"
    />

    <!-- Interactive Dropzone -->
    <div
      class="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all cursor-pointer select-none"
      :class="[
        disabled ? 'opacity-50 cursor-not-allowed bg-muted/20 border-border' : '',
        isDragging
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/60 bg-muted/10 hover:bg-muted/20',
        error || validationError ? 'border-destructive/60' : '',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerBrowse"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="triggerBrowse"
      @keydown.space.prevent="triggerBrowse"
      aria-label="Upload supporting evidence documents"
    >
      <div
        class="w-12 h-12 mx-auto mb-3 rounded-full bg-card flex items-center justify-center text-muted-foreground border border-border transition-colors group-hover:text-primary"
      >
        <UploadCloudIcon class="size-6 text-primary" />
      </div>

      <p class="text-sm font-semibold text-foreground">
        Click to upload or drag and drop supporting documents
      </p>
      <p class="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
        Accepts PDF, PNG, and JPG files (Max {{ maxFileSizeMb }} MB per file). Attached evidence will be securely reviewed by authorized management.
      </p>

      <button
        type="button"
        class="mt-4 px-4 py-2 bg-card border border-border hover:border-foreground text-xs font-semibold text-foreground rounded-md transition-colors inline-flex items-center gap-2 shadow-xs"
        :disabled="disabled"
        @click.stop="triggerBrowse"
      >
        <PlusCircleIcon class="size-4 text-primary" />
        <span>Select evidence files</span>
      </button>
    </div>

    <!-- Validation Error Alert -->
    <div
      v-if="validationError"
      class="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2"
    >
      <AlertCircleIcon class="size-4 shrink-0" />
      <span>{{ validationError }}</span>
    </div>

    <!-- External Error -->
    <p v-else-if="error" class="text-[11px] font-medium text-destructive flex items-center gap-1">
      <AlertCircleIcon class="size-3.5" />
      <span>{{ error }}</span>
    </p>

    <!-- Attached Files Ledger -->
    <div v-if="modelValue.length > 0" class="space-y-2.5 pt-2">
      <div class="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
        <span>Attached Evidence Dossier ({{ modelValue.length }} {{ modelValue.length === 1 ? 'file' : 'files' }})</span>
        <span class="font-mono text-[11px] text-foreground font-medium">Total: {{ totalDossierSize }}</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="(file, idx) in modelValue"
          :key="`${file.name}-${file.size}-${idx}`"
          class="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-xs transition-all hover:border-muted-foreground/30"
        >
          <div class="flex items-center gap-3 min-w-0 pr-2">
            <div class="w-9 h-9 rounded-md bg-muted/60 flex items-center justify-center text-foreground shrink-0">
              <FileTextIcon v-if="isPdf(file)" class="size-4 text-primary" />
              <ImageIcon v-else class="size-4 text-info" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-mono font-medium text-foreground truncate max-w-xs sm:max-w-md">
                {{ file.name }}
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[11px] font-mono text-muted-foreground">{{ formatFileSize(file.size) }}</span>
                <span class="text-muted-foreground/40">•</span>
                <span class="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  <ShieldCheckIcon class="size-3" />
                  <span>Document Ready</span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10 transition-colors shrink-0"
            title="Remove attachment"
            :disabled="disabled"
            @click="removeFile(idx)"
          >
            <Trash2Icon class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
