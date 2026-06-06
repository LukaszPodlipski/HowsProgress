<script setup lang="ts">
import { useTasks } from '@/composables/useTasks'
import { getTourDemoPrimaryTaskId } from '@/composables/useTourDemoData'
import { useWindowSize } from '@vueuse/core'
import { toast } from 'vue-sonner'
import TaskItem from './TaskItem.vue'
import TaskEditModal from './TaskEditModal.vue'
import TasksEmptyState from './TasksEmptyState.vue'
import type { TaskForm } from '@/composables/useTaskForm'
import type { Task } from '@/types'
import { useI18n } from 'vue-i18n'

const { tasks, removeTask, restoreTask, updateTask, reorderTasksOrdered } = useTasks()
const { t } = useI18n()
const presentation = useProductTourPresentation()

const emit = defineEmits<{
  (e: 'select-suggestion', title: string): void
}>()

/* ------------------------- EDIT MODAL ----------------------------------- */
const editingTask = ref<Task | null>(null)
const isEditModalOpen = ref(false)

const editSourceEl = ref<HTMLElement | null>(null)
const editSourceWidth = computed(() => {
  if (!editSourceEl.value) return undefined
  return Math.min(editSourceEl.value.getBoundingClientRect().width, windowWidth.value - 16)
})

const handleEditTask = (taskId: string) => {
  editingTask.value = tasks.value.find(t => t.id === taskId) ?? null
  editSourceEl.value = taskRefs.value.get(taskId) ?? null
  isEditModalOpen.value = true
}

const handleModalOpenChange = (open: boolean) => {
  if (!open && presentation.isActive.value && presentation.editTaskId.value) {
    return
  }
  isEditModalOpen.value = open
  if (!open) {
    setTimeout(() => {
      editingTask.value = null
      editSourceEl.value = null
    }, 250)
  }
}

watch(
  () => presentation.editTaskId.value,
  taskId => {
    if (taskId) {
      handleEditTask(taskId)
    } else {
      isEditModalOpen.value = false
    }
  }
)

const handleSaveTask = (form: TaskForm) => {
  if (editingTask.value) {
    updateTask(editingTask.value.id, form)
  }
}

