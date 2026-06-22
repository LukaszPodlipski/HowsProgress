import type { TaskForm } from '@/composables/useTaskForm'
import type { Task } from '@/types'
import type { Ref } from 'vue'

type UseTaskEditModalOptions = {
  tasks: Ref<Task[]>
  taskRefs: Ref<Map<string, HTMLElement>>
  windowWidth: Ref<number>
  presentation: {
    isActive: Ref<boolean>
    editTaskId: Ref<string | null>
  }
  updateTask: (taskId: string, form: TaskForm) => void
}

export const useTaskEditModal = ({
  tasks,
  taskRefs,
  windowWidth,
  presentation,
  updateTask,
}: UseTaskEditModalOptions) => {
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

  const handleSaveTask = (form: TaskForm) => {
    if (editingTask.value) {
      updateTask(editingTask.value.id, form)
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

  return {
    editingTask,
    isEditModalOpen,
    editSourceWidth,
    handleEditTask,
    handleModalOpenChange,
    handleSaveTask,
  }
}
