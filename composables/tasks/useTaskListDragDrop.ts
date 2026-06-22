import type { DropPlacement, DropTarget } from '@/composables/tasks/taskListDragDrop.types'
import { getGroupKey, sortTasksByDisplayDate } from '@/composables/tasks/taskDateGroups'
import type { Task } from '@/types'
import type { ComputedRef, Ref } from 'vue'

type UseTaskListDragDropOptions = {
  sortedTasks: ComputedRef<Task[]>
  hasSeparatorBefore: (taskIndex: number) => boolean
  taskRefs: Ref<Map<string, HTMLElement>>
  listContainer: Ref<HTMLElement | null>
  reorderTasksOrdered: (
    orderedTasks: Task[],
    movedTaskId: string,
    newDisplayDate?: string
  ) => Promise<void>
  draggedTaskId?: Ref<string | null>
  onDragEnd?: () => void
}

const getDropIndicatorIndex = (insertIndex: number, fromIndex: number): number => {
  if (fromIndex < insertIndex) return insertIndex + 1
  return insertIndex
}

const resolveDropIndicator = (
  rawInsertIndex: number,
  adjustedInsertIndex: number,
  placement: DropPlacement,
  fromIndex: number
): number => {
  if (placement === 'before-separator' || placement === 'after-separator') {
    return rawInsertIndex
  }
  return getDropIndicatorIndex(adjustedInsertIndex, fromIndex)
}

const wouldDropChangeResult = (
  sorted: Task[],
  fromIndex: number,
  target: DropTarget,
  draggedId: string
): boolean => {
  const now = new Date()
  const draggedTask = sorted[fromIndex]
  if (!draggedTask) return false

  const newDisplayDate =
    getGroupKey(draggedTask.displayDate, now) === getGroupKey(target.targetDisplayDate, now)
      ? draggedTask.displayDate
      : target.targetDisplayDate

  const reordered = [...sorted]
  reordered.splice(fromIndex, 1)
  reordered.splice(target.insertIndex, 0, draggedTask)

  const withOrder = reordered.map((task, index) => ({
    ...task,
    order: index,
    ...(task.id === draggedId ? { displayDate: newDisplayDate } : {}),
  }))

  const resorted = sortTasksByDisplayDate(withOrder, now)
  const oldIndex = sorted.findIndex(t => t.id === draggedId)
  const newIndex = resorted.findIndex(t => t.id === draggedId)
  const oldGroup = getGroupKey(draggedTask.displayDate, now)
  const newGroup = getGroupKey(resorted[newIndex]!.displayDate, now)

  return oldIndex !== newIndex || oldGroup !== newGroup
}

