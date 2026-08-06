<script setup lang="ts">
import { useSortedTasks } from '@/composables/tasks/useSortedTasks'
import { useTaskEditModal } from '@/composables/tasks/useTaskEditModal'
import { useTaskListDragDrop } from '@/composables/tasks/useTaskListDragDrop'
import { useTaskListScroll } from '@/composables/tasks/useTaskListScroll'
import { useTasks } from '@/composables/useTasks'
import { getTourDemoPrimaryTaskId } from '@/composables/useTourDemoData'
import { useWindowSize } from '@vueuse/core'
import { toast } from 'vue-sonner'
import TaskItem from './TaskItem.vue'
import TaskEditModal from './TaskEditModal.vue'
import TasksEmptyState from './TasksEmptyState.vue'
import { useI18n } from 'vue-i18n'

const { tasks, removeTask, restoreTask, updateTask, cycleTaskStatus, reorderTasksOrdered } =
  useTasks()
const { t } = useI18n()
const presentation = useProductTourPresentation()

const emit = defineEmits<{
  (e: 'select-suggestion', title: string): void
}>()

const { width: windowWidth, height: windowHeight } = useWindowSize()
const { sortedTasks, isEmpty, dateSeparators, hasSeparatorBefore } = useSortedTasks(tasks)

const taskRefs = ref<Map<string, HTMLElement>>(new Map())
const listContainer = ref<HTMLElement | null>(null)
const draggedTaskId = ref<string | null>(null)

const {
  focusIndex,
  visibleTaskIds,
  scrollListHeigth,
  updateFocus,
  scheduleUpdateFocus,
  scrollToBottom,
} = useTaskListScroll({
  tasks,
  sortedTasks,
  taskRefs,
  listContainer,
  isEmpty,
  draggedTaskId,
  windowHeight,
})

const { dropTarget, pressingId, onPointerDown, onClickCapture } = useTaskListDragDrop({
  sortedTasks,
  hasSeparatorBefore,
  taskRefs,
  listContainer,
  reorderTasksOrdered,
  draggedTaskId,
  onDragEnd: scheduleUpdateFocus,
})

const {
  editingTask,
  isEditModalOpen,
  editSourceWidth,
  handleEditTask,
  handleModalOpenChange,
  handleSaveTask,
} = useTaskEditModal({
  tasks,
  taskRefs,
  windowWidth,
  presentation,
  updateTask,
})

const tourHighlightTaskId = computed(
  () => getTourDemoPrimaryTaskId() ?? sortedTasks.value[0]?.id ?? null
)

const isTourHighlightTask = (taskId: string) =>
  presentation.isActive.value && taskId === tourHighlightTaskId.value

const setTaskRef = (el: HTMLElement | null, taskId: string) => {
  if (el) {
    taskRefs.value.set(taskId, el)
  } else {
    taskRefs.value.delete(taskId)
  }
}

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
      >
        <div v-if="isEmpty" class="scroll-list__empty">
          <TasksEmptyState @select-suggestion="emit('select-suggestion', $event)" />
        </div>
        <ul v-else class="scroll-list__list">
          <template v-for="(task, index) in sortedTasks" :key="task.id">
            <li
              v-if="
                dropTarget?.indicatorIndex === index && dropTarget.placement !== 'after-separator'
              "
              class="scroll-list__drop-indicator"
              aria-hidden="true"
            />
            <li
              v-if="dateSeparators.has(task.id)"
              class="scroll-list__separator"
              aria-hidden="true"
              :data-separator-index="index"
            >
              <div class="scroll-list__separator-line" />
              <span class="scroll-list__separator-label">{{ dateSeparators.get(task.id) }}</span>
              <div class="scroll-list__separator-line" />
            </li>
            <li
              v-if="
                dropTarget?.indicatorIndex === index && dropTarget.placement === 'after-separator'
              "
              class="scroll-list__drop-indicator"
              aria-hidden="true"
            />
            <li
              :ref="el => setTaskRef(el as HTMLElement, task.id)"
              class="scroll-list__item js-scroll-list-item relative touch-manipulation"
              :data-task-drop-id="task.id"
              :class="{
                'item-focus': index === focusIndex,
                'item-visible': visibleTaskIds.has(task.id) || isTourHighlightTask(task.id),
                'scroll-list__item--source': draggedTaskId === task.id,
              }"
              @pointerdown="onPointerDown(task.id, $event)"
              @click.capture="onClickCapture"
            >
              <TaskItem
                :task="task"
                :dragging="draggedTaskId === task.id"
                :pressing="pressingId === task.id"
                :tour-id="task.id === tourHighlightTaskId ? 'demo-task' : undefined"
                :expanded="
                  presentation.isActive.value && presentation.expandedTaskId.value === task.id
                "
                :edit-button-tour="task.id === tourHighlightTaskId ? 'demo-task-edit' : undefined"
                :show-actions="isTourHighlightTask(task.id)"
                @remove="handleRemoveTask"
                @edit="handleEditTask"
                @cycle-status="cycleTaskStatus"
              />
            </li>
          </template>
          <li
            v-if="
              dropTarget?.indicatorIndex === sortedTasks.length &&
              dropTarget.placement !== 'after-separator'
            "
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