/* ------------------------- DATE SEPARATORS ----------------------------------- */
const daysDiff = (displayDate: string, now: Date): number => {
  const date = new Date(displayDate + 'T00:00:00')
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

const getGroupKey = (displayDate: string, now: Date): string => {
  const diff = daysDiff(displayDate, now)
  if (diff >= 0 && diff <= 2) return displayDate
  const date = new Date(displayDate + 'T00:00:00')
  const monday = getMondayOfWeek(date)
  return `week-${monday.toISOString().slice(0, 10)}`
}

const getGroupSortKey = (displayDate: string, now: Date): string => {
  const diff = daysDiff(displayDate, now)
  if (diff >= 0 && diff <= 2) return displayDate
  const date = new Date(displayDate + 'T00:00:00')
  const monday = getMondayOfWeek(date)
  return monday.toISOString().slice(0, 10)
}

const getDateLabel = (displayDate: string, now: Date): string => {
  const diff = daysDiff(displayDate, now)

  if (diff === 0) return t('dateSeparator.today')
  if (diff === 1) return t('dateSeparator.yesterday')
  if (diff === 2) return t('dateSeparator.dayBeforeYesterday')

  // Weekly range
  const date = new Date(displayDate + 'T00:00:00')
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  if (monday.getMonth() === sunday.getMonth()) {
    const month = sunday.toLocaleDateString('pl-PL', { month: 'long' })
    return `${monday.getDate()}-${sunday.getDate()} ${month}`
  }

  const monMonth = monday.toLocaleDateString('pl-PL', { month: 'long' })
  const sunMonth = sunday.toLocaleDateString('pl-PL', { month: 'long' })
  return `${monday.getDate()} ${monMonth} - ${sunday.getDate()} ${sunMonth}`
}

const sortedTasks = computed(() => {
  const now = new Date()
  return [...tasks.value].sort((a, b) => {
    const keyA = getGroupSortKey(a.displayDate, now)
    const keyB = getGroupSortKey(b.displayDate, now)
    if (keyA !== keyB) return keyA.localeCompare(keyB)
    return a.order - b.order
  })
})

const isEmpty = computed(() => sortedTasks.value.length === 0)

const tourHighlightTaskId = computed(
  () => getTourDemoPrimaryTaskId() ?? sortedTasks.value[0]?.id ?? null
)

const isTourHighlightTask = (taskId: string) =>
  presentation.isActive.value && taskId === tourHighlightTaskId.value

const dateSeparators = computed(() => {
  const now = new Date()
  const separators = new Map<string, string>()
  let lastGroupKey = ''

  for (const task of sortedTasks.value) {
    const key = getGroupKey(task.displayDate, now)
    if (key !== lastGroupKey) {
      separators.set(task.id, getDateLabel(task.displayDate, now))
      lastGroupKey = key
    }
  }

  return separators
})

/* ------------------------- DRAG AND DROP ----------------------------------- */
const draggedTaskId = ref<string | null>(null)
const dropInsertIndex = ref<number | null>(null)
const dropIndicatorIndex = ref<number | null>(null)

const getDropIndicatorIndex = (insertIndex: number, fromIndex: number): number => {
  // Source item still occupies its slot in the DOM while dragging
  if (fromIndex < insertIndex) return insertIndex + 1
  return insertIndex
}

const getDropTargetIndex = (overTaskId: string, clientY: number): number | null => {
  if (!draggedTaskId.value || overTaskId === draggedTaskId.value) return null

  const sorted = sortedTasks.value
  const fromSortedIndex = sorted.findIndex(t => t.id === draggedTaskId.value)
  const overSortedIndex = sorted.findIndex(t => t.id === overTaskId)
  if (fromSortedIndex === -1 || overSortedIndex === -1) return null

  const el = taskRefs.value.get(overTaskId)
  if (!el) return null

  const rect = el.getBoundingClientRect()
  const insertAfter = clientY >= rect.top + rect.height / 2
  let toSortedIndex = insertAfter ? overSortedIndex + 1 : overSortedIndex
  if (fromSortedIndex < toSortedIndex) toSortedIndex -= 1

  if (fromSortedIndex === toSortedIndex) return null

  return toSortedIndex
}

// Auto-scroll
let autoScrollRaf: number | null = null
let autoScrollSpeed = 0
const SCROLL_ZONE = 80
const MAX_SCROLL_SPEED = 15

const updateAutoScroll = (event: DragEvent) => {
  if (!listContainer.value) return
  const rect = listContainer.value.getBoundingClientRect()
  const distFromTop = event.clientY - rect.top
  const distFromBottom = rect.bottom - event.clientY

  if (distFromTop < SCROLL_ZONE && distFromTop > 0) {
    autoScrollSpeed = -((SCROLL_ZONE - distFromTop) / SCROLL_ZONE) * MAX_SCROLL_SPEED
  } else if (distFromBottom < SCROLL_ZONE && distFromBottom > 0) {
    autoScrollSpeed = ((SCROLL_ZONE - distFromBottom) / SCROLL_ZONE) * MAX_SCROLL_SPEED
  } else {
    autoScrollSpeed = 0
  }

  if (autoScrollSpeed !== 0 && autoScrollRaf === null) {
    const tick = () => {
      if (!listContainer.value || autoScrollSpeed === 0) {
        stopAutoScroll()
        return
      }
      listContainer.value.scrollBy({ top: autoScrollSpeed, behavior: 'instant' })
      autoScrollRaf = requestAnimationFrame(tick)
    }
    autoScrollRaf = requestAnimationFrame(tick)
  } else if (autoScrollSpeed === 0) {
    stopAutoScroll()
  }
}

const stopAutoScroll = () => {
  if (autoScrollRaf !== null) {
    cancelAnimationFrame(autoScrollRaf)
    autoScrollRaf = null
  }
  autoScrollSpeed = 0
}

const handleDragStart = (taskId: string, event: DragEvent) => {
  const li = taskRefs.value.get(taskId)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
    if (li) {
      event.dataTransfer.setDragImage(li, li.clientWidth / 2, 24)
    }
  }
  // Defer reactive updates so drag is not cancelled by layout/DOM changes in dragstart
  requestAnimationFrame(() => {
    draggedTaskId.value = taskId
  })
}

