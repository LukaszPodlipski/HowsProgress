<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import type { Firestore } from 'firebase/firestore'
import type { Task } from '@/types'

const { currentUser, isLoggedIn, isLocalMode, initAuth } = useAuth()
const { fetchTasks, teardownFirestore, checkSyncNeeded, syncLocalTasksToFirestore, dismissSync } =
  useTasks()
const { initWorkspaces, teardownWorkspaces, activeWorkspaceId } = useWorkspaces()

const showSyncDialog = ref(false)
const pendingSyncTasks = ref<Task[]>([])

const route = useRoute()

const ROUTES_WITHOUT_SIDEBAR = ['/login']
const isFullscreenRoute = computed(() => ROUTES_WITHOUT_SIDEBAR.includes(route.path))

await initAuth()

if (!isLoggedIn.value && !isLocalMode.value) {
  await navigateTo('/login')
}

const { $firebaseDb } = useNuxtApp()

if (isLoggedIn.value && currentUser.value) {
  await initWorkspaces($firebaseDb as Firestore, currentUser.value.uid)
  fetchTasks()
} else if (isLocalMode.value) {
  await initWorkspaces()
  fetchTasks()
}

const readLocalWorkspaceTasks = (): Task[] => {
  const wsId = activeWorkspaceId.value
  if (!wsId) return []
  try {
    const stored = localStorage.getItem(`how-is-your-progress-tasks--${wsId}`)
    return stored ? (JSON.parse(stored) as Task[]) : []
  } catch {
    return []
  }
}

watch(
  () => currentUser.value?.uid,
  async (uid, prevUid) => {
    if (uid && !prevUid) {
      // Read local tasks before initWorkspaces changes activeWorkspaceId
      const localTasks = readLocalWorkspaceTasks()
      await initWorkspaces($firebaseDb as Firestore, uid)
      const sync = await checkSyncNeeded(uid, localTasks)
      if (sync.needed) {
        showSyncDialog.value = true
        pendingSyncTasks.value = sync.localTasks
      }
      fetchTasks()
    } else if (!uid && prevUid) {
      teardownFirestore()
      teardownWorkspaces()
      await initWorkspaces()
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
