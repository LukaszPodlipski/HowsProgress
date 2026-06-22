import { until } from '@vueuse/core'
import type { Firestore } from 'firebase/firestore'

export type BootstrapPhase = 'auth' | 'workspaces' | 'tasks' | 'ready'

const MIN_LOADER_MS = 900
const EXIT_ANIMATION_MS = 520

const isReady = ref(false)
const showLoader = ref(true)
const isExiting = ref(false)
const phase = ref<BootstrapPhase>('auth')
let bootstrapStarted = false

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const removeStaticSplash = () => {
  if (typeof window === 'undefined') return
  window.__removeAppSplash?.()
}

export const useAppBootstrap = () => {
  const runBootstrap = async () => {
    if (bootstrapStarted) return
    bootstrapStarted = true

    const startedAt = Date.now()
    const { initAuth, isLoggedIn, isLocalMode, currentUser } = useAuth()
    const { initWorkspaces, workspacesReady, ensureDefaultWorkspace, workspaces } = useWorkspaces()
    const { fetchTasks } = useTasks()
    const { $firebaseDb } = useNuxtApp()

    try {
      phase.value = 'auth'
      await initAuth()

      if (!isLoggedIn.value && !isLocalMode.value) {
        await navigateTo('/login')
      } else {
        phase.value = 'workspaces'

        if (isLoggedIn.value && currentUser.value) {
          await initWorkspaces($firebaseDb as Firestore, currentUser.value.uid)
          await until(workspacesReady).toBe(true)
        } else if (isLocalMode.value) {
          await initWorkspaces()
        }

        if (workspaces.value.length === 0) {
          await ensureDefaultWorkspace()
        }

        phase.value = 'tasks'
        fetchTasks()
      }

      phase.value = 'ready'

      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, MIN_LOADER_MS - elapsed)
      if (remaining > 0) {
        await wait(remaining)
      }

      isExiting.value = true
      await wait(EXIT_ANIMATION_MS)
      showLoader.value = false
      isReady.value = true
      removeStaticSplash()
    } catch {
      showLoader.value = false
      isReady.value = true
      removeStaticSplash()
    }
  }

  onMounted(() => {
    void runBootstrap()
  })

  return {
    isReady: readonly(isReady),
    showLoader: readonly(showLoader),
    isExiting: readonly(isExiting),
    phase: readonly(phase),
  }
}