const handleDragOver = (taskId: string, event: DragEvent) => {
  updateAutoScroll(event)
  const insertIndex = getDropTargetIndex(taskId, event.clientY)
  if (insertIndex === null || !draggedTaskId.value) {
    dropInsertIndex.value = null
    dropIndicatorIndex.value = null
    return
  }

  const fromSortedIndex = sortedTasks.value.findIndex(t => t.id === draggedTaskId.value)
  dropInsertIndex.value = insertIndex
  dropIndicatorIndex.value = getDropIndicatorIndex(insertIndex, fromSortedIndex)
}

const handleDrop = () => {
  const draggedId = draggedTaskId.value
  const toSortedIndex = dropInsertIndex.value
  if (!draggedId || toSortedIndex === null) return

  const sorted = sortedTasks.value
  const fromSortedIndex = sorted.findIndex(t => t.id === draggedId)
  if (fromSortedIndex === -1) return
  if (toSortedIndex === fromSortedIndex) return

  const draggedTask = sorted[fromSortedIndex]!
  const anchorTask = sorted[toSortedIndex] ?? sorted[toSortedIndex - 1]
  const now = new Date()
  const newDisplayDate =
    anchorTask &&
    getGroupKey(draggedTask.displayDate, now) !== getGroupKey(anchorTask.displayDate, now)
      ? anchorTask.displayDate
      : undefined

  const reordered = [...sorted]
  reordered.splice(fromSortedIndex, 1)
  reordered.splice(toSortedIndex, 0, draggedTask)

  reorderTasksOrdered(reordered, draggedTask.id, newDisplayDate)
}

const handleDragEnd = () => {
  draggedTaskId.value = null
  dropInsertIndex.value = null
  dropIndicatorIndex.value = null
  stopAutoScroll()
  scheduleUpdateFocus()
}

/* ------------------------- REMOVE TASK ----------------------------------- */
const handleRemoveTask = (taskId: string) => {
  const index = tasks.value.findIndex(t => t.id === taskId)
  const task = index !== -1 ? tasks.value[index] : undefined
  if (!task) return

  removeTask(taskId)

  toast(t('task.deleted'), {
    action: {
      label: t('task.undo'),
      onClick: () => {
        restoreTask(task, index)
        nextTick(() => {
          if (index + 1 === tasks.value.length) scrollToBottom()
          else scheduleUpdateFocus()
        })
      },
    },
  })
}
const { width: windowWidth, height: windowHeight } = useWindowSize()

const taskRefs = ref<Map<string, HTMLElement>>(new Map())
const listContainer = ref<HTMLElement | null>(null)
const focusIndex = ref(0)
const visibleTaskIds = ref<Set<string>>(new Set())
const pendingVisibleIds = ref<Set<string>>(new Set())
const didInitialScroll = ref(false)

let focusUpdateRaf: number | null = null

const setsEqual = (a: Set<string>, b: Set<string>) => {
  if (a.size !== b.size) return false
  for (const id of a) {
    if (!b.has(id)) return false
  }
  return true
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

onMounted(() => {
  nextTick(() => {
    if (listContainer.value && !didInitialScroll.value) {
      listContainer.value.scrollTop = listContainer.value.scrollHeight
      didInitialScroll.value = true
    }
    scheduleUpdateFocus()
  })
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

/* ------------------------- TEMPLATE REFS HANDLING ----------------------------------- */
const setTaskRef = (el: HTMLElement | null, taskId: string) => {
  if (el) {
    taskRefs.value.set(taskId, el)
  } else {
    taskRefs.value.delete(taskId)
  }
}

/* ------------------------- HANDLING FOCUS INDEX AND VISIBLE TASKS ----------------------------------- */
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

/* ------------------------- Handling input block height ----------------------------------- */
let resizeObserver: ResizeObserver | null = null
const inputBlockHeight = ref(0)

onMounted(() => {
  const el = getInputElement()

  if (!el) return

  inputBlockHeight.value = (el as HTMLElement).offsetHeight
  resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0]
    if (entry) inputBlockHeight.value = entry.contentRect.height
  })
  resizeObserver.observe(el)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (focusUpdateRaf !== null) {
    cancelAnimationFrame(focusUpdateRaf)
    focusUpdateRaf = null
  }
})

