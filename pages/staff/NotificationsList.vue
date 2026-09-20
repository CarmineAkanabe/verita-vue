<!-- pages/staff/NotificationsList.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getNotifications, markNotificationRead } from '@/features/account/api'
import type { NotificationItem, NotificationType } from '@/features/account/types'
import { toast } from '@/plugins/toast'
import AppButton from '@/components/common/AppButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  CheckCheckIcon,
  RefreshCwIcon,
  MessageSquareIcon,
  FileCheckIcon,
  AlertTriangleIcon,
  UserCheckIcon,
  FileTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@lucide/vue'

type FilterTab = 'ALL' | 'UNREAD' | 'READ'

const activeTab = ref<FilterTab>('ALL')
const isLoading = ref(true)
const isMarkingId = ref<string | null>(null)
const error = ref<string | null>(null)

const notifications = ref<NotificationItem[]>([])
const currentPage = ref(1)
const lastPage = ref(1)
const totalCount = ref(0)

const filteredNotifications = computed(() => {
  if (activeTab.value === 'UNREAD') {
    return notifications.value.filter((n) => n.status === 'UNREAD')
  }
  if (activeTab.value === 'READ') {
    return notifications.value.filter((n) => n.status === 'READ')
  }
  return notifications.value
})

const unreadCount = computed(() => {
  return notifications.value.filter((n) => n.status === 'UNREAD').length
})

async function fetchNotifications(page = 1) {
  isLoading.value = true
  error.value = null

  try {
    const res = await getNotifications(page)
    notifications.value = res.data || []
    const meta = res.meta as any
    currentPage.value = meta?.current_page || meta?.currentPage || page
    lastPage.value = meta?.last_page || meta?.lastPage || 1
    totalCount.value = meta?.total !== undefined ? meta.total : notifications.value.length
  } catch (err: any) {
    error.value = err?.message || 'Failed to retrieve system notifications. Please verify connectivity.'
  } finally {
    isLoading.value = false
  }
}

async function handleMarkAsRead(item: NotificationItem) {
  if (item.status === 'READ') return
  isMarkingId.value = item.id

  try {
    await markNotificationRead(item.id)
    item.status = 'READ'
    toast.success('Notification marked as read.')
  } catch (err: any) {
    toast.error('Failed to mark notification as read.')
  } finally {
    isMarkingId.value = null
  }
}

async function handleMarkAllOnPageRead() {
  const unreadItems = notifications.value.filter((n) => n.status === 'UNREAD')
  if (unreadItems.length === 0) return

  for (const item of unreadItems) {
    try {
      await markNotificationRead(item.id)
      item.status = 'READ'
    } catch {
      // Continue batch processing
    }
  }
  toast.success('All visible notifications marked as read.')
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'new_message':
      return MessageSquareIcon
    case 'case_escalated':
      return AlertTriangleIcon
    case 'case_resolved':
      return FileCheckIcon
    case 'case_assigned':
      return UserCheckIcon
    case 'case_ready_for_review':
    default:
      return FileTextIcon
  }
}

function formatDate(iso: string) {
  if (!iso) return 'Just now'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

onMounted(() => {
  fetchNotifications(1)
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            Operational Telemetry
          </span>
          <span v-if="unreadCount > 0" class="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
            <span class="size-2 rounded-full bg-primary animate-pulse"></span>
            {{ unreadCount }} Unread
          </span>
        </div>
        <h1 class="text-2xl font-bold text-foreground mt-1 tracking-tight">
          System &amp; Docket Notifications
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          Real-time incident updates, investigator assignments, and confidential whistleblower alerts.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <AppButton
          v-if="unreadCount > 0"
          variant="outline"
          size="sm"
          :disabled="isLoading"
          @click="handleMarkAllOnPageRead"
        >
          <CheckCheckIcon class="size-3.5 mr-1.5" />
          Mark all as read
        </AppButton>

        <AppButton
          variant="outline"
          size="sm"
          :disabled="isLoading"
          @click="fetchNotifications(currentPage)"
        >
          <RefreshCwIcon class="size-3.5 mr-1.5" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </AppButton>
      </div>
    </div>

    <!-- Error Banner -->
    <ErrorBanner
      v-if="error"
      :message="error"
      @retry="fetchNotifications(currentPage)"
    />

    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 border-b border-border">
      <button
        type="button"
        class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer"
        :class="activeTab === 'ALL' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'ALL'"
      >
        All Notifications ({{ notifications.length }})
      </button>

      <button
        type="button"
        class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
        :class="activeTab === 'UNREAD' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'UNREAD'"
      >
        <span>Unread</span>
        <span
          v-if="unreadCount > 0"
          class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-white"
        >
          {{ unreadCount }}
        </span>
      </button>

      <button
        type="button"
        class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer"
        :class="activeTab === 'READ' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'READ'"
      >
        Read
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-3 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-20 bg-muted/40 rounded-lg border border-border"></div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="filteredNotifications.length === 0"
      title="No notifications to display"
      description="You have no notifications in this filter category at this time."
    >
      <template #action>
        <AppButton
          v-if="activeTab !== 'ALL'"
          variant="outline"
          size="sm"
          @click="activeTab = 'ALL'"
        >
          View all notifications
        </AppButton>
      </template>
    </EmptyState>

    <!-- Notification Feed -->
    <div v-else class="space-y-3">
      <div
        v-for="item in filteredNotifications"
        :key="item.id"
        class="p-4 rounded-lg border bg-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        :class="item.status === 'UNREAD' ? 'border-primary/40 bg-primary/5' : 'border-border'"
      >
        <div class="flex items-start gap-3.5 min-w-0">
          <div
            class="p-2.5 rounded-lg shrink-0"
            :class="item.status === 'UNREAD' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'"
          >
            <component :is="getNotificationIcon(item.type)" class="size-4" />
          </div>

          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                :class="item.status === 'UNREAD' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border'"
              >
                {{ item.status }}
              </span>

              <span class="text-[11px] text-muted-foreground font-mono">
                {{ formatDate(item.sentAt) }}
              </span>

              <span class="text-[10px] text-muted-foreground/80 font-mono">
                via {{ item.channel }}
              </span>
            </div>

            <h2 class="text-sm font-bold text-foreground">
              {{ item.title }}
            </h2>

            <p class="text-xs text-muted-foreground leading-relaxed">
              {{ item.message }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            v-if="item.status === 'UNREAD'"
            type="button"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-border hover:border-primary text-foreground hover:text-primary transition-colors cursor-pointer"
            :disabled="isMarkingId === item.id"
            @click="handleMarkAsRead(item)"
          >
            <CheckCheckIcon class="size-3.5" />
            <span>{{ isMarkingId === item.id ? 'Updating...' : 'Mark as read' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="lastPage > 1"
      class="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"
    >
      <div>
        Showing page <strong class="text-foreground">{{ currentPage }}</strong> of <strong class="text-foreground">{{ lastPage }}</strong>
        ({{ totalCount }} total notifications)
      </div>

      <div class="flex items-center gap-2">
        <AppButton
          variant="outline"
          size="sm"
          :disabled="currentPage <= 1 || isLoading"
          @click="fetchNotifications(currentPage - 1)"
        >
          <ChevronLeftIcon class="size-3.5 mr-1" />
          Previous
        </AppButton>

        <AppButton
          variant="outline"
          size="sm"
          :disabled="currentPage >= lastPage || isLoading"
          @click="fetchNotifications(currentPage + 1)"
        >
          Next
          <ChevronRightIcon class="size-3.5 ml-1" />
        </AppButton>
      </div>
    </div>
  </div>
</template>
