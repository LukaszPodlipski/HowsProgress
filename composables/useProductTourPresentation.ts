const isActive = ref(false)
const addElementMenuOpen = ref(false)
const previewTaskId = ref<string | null>(null)
const editTaskId = ref<string | null>(null)

export const useProductTourPresentation = () => {
  const setActive = (active: boolean) => {
    isActive.value = active
    if (!active) reset()
  }

  const reset = () => {
    addElementMenuOpen.value = false
    previewTaskId.value = null
    editTaskId.value = null
  }

  const openAddElementMenu = () => {
    addElementMenuOpen.value = true
  }

  const closeAddElementMenu = () => {
    addElementMenuOpen.value = false
  }

  const openPreview = (taskId: string) => {
    editTaskId.value = null
    previewTaskId.value = taskId
  }

  const openEdit = (taskId: string) => {
    previewTaskId.value = null
    editTaskId.value = taskId
  }

  const closeModals = () => {
    previewTaskId.value = null
    editTaskId.value = null
  }

  return {
    isActive: readonly(isActive),
    addElementMenuOpen,
    previewTaskId,
    editTaskId,
    setActive,
    reset,
    openAddElementMenu,
    closeAddElementMenu,
    openPreview,
    openEdit,
    closeModals,
  }
}
