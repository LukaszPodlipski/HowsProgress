import type { Task } from '@/types'
import type { ComputedRef, Ref } from 'vue'

type UseTaskListScrollOptions = {
  tasks: Ref<Task[]>
  sortedTasks: ComputedRef<Task[]>
  taskRefs: Ref<Map<string, HTMLElement>>
  listContainer: Ref<HTMLElement | null>
  isEmpty: ComputedRef<boolean>
  draggedTaskId: Ref<string | null>
  windowHeight: Ref<number>
}

const setsEqual = (a: Set<string>, b: Set<string>) => {
  if (a.size !== b.size) return false
  for (const id of a) {
    if (!b.has(id)) return false
  }
  return true
}

export const useTaskListScroll = ({
  tasks,
  sortedTasks,
  taskRefs,
  listContainer,
  isEmpty,
  draggedTaskId,
  windowHeight,
}: UseTaskListScrollOptions) => {
  const focusIndex = ref(0)
  const visibleTaskIds = ref<Set<string>>(new Set())
  const pendingVisibleIds = ref<Set<string>>(new Set())
  const didInitialScroll = ref(false)
  const inputBlockHeight = ref(0)

  let focusUpdateRaf: number | null = null
  let resizeObserver: ResizeObserver | null = null

  const getInputElement = (): Element | null => {
    return (
      document.querySelector('.scroll-list__input') ??
      listContainer.value?.parentElement?.parentElement?.parentElement?.querySelector(
        '.scroll-list__input'
      ) ??
      null
    )
  }

  const updateFocus = () => {
    if (!listContainer.value || draggedTaskId.value !== null) return

    const container = listContainer.value
    const top = container.scrollTop
    const bottom = top + container.clientHeight
    const nextVisible = new Set<string>()

    if (container.scrollHeight <= container.clientHeight + 1) {
      for (const task of sortedTasks.value) {
        nextVisible.add(task.id)
      }
      if (pendingVisibleIds.value.size > 0) {
        pendingVisibleIds.value = new Set()
      }
      if (!setsEqual(nextVisible, visibleTaskIds.value)) {
        visibleTaskIds.value = nextVisible
      }
      const nextFocus = Math.max(sortedTasks.value.length - 1, 0)
      if (focusIndex.value !== nextFocus) {
        focusIndex.value = nextFocus
      }
      return
    }

    let firstVisibleIndex = 0
    let foundFirstVisible = false

    for (let i = 0; i < sortedTasks.value.length; i += 1) {
      const task = sortedTasks.value[i]
      if (!task) continue
      const el = taskRefs.value.get(task.id)
      if (!el) continue

      const liTop = el.offsetTop
      const liBottom = liTop + el.offsetHeight
      const isVisible = liBottom > top && liTop < bottom

      if (isVisible) {
        nextVisible.add(task.id)
        if (!foundFirstVisible) {
          firstVisibleIndex = i
          foundFirstVisible = true
        }
      }
    }

    for (const id of pendingVisibleIds.value) {
      nextVisible.add(id)
    }

    let isNearBottom = false
    if (sortedTasks.value.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = container
      isNearBottom = scrollHeight - scrollTop - clientHeight < 50
      if (isNearBottom && pendingVisibleIds.value.size > 0) {
        pendingVisibleIds.value = new Set()
      }
    }

    if (!setsEqual(nextVisible, visibleTaskIds.value)) {
      visibleTaskIds.value = nextVisible
    }

    const nextFocus = foundFirstVisible
      ? firstVisibleIndex
      : isNearBottom && sortedTasks.value.length > 0
        ? sortedTasks.value.length - 1
        : 0

    if (focusIndex.value !== nextFocus) {
      focusIndex.value = nextFocus
    }
  }

  const scheduleUpdateFocus = () => {
    if (draggedTaskId.value !== null) return

    if (focusUpdateRaf !== null) {
      cancelAnimationFrame(focusUpdateRaf)
    }
    nextTick(() => {
      focusUpdateRaf = requestAnimationFrame(() => {
        focusUpdateRaf = null
        updateFocus()
      })
    })
  }

  const scrollToBottom = () => {
    if (!listContainer.value) return

    const apply = () => {
      if (!listContainer.value) return
      listContainer.value.scrollTop = listContainer.value.scrollHeight
    }

    apply()
    requestAnimationFrame(() => {
      apply()
      scheduleUpdateFocus()
    })
  }

  const scrollListHeigth = computed(() => {
    const PADDING_HEIGHT = 100
    const inputEl = getInputElement()
    const inputHeight =
      inputBlockHeight.value || (inputEl ? (inputEl as HTMLElement).offsetHeight : 0)
    const available = windowHeight.value - inputHeight - PADDING_HEIGHT

    if (isEmpty.value) {
      return Math.max(available, 360)
    }

    if (inputHeight === 0) {
      return Math.max(available, 200)
    }

    return available
  })

  onMounted(() => {
    nextTick(() => {
      if (listContainer.value && !didInitialScroll.value) {
        listContainer.value.scrollTop = listContainer.value.scrollHeight
        didInitialScroll.value = true
      }
      scheduleUpdateFocus()
    })

    const el = getInputElement()
    if (el) {
      inputBlockHeight.value = (el as HTMLElement).offsetHeight
      resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0]
        if (entry) inputBlockHeight.value = entry.contentRect.height
      })
      resizeObserver.observe(el)
    }
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    if (focusUpdateRaf !== null) {
      cancelAnimationFrame(focusUpdateRaf)
      focusUpdateRaf = null
    }
  })

  watch(
    () => tasks.value.length,
    (newLen, oldLen) => {
      nextTick(() => {
        if (!didInitialScroll.value && newLen > 0) {
          scrollToBottom()
          didInitialScroll.value = true
          return
        }

        if (newLen > (oldLen ?? 0)) {
          const addedCount = newLen - (oldLen ?? 0)
          const nextPending = new Set(pendingVisibleIds.value)
          for (const task of sortedTasks.value.slice(-addedCount)) {
            nextPending.add(task.id)
          }
          pendingVisibleIds.value = nextPending
          scrollToBottom()
        } else {
          scheduleUpdateFocus()
        }
      })
    }
  )

  watch(windowHeight, () => scheduleUpdateFocus())

  return {
    focusIndex,
    visibleTaskIds,
    scrollListHeigth,
    updateFocus,
    scheduleUpdateFocus,
    scrollToBottom,
  }
}