watch(
  () => windowHeight.value,
  () => scheduleUpdateFocus()
)

/* ------------------------- SCROLLING UTILS ----------------------------------- */
const getInputElement = (): Element | null => {
  return (
    document.querySelector('.scroll-list__input') ??
    listContainer.value?.parentElement?.parentElement?.parentElement?.querySelector(
      '.scroll-list__input'
    ) ??
    null
  )
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

defineExpose({ scrollToBottom })
</script>

<template>
  <div class="scroll-list" data-tour="task-list">
    <div class="scroll-list__wrp-frame">
      <div
        ref="listContainer"
        class="scroll-list__wrp js-scroll-content js-scroll-list"
        :class="{
          'scroll-list__wrp--empty': isEmpty,
          'scroll-list__wrp--dragging': draggedTaskId !== null,
        }"
        :style="{ height: scrollListHeigth + 'px' }"
        @scroll.passive="updateFocus"
        @dragover.prevent="updateAutoScroll($event)"
      >
        <div v-if="isEmpty" class="scroll-list__empty">
          <TasksEmptyState @select-suggestion="emit('select-suggestion', $event)" />
        </div>
        <ul v-else class="scroll-list__list">
          <template v-for="(task, index) in sortedTasks" :key="task.id">
            <li
              v-if="dropIndicatorIndex === index"
              class="scroll-list__drop-indicator"
              aria-hidden="true"
            />
            <li
              v-if="dateSeparators.has(task.id)"
              class="scroll-list__separator"
              aria-hidden="true"
            >
              <div class="scroll-list__separator-line" />
              <span class="scroll-list__separator-label">{{ dateSeparators.get(task.id) }}</span>
              <div class="scroll-list__separator-line" />
            </li>
            <li
              :ref="el => setTaskRef(el as HTMLElement, task.id)"
              class="scroll-list__item js-scroll-list-item relative"
              :class="{
                'item-focus': index === focusIndex,
                'item-visible': visibleTaskIds.has(task.id) || isTourHighlightTask(task.id),
                'scroll-list__item--source': draggedTaskId === task.id,
              }"
              @dragover.prevent="handleDragOver(task.id, $event)"
              @drop.prevent="handleDrop()"
            >
              <TaskItem
                :task="task"
                :dragging="draggedTaskId === task.id"
                :tour-id="task.id === tourHighlightTaskId ? 'demo-task' : undefined"
                :expanded="
                  presentation.isActive.value && presentation.expandedTaskId.value === task.id
                "
                :edit-button-tour="task.id === tourHighlightTaskId ? 'demo-task-edit' : undefined"
                :show-actions="
                  visibleTaskIds.has(task.id) ||
                  index === focusIndex ||
                  draggedTaskId === task.id ||
                  isTourHighlightTask(task.id)
                "
                @remove="handleRemoveTask"
                @edit="handleEditTask"
                @drag-start="handleDragStart"
                @drag-end="handleDragEnd"
              />
            </li>
          </template>
          <li
            v-if="dropIndicatorIndex === sortedTasks.length"
            class="scroll-list__drop-indicator"
            aria-hidden="true"
          />
        </ul>
      </div>
      <div class="scroll-list__fade scroll-list__fade--top" aria-hidden="true"></div>
      <div
        v-if="!isEmpty"
        class="scroll-list__fade scroll-list__fade--bottom"
        aria-hidden="true"
      ></div>
    </div>
  </div>

  <TaskEditModal
    v-if="editingTask"
    :key="editingTask.id"
    :task="editingTask"
    :open="isEditModalOpen"
    :source-width="editSourceWidth"
    @update:open="handleModalOpenChange"
    @save="handleSaveTask"
  />
</template>