export const useTaskListDragDrop = ({
  sortedTasks,
  hasSeparatorBefore,
  taskRefs,
  listContainer,
  reorderTasksOrdered,
  draggedTaskId: draggedTaskIdOption,
  onDragEnd,
}: UseTaskListDragDropOptions) => {
  const draggedTaskId = draggedTaskIdOption ?? ref<string | null>(null)
  const dropTarget = ref<DropTarget | null>(null)

  let autoScrollRaf: number | null = null
  let autoScrollSpeed = 0
  const SCROLL_ZONE = 80
  const MAX_SCROLL_SPEED = 15

  const stopAutoScroll = () => {
    if (autoScrollRaf !== null) {
      cancelAnimationFrame(autoScrollRaf)
      autoScrollRaf = null
    }
    autoScrollSpeed = 0
  }

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

  const resolveDropTargetAtBoundary = (
    sorted: Task[],
    rawInsertIndex: number,
    overSortedIndex: number,
    insertAfter: boolean,
    fromSortedIndex: number
  ): DropTarget | null => {
    let insertIndex = rawInsertIndex
    if (fromSortedIndex < insertIndex) insertIndex -= 1

    let placement: DropPlacement = 'default'
    let targetDisplayDate: string

    if (
      rawInsertIndex > 0 &&
      rawInsertIndex <= sorted.length &&
      hasSeparatorBefore(rawInsertIndex)
    ) {
      if (insertAfter && overSortedIndex === rawInsertIndex - 1) {
        placement = 'before-separator'
        targetDisplayDate = sorted[rawInsertIndex - 1]!.displayDate
      } else if (!insertAfter && overSortedIndex === rawInsertIndex) {
        placement = 'after-separator'
        targetDisplayDate = sorted[rawInsertIndex]!.displayDate
      } else {
        const anchor = sorted[insertIndex] ?? sorted[insertIndex - 1]
        if (!anchor) return null
        targetDisplayDate = anchor.displayDate
      }
    } else {
      const anchor = sorted[insertIndex] ?? sorted[insertIndex - 1]
      if (!anchor) return null
      targetDisplayDate = anchor.displayDate
    }

    const draggedId = draggedTaskId.value
    if (!draggedId) return null

    const candidate: DropTarget = {
      insertIndex,
      targetDisplayDate,
      placement,
      indicatorIndex: resolveDropIndicator(rawInsertIndex, insertIndex, placement, fromSortedIndex),
    }

    if (!wouldDropChangeResult(sorted, fromSortedIndex, candidate, draggedId)) return null

    return candidate
  }

  const resolveDropTargetFromPointer = (
    overSortedIndex: number,
    clientY: number,
    element: HTMLElement
  ): DropTarget | null => {
    if (!draggedTaskId.value) return null

    const sorted = sortedTasks.value
    const fromSortedIndex = sorted.findIndex(t => t.id === draggedTaskId.value)
    if (fromSortedIndex === -1 || overSortedIndex === -1) return null

    const rect = element.getBoundingClientRect()
    const insertAfter = clientY >= rect.top + rect.height / 2
    const rawInsertIndex = insertAfter ? overSortedIndex + 1 : overSortedIndex

    return resolveDropTargetAtBoundary(
      sorted,
      rawInsertIndex,
      overSortedIndex,
      insertAfter,
      fromSortedIndex
    )
  }

  const getDropTargetFromTask = (overTaskId: string, clientY: number): DropTarget | null => {
    if (!draggedTaskId.value || overTaskId === draggedTaskId.value) return null

    const sorted = sortedTasks.value
    const overSortedIndex = sorted.findIndex(t => t.id === overTaskId)
    if (overSortedIndex === -1) return null

    const el = taskRefs.value.get(overTaskId)
    if (!el) return null

    return resolveDropTargetFromPointer(overSortedIndex, clientY, el)
  }

  const getDropTargetFromSeparator = (taskIndex: number, clientY: number, el: HTMLElement) => {
    if (!draggedTaskId.value) return null

    const sorted = sortedTasks.value
    const fromSortedIndex = sorted.findIndex(t => t.id === draggedTaskId.value)
    if (fromSortedIndex === -1 || !hasSeparatorBefore(taskIndex)) return null

    const rect = el.getBoundingClientRect()
    const overBottomHalf = clientY >= rect.top + rect.height / 2

    return resolveDropTargetAtBoundary(
      sorted,
      taskIndex,
      overBottomHalf ? taskIndex : taskIndex - 1,
      overBottomHalf ? false : true,
      fromSortedIndex
    )
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
    requestAnimationFrame(() => {
      draggedTaskId.value = taskId
    })
  }

  const handleDragOver = (taskId: string, event: DragEvent) => {
    updateAutoScroll(event)
    dropTarget.value = getDropTargetFromTask(taskId, event.clientY)
  }

  const handleSeparatorDragOver = (taskIndex: number, event: DragEvent) => {
    updateAutoScroll(event)
    dropTarget.value = getDropTargetFromSeparator(
      taskIndex,
      event.clientY,
      event.currentTarget as HTMLElement
    )
  }

  const handleDrop = () => {
    const draggedId = draggedTaskId.value
    const target = dropTarget.value
    if (!draggedId || !target) return

    const sorted = sortedTasks.value
    const fromSortedIndex = sorted.findIndex(t => t.id === draggedId)
    if (fromSortedIndex === -1) return

    const draggedTask = sorted[fromSortedIndex]!
    const now = new Date()
    const newDisplayDate =
      getGroupKey(draggedTask.displayDate, now) === getGroupKey(target.targetDisplayDate, now)
        ? undefined
        : target.targetDisplayDate

    const reordered = [...sorted]
    reordered.splice(fromSortedIndex, 1)
    reordered.splice(target.insertIndex, 0, draggedTask)

    reorderTasksOrdered(reordered, draggedTask.id, newDisplayDate)
  }

  const handleDragEnd = () => {
    draggedTaskId.value = null
    dropTarget.value = null
    stopAutoScroll()
    onDragEnd?.()
  }

  onUnmounted(() => {
    stopAutoScroll()
  })

  return {
    draggedTaskId,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleSeparatorDragOver,
    handleDrop,
    handleDragEnd,
    updateAutoScroll,
  }
}
