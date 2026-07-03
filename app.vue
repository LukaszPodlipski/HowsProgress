<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import type { Firestore } from 'firebase/firestore'
import type { Task } from '@/types'

const { currentUser, isLoggedIn, isLocalMode } = useAuth()
const { fetchTasks, teardownFirestore, checkSyncNeeded, syncLocalTasksToFirestore, dismissSync } =
  useTasks()
const { initWorkspaces, teardownWorkspaces, activeWorkspaceId } = useWorkspaces()
const { isReady, showLoader, isExiting, phase } = useAppBootstrap()

const showSyncDialog = ref(false)
const pendingSyncTasks = ref<Task[]>([])

const route = useRoute()

const ROUTES_WITHOUT_SIDEBAR = ['/login']
const isFullscreenRoute = computed(() => ROUTES_WITHOUT_SIDEBAR.includes(route.path))

const { $firebaseDb } = useNuxtApp()

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
  <AppLoader v-if="showLoader" :phase="phase" :exiting="isExiting" />

  <template v-if="isReady">
    <template v-if="isFullscreenRoute">
      <NuxtPage class="w-full" />
    </template>

    <template v-else>
      <SidebarProvider>
        <AppSidebar />
        <AppProductTour :blocked="showSyncDialog" />
        <SidebarInset>
          <AppHeader />
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
</template>
