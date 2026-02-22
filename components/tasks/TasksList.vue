<script setup lang="ts">
import { useTasks } from '@/composables/useTasks'
import { useWindowSize } from '@vueuse/core'
import { toast } from 'vue-sonner'
import TaskItem from './TaskItem.vue'
import TaskEditModal from './TaskEditModal.vue'
import TaskPreviewModal from './TaskPreviewModal.vue'
import type { TaskForm } from '@/composables/useTaskForm'
import type { Task } from '@/types'

const { tasks, removeTask, restoreTask, updateTask } = useTasks()

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
  isEditModalOpen.value = open
  if (!open) {
    setTimeout(() => {
      editingTask.value = null
      editSourceEl.value = null
    }, 250)
  }
}

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

/* ------------------------- REMOVE TASK ----------------------------------- */
const handleRemoveTask = (taskId: string) => {
  const index = tasks.value.findIndex(t => t.id === taskId)
  const task = index !== -1 ? tasks.value[index] : undefined
  if (!task) return

  removeTask(taskId)

  toast('Zadanie usunięte', {
    action: {
      label: 'Cofnij',
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

  for (let i = 0; i < tasks.value.length; i += 1) {
    const task = tasks.value[i]
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
  const PADDING_HEIGHT = 44

  if (inputBlockHeight.value === 0) {
    const el = getInputElement()
    if (el) return windowHeight.value - (el as HTMLElement).clientHeight - PADDING_HEIGHT
    return 100
  }

  return windowHeight.value - inputBlockHeight.value - PADDING_HEIGHT
})

const scrollToBottom = () => {
  if (listContainer.value) {
    listContainer.value.scrollTop = listContainer.value.scrollHeight
  }
}

defineExpose({ scrollToBottom })
</script>

<template>
  <div class="scroll-list">
    <div class="scroll-list__wrp-frame">
      <div
        ref="listContainer"
        class="scroll-list__wrp js-scroll-content js-scroll-list"
        :style="{ height: scrollListHeigth + 'px' }"
        @scroll.passive="updateFocus"
      >
        <ul class="scroll-list__list">
          <li
            v-for="(task, index) in tasks"
            :key="task.id"
            :ref="el => setTaskRef(el as HTMLElement, task.id)"
            class="scroll-list__item js-scroll-list-item"
            :class="{
              'item-focus': index === focusIndex,
              'item-visible': visibleTaskIds.has(task.id),
            }"
          >
            <TaskItem
              :task="task"
              @remove="handleRemoveTask"
              @edit="handleEditTask"
              @preview="handlePreviewTask"
            />
          </li>
        </ul>
      </div>
      <div class="scroll-list__fade scroll-list__fade--top" aria-hidden="true"></div>
      <div class="scroll-list__fade scroll-list__fade--bottom" aria-hidden="true"></div>
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
