<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import type { Task } from '@/types'

const { currentUser, isLoggedIn, isLocalMode, initAuth } = useAuth()
const { fetchTasks, teardownFirestore, checkSyncNeeded, syncLocalTasksToFirestore, dismissSync } =
  useTasks()

const route = useRoute()

const ROUTES_WITHOUT_SIDEBAR = ['/login']
const isFullscreenRoute = computed(() => ROUTES_WITHOUT_SIDEBAR.includes(route.path))

const showSyncDialog = ref(false)
const pendingSyncTasks = ref<Task[]>([])

await initAuth()

if (!isLoggedIn.value && !isLocalMode.value) {
  await navigateTo('/login')
}

watch(
  () => currentUser.value?.uid,
  async (uid, prevUid) => {
    if (uid && !prevUid) {
      const sync = await checkSyncNeeded(uid)
      if (sync.needed) {
        showSyncDialog.value = true
        pendingSyncTasks.value = sync.localTasks
      }
      fetchTasks()
    } else if (!uid && prevUid) {
      teardownFirestore()
      fetchTasks()
    }
  }
)

const handleSync = async () => {
  if (currentUser.value) {
    await syncLocalTasksToFirestore(currentUser.value.uid, pendingSyncTasks.value)
  }
  showSyncDialog.value = false
  pendingSyncTasks.value = []
}

const handleDismissSync = () => {
  dismissSync()
  showSyncDialog.value = false
  pendingSyncTasks.value = []
}

watch([isLoggedIn, isLocalMode], ([loggedIn, localMode]) => {
  if (!loggedIn && !localMode) {
    navigateTo('/login')
  }
})
</script>

<template>
  <template v-if="isFullscreenRoute">
    <NuxtPage class="w-full" />
  </template>

  <template v-else>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header class="flex h-12 shrink-0 items-center gap-2 px-4 border-b border-border/50">
          <SidebarTrigger class="-ml-1" />
        </header>
        <NuxtPage class="w-full" />
      </SidebarInset>
    </SidebarProvider>
  </template>

  <Toaster position="top-center" theme="dark" />
  <SyncDialog
    :open="showSyncDialog"
    :task-count="pendingSyncTasks.length"
    @sync="handleSync"
    @dismiss="handleDismissSync"
  />
</template>
