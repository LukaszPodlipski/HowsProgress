const isActive = ref(false)
const addElementMenuOpen = ref(false)
const expandedTaskId = ref<string | null>(null)
const editTaskId = ref<string | null>(null)

export const useProductTourPresentation = () => {
  const setActive = (active: boolean) => {
    isActive.value = active
    if (!active) reset()
  }

  const reset = () => {
    addElementMenuOpen.value = false
    expandedTaskId.value = null
    editTaskId.value = null
  }

  const openAddElementMenu = () => {
    addElementMenuOpen.value = true
  }

  const closeAddElementMenu = () => {
    addElementMenuOpen.value = false
  }

  const expandTask = (taskId: string) => {
    editTaskId.value = null
    expandedTaskId.value = taskId
  }

  const closeExpandedTask = () => {
    expandedTaskId.value = null
  }

  const openEdit = (taskId: string) => {
    expandedTaskId.value = null
    editTaskId.value = taskId
  }

  const closeModals = () => {
    expandedTaskId.value = null
    editTaskId.value = null
  }

  return {
    isActive: readonly(isActive),
    addElementMenuOpen,
    expandedTaskId,
    editTaskId,
    setActive,
    reset,
    openAddElementMenu,
    closeAddElementMenu,
    expandTask,
    closeExpandedTask,
    openEdit,
    closeModals,
  }
}
