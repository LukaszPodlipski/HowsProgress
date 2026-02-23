<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Task } from '@/types'

const { currentUser, isLoggedIn, isLocalMode, userInitials, initAuth, signOut } = useAuth()
const { fetchTasks, teardownFirestore, checkSyncNeeded, syncLocalTasksToFirestore, dismissSync } =
  useTasks()

const route = useRoute()
const { t } = useI18n()

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
  <div class="min-h-screen flex flex-col items-center">
    <nav v-if="route.path !== '/login'" class="fixed top-0 left-0 right-0 z-100 py-1 px-2">
      <div class="flex items-center gap-4 justify-between max-w-4xl mx-auto">
        <NuxtImg src="/logo.png" alt="How's progress?" width="50" height="50" />

        <template v-if="isLoggedIn">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Avatar size="xs" class="cursor-pointer">
                <AvatarImage
                  v-if="currentUser?.photoURL"
                  class="min-w-8 min-h-8"
                  :src="currentUser.photoURL"
                  :alt="currentUser?.displayName ?? ''"
                  referrer-policy="no-referrer"
                />
                <AvatarFallback>{{ userInitials }}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="min-w-48">
              <DropdownMenuLabel>{{ currentUser?.displayName }}</DropdownMenuLabel>
              <DropdownMenuLabel class="font-normal text-muted-foreground text-xs -mt-2">
                {{ currentUser?.email }}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="signOut">
                <Icon name="lucide:log-out" class="size-4" />
                {{ t('auth.signOut') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>

        <template v-else-if="isLocalMode">
          <Button variant="outline" size="sm" @click="navigateTo('/login')">
            {{ t('auth.signIn') }}
          </Button>
        </template>
      </div>
    </nav>
    <main class="flex flex-col items-center w-full">
      <NuxtPage class="w-full" />
    </main>
  </div>
  <Toaster position="top-center" theme="dark" />
  <SyncDialog
    :open="showSyncDialog"
    :task-count="pendingSyncTasks.length"
    @sync="handleSync"
    @dismiss="handleDismissSync"
  />
</template>
