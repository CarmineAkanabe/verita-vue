<!-- components/complex/cases/EvidencePreviewModal.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { getEvidenceBlob, downloadEvidenceFile } from '@/features/cases/api'
import { toast } from '@/plugins/toast'
import {
  XIcon,
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  AlertCircleIcon,
} from '@lucide/vue'

const props = defineProps<{
  isOpen: boolean
  evidenceId: string
  fileName?: string
  fileType?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const resolvedMimeType = ref<string>('')

function cleanupUrl() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

async function loadEvidence() {
  if (!props.evidenceId) return

  cleanupUrl()
  isLoading.value = true
  errorMessage.value = null

  try {
    const { blob, contentType } = await getEvidenceBlob(props.evidenceId)
    resolvedMimeType.value = contentType || blob.type || (props.fileType === 'IMAGE' ? 'image/png' : 'application/pdf')
    previewUrl.value = URL.createObjectURL(blob)
  } catch (err: any) {
    errorMessage.value = err?.message || 'Could not retrieve evidence file.'
    toast.error('Failed to load file preview.')
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.isOpen, props.evidenceId],
  ([open, id]) => {
    if (open && id) {
      loadEvidence()
    } else {
      cleanupUrl()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  cleanupUrl()
})

async function handleDownload() {
  try {
    await downloadEvidenceFile(props.evidenceId, props.fileName || `verita-evidence-${props.evidenceId.slice(0, 8)}`)
    toast.success('File download started.')
  } catch {
    toast.error('Failed to download evidence file.')
  }
}

const isImage = () => {
  return (
    props.fileType === 'IMAGE' ||
    resolvedMimeType.value.startsWith('image/') ||
    (props.fileName && /\.(jpg|jpeg|png|webp|gif)$/i.test(props.fileName))
  )
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#22293A]/60 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="preview-modal-title"
  >
    <div
      class="w-full max-w-4xl bg-white border border-[#E2E5EE] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-[#E2E5EE] flex items-center justify-between gap-4 bg-[#F8F9FA] shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="h-8 w-8 rounded bg-white border border-[#E2E5EE] flex items-center justify-center text-[#A2561B] shrink-0">
            <ImageIcon v-if="isImage()" class="size-4" />
            <FileTextIcon v-else class="size-4" />
          </div>
          <div class="min-w-0">
            <h3 id="preview-modal-title" class="text-sm font-bold text-[#22293A] truncate">
              {{ fileName || 'Evidence Document' }}
            </h3>
            <p class="text-[11px] text-[#6B7280] truncate font-mono">
              ID: {{ evidenceId }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#E2E5EE] bg-white hover:bg-[#F2F4F7] text-[#22293A] transition-colors cursor-pointer"
            @click="handleDownload"
          >
            <DownloadIcon class="size-3.5" />
            <span>Download</span>
          </button>

          <button
            type="button"
            class="p-1.5 text-[#6B7280] hover:text-[#22293A] rounded-md hover:bg-[#E2E5EE]/50 transition-colors cursor-pointer"
            @click="emit('close')"
            aria-label="Close preview"
          >
            <XIcon class="size-5" />
          </button>
        </div>
      </div>

      <!-- Preview Body -->
      <div class="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-[#F2F4F7]">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 gap-3 text-[#6B7280]">
          <Loader2Icon class="size-8 animate-spin text-[#A2561B]" />
          <p class="text-xs font-medium">Decrypting and loading evidence stream...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="text-center py-12 px-4 max-w-md">
          <div class="h-12 w-12 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#991B1B] mx-auto mb-3">
            <AlertCircleIcon class="size-6" />
          </div>
          <p class="text-sm font-semibold text-[#22293A]">Preview Unavailable</p>
          <p class="text-xs text-[#6B7280] mt-1">{{ errorMessage }}</p>
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#A2561B] text-white text-xs font-medium cursor-pointer"
            @click="handleDownload"
          >
            <DownloadIcon class="size-3.5" />
            Download to View Directly
          </button>
        </div>

        <!-- Content: Image -->
        <div v-else-if="isImage() && previewUrl" class="w-full flex items-center justify-center">
          <img
            :src="previewUrl"
            :alt="fileName || 'Evidence preview'"
            class="max-h-[68vh] max-w-full object-contain rounded border border-[#E2E5EE] shadow-xs bg-white"
          />
        </div>

        <!-- Content: PDF / Other Document -->
        <div v-else-if="previewUrl" class="w-full h-full min-h-[550px] flex flex-col">
          <iframe
            :src="previewUrl"
            class="w-full h-full min-h-[550px] rounded border border-[#E2E5EE] bg-white shadow-xs"
            title="Evidence document preview"
          ></iframe>
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="px-5 py-2.5 border-t border-[#E2E5EE] bg-white flex items-center justify-between text-[11px] text-[#6B7280] shrink-0">
        <span>Confidential Case File</span>
        <button
          type="button"
          class="text-[#22293A] font-medium hover:underline cursor-pointer"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
