<script setup lang="ts">
import { useTasks } from '@/composables/useTasks'
import { getTourDemoPrimaryTaskId } from '@/composables/useTourDemoData'
import { useWindowSize } from '@vueuse/core'
import { toast } from 'vue-sonner'
import TaskItem from './TaskItem.vue'
import TaskEditModal from './TaskEditModal.vue'
import TaskPreviewModal from './TaskPreviewModal.vue'
import TasksEmptyState from './TasksEmptyState.vue'
import type { TaskForm } from '@/composables/useTaskForm'
import type { Task } from '@/types'
import { useI18n } from 'vue-i18n'

const { tasks, removeTask, restoreTask, updateTask, reorderTask } = useTasks()
const { t } = useI18n()
const presentation = useProductTourPresentation()

const tourDemoPrimaryTaskId = computed(() => getTourDemoPrimaryTaskId())

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
  () => presentation.previewTaskId.value,
  taskId => {
    if (taskId) {
      handlePreviewTask(taskId)
    } else if (!presentation.editTaskId.value) {
      isPreviewModalOpen.value = false
    }
  }
)

watch(
  () => presentation.editTaskId.value,
  taskId => {
    if (taskId) {
      isPreviewModalOpen.value = false
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

/* ------------------------- PREVIEW MODAL ----------------------------------- */
const previewTask = ref<Task | null>(null)
const isPreviewModalOpen = ref(false)

const previewSourceEl = ref<HTMLElement | null>(null)
const previewSourceWidth = computed(() => {
  if (!previewSourceEl.value) return undefined
  return Math.min(previewSourceEl.value.getBoundingClientRect().width, windowWidth.value - 16)
})

const handlePreviewTask = (taskId: string) => {
  previewTask.value = tasks.value.find(t => t.id === taskId) ?? null
  previewSourceEl.value = taskRefs.value.get(taskId) ?? null
  isPreviewModalOpen.value = true
}

const handlePreviewModalOpenChange = (open: boolean) => {
  if (!open && presentation.isActive.value && presentation.previewTaskId.value) {
    return
  }
  isPreviewModalOpen.value = open
  if (!open) {
    setTimeout(() => {
      previewTask.value = null
      previewSourceEl.value = null
    }, 250)
  }
}

const handlePreviewEdit = (taskId: string) => {
  handlePreviewModalOpenChange(false)
  handleEditTask(taskId)
}

const handlePreviewRemove = (taskId: string) => {
  handlePreviewModalOpenChange(false)
  handleRemoveTask(taskId)
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
let canDrag = false
const draggedTaskId = ref<string | null>(null)
const dragOverTaskId = ref<string | null>(null)
const dragOverPosition = ref<'before' | 'after'>('after')

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

const handleHandlePointerdown = () => {
  canDrag = true
}

const handleDragStart = (taskId: string, event: DragEvent) => {
  if (!canDrag) {
    event.preventDefault()
    return
  }
  draggedTaskId.value = taskId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
  }
}

const handleDragOver = (taskId: string, event: DragEvent) => {
  updateAutoScroll(event)
  if (!draggedTaskId.value || taskId === draggedTaskId.value) return
  const el = taskRefs.value.get(taskId)
  if (!el) return
  const rect = el.getBoundingClientRect()
  dragOverTaskId.value = taskId
  dragOverPosition.value = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

const handleDrop = (taskId: string) => {
  if (!draggedTaskId.value || taskId === draggedTaskId.value) return
  const draggedTask = tasks.value.find(t => t.id === draggedTaskId.value)
  const targetTask = tasks.value.find(t => t.id === taskId)
  if (!draggedTask || !targetTask) return

  const fromIndex = tasks.value.indexOf(draggedTask)
  const overIndex = tasks.value.indexOf(targetTask)
  if (fromIndex === -1 || overIndex === -1) return

  let toIndex = dragOverPosition.value === 'after' ? overIndex + 1 : overIndex
  if (fromIndex < toIndex) toIndex -= 1

  const now = new Date()
  const draggedGroup = getGroupKey(draggedTask.displayDate, now)
  const targetGroup = getGroupKey(targetTask.displayDate, now)
  const newDisplayDate = draggedGroup !== targetGroup ? targetTask.displayDate : undefined

  reorderTask(fromIndex, toIndex, newDisplayDate)
}

const handleDragEnd = () => {
  canDrag = false
  draggedTaskId.value = null
  dragOverTaskId.value = null
  stopAutoScroll()
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
          updateFocus()
          if (index + 1 === tasks.value.length) scrollToBottom()
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
const didInitialScroll = ref(false)

onMounted(() => {
  nextTick(() => {
    if (listContainer.value && !didInitialScroll.value) {
      listContainer.value.scrollTop = listContainer.value.scrollHeight
      didInitialScroll.value = true
    }
    updateFocus()
  })
})

watch(tasks, () => {
  nextTick(() => {
    if (listContainer.value && !didInitialScroll.value) {
      listContainer.value.scrollTop = listContainer.value.scrollHeight
      didInitialScroll.value = true
    }
    updateFocus()
  })
})

/* ------------------------- TEMPLATE REFS HANDLING ----------------------------------- */
const setTaskRef = (el: HTMLElement | null, taskId: string) => {
  if (el) {
    taskRefs.value.set(taskId, el)
  }
}

/* ------------------------- HANDLING FOCUS INDEX AND VISIBLE TASKS ----------------------------------- */
const updateFocus = () => {
  if (!listContainer.value) return

  const top = listContainer.value.scrollTop
  const bottom = top + listContainer.value.clientHeight
  const nextVisible = new Set<string>()

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

  visibleTaskIds.value = nextVisible
  focusIndex.value = foundFirstVisible ? firstVisibleIndex : 0
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
})

watch(
  () => windowHeight.value,

  () => {
    updateFocus()
  }
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
  if (listContainer.value) {
    listContainer.value.scrollTop = listContainer.value.scrollHeight
  }
}

defineExpose({ scrollToBottom })
</script>

<template>
  <div class="scroll-list" data-tour="task-list">
    <div class="scroll-list__wrp-frame">
      <div
        ref="listContainer"
        class="scroll-list__wrp js-scroll-content js-scroll-list"
        :class="{ 'scroll-list__wrp--empty': isEmpty }"
        :style="{ height: scrollListHeigth + 'px' }"
        @scroll.passive="updateFocus"
        @dragover="updateAutoScroll($event)"
      >
        <div v-if="isEmpty" class="scroll-list__empty">
          <TasksEmptyState @select-suggestion="emit('select-suggestion', $event)" />
        </div>
        <ul v-else class="scroll-list__list">
          <template v-for="(task, index) in sortedTasks" :key="task.id">
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
              :data-tour="task.id === tourDemoPrimaryTaskId ? 'demo-task' : undefined"
              :class="{
                'item-focus': index === focusIndex,
                'item-visible': visibleTaskIds.has(task.id),
              }"
              draggable="true"
              @dragstart="handleDragStart(task.id, $event)"
              @dragover.prevent="handleDragOver(task.id, $event)"
              @drop.prevent="handleDrop(task.id)"
              @dragend="handleDragEnd"
            >
              <div
                v-if="dragOverTaskId === task.id"
                class="absolute inset-x-0 h-0.5 bg-primary rounded-full z-10"
                :class="dragOverPosition === 'before' ? 'top-[-8px]' : 'bottom-[-9px]'"
              />
              <TaskItem
                :task="task"
                :dragging="draggedTaskId === task.id"
                @remove="handleRemoveTask"
                @edit="handleEditTask"
                @preview="handlePreviewTask"
                @handle-pointerdown="handleHandlePointerdown"
              />
            </li>
          </template>
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
  <TaskPreviewModal
    v-if="previewTask"
    :key="previewTask.id"
    :task="previewTask"
    :open="isPreviewModalOpen"
    :source-width="previewSourceWidth"
    @update:open="handlePreviewModalOpenChange"
    @edit="handlePreviewEdit"
    @remove="handlePreviewRemove"
  />
</template>
