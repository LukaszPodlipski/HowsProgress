<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar'

const props = defineProps<{
  blocked?: boolean
}>()

const route = useRoute()
const { currentUser, isLoggedIn, isLocalMode } = useAuth()
const { workspacesReady } = useWorkspaces()
const { setOpen } = useSidebar()

const {
  productTourLoaded,
  tourTargetsReady,
  shouldShowProductTour,
  loadProductTourStatus,
  startProductTour,
  destroyActiveTour,
} = useProductTour()

const isHomeRoute = computed(() => route.path === '/')

const canRunTour = computed(
  () =>
    isHomeRoute.value &&
    (isLoggedIn.value || isLocalMode.value) &&
    workspacesReady.value &&
    tourTargetsReady.value &&
    productTourLoaded.value &&
    !props.blocked &&
    shouldShowProductTour.value
)

let startAttempt: ReturnType<typeof setTimeout> | null = null
let startAttempts = 0
const MAX_START_ATTEMPTS = 12

const clearScheduledStart = () => {
  startAttempts = 0
  if (startAttempt) {
    clearTimeout(startAttempt)
    startAttempt = null
  }
}

const scheduleTourStart = () => {
  clearScheduledStart()
  if (!canRunTour.value) return

  startAttempt = setTimeout(async () => {
    setOpen(true)
    await nextTick()
    const started = await startProductTour()
    if (!started && startAttempts < MAX_START_ATTEMPTS) {
      startAttempts += 1
      scheduleTourStart()
    }
  }, 350)
}

const initTour = async () => {
  await loadProductTourStatus()
  if (canRunTour.value) {
    scheduleTourStart()
  }
}

onMounted(() => {
  void initTour()
})

watch(
  () => [currentUser.value?.uid, isLocalMode.value] as const,
  () => {
    void initTour()
  }
)

watch(canRunTour, ready => {
  if (ready) {
    scheduleTourStart()
  } else {
    clearScheduledStart()
  }
})

onUnmounted(() => {
  clearScheduledStart()
  destroyActiveTour()
})
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
