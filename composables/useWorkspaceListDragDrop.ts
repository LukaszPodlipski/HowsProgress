import { useLongPressDrag } from '@/composables/useLongPressDrag'
import type { Workspace } from '@/types'
import type { Ref } from 'vue'

type UseWorkspaceListDragDropOptions = {
  workspaces: Ref<readonly Workspace[]>
  workspaceRefs: Ref<Map<string, HTMLElement>>
  reorderWorkspaces: (orderedWorkspaces: Workspace[]) => Promise<void>
}

export const useWorkspaceListDragDrop = ({
  workspaces,
  workspaceRefs,
  reorderWorkspaces,
}: UseWorkspaceListDragDropOptions) => {
  const draggedWsId = ref<string | null>(null)
  /** Index in the current list where the drop indicator should appear (0..length). */
  const dropIndicatorIndex = ref<number | null>(null)

  const resolveInsertBefore = (overIndex: number, clientY: number, el: HTMLElement): number => {
    const rect = el.getBoundingClientRect()
    const insertAfter = clientY >= rect.top + rect.height / 2
    return insertAfter ? overIndex + 1 : overIndex
  }

  const wouldReorder = (fromIndex: number, insertBefore: number): boolean => {
    const newIndex = fromIndex < insertBefore ? insertBefore - 1 : insertBefore
    return newIndex !== fromIndex
  }

  const resolveDropIndicatorAtPoint = (clientX: number, clientY: number) => {
    const draggedId = draggedWsId.value
    if (!draggedId) {
      dropIndicatorIndex.value = null
      return
    }

    const el = document.elementFromPoint(clientX, clientY)
    const itemEl = el?.closest('[data-workspace-drop-id]') as HTMLElement | null
    const overId = itemEl?.dataset.workspaceDropId
    if (!overId || overId === draggedId) {
      dropIndicatorIndex.value = null
      return
    }

    const list = workspaces.value
    const fromIndex = list.findIndex(ws => ws.id === draggedId)
    const overIndex = list.findIndex(ws => ws.id === overId)
    if (fromIndex === -1 || overIndex === -1) {
      dropIndicatorIndex.value = null
      return
    }

    const refEl = workspaceRefs.value.get(overId)
    if (!refEl) return

    const insertBefore = resolveInsertBefore(overIndex, clientY, refEl)
    dropIndicatorIndex.value = wouldReorder(fromIndex, insertBefore) ? insertBefore : null
  }

  const commitDrop = async () => {
    const draggedId = draggedWsId.value
    const insertBefore = dropIndicatorIndex.value
    if (!draggedId || insertBefore === null) return

    const list = [...workspaces.value]
    const fromIndex = list.findIndex(ws => ws.id === draggedId)
    if (fromIndex === -1 || !wouldReorder(fromIndex, insertBefore)) return

    const [moved] = list.splice(fromIndex, 1)
    if (!moved) return

    const toIndex = fromIndex < insertBefore ? insertBefore - 1 : insertBefore
    list.splice(toIndex, 0, moved)

    await reorderWorkspaces(list)
  }

  const finishDrag = () => {
    draggedWsId.value = null
    dropIndicatorIndex.value = null
  }

  const { onPointerDown, onClickCapture, pressingId } = useLongPressDrag({
    // Sidebar row itself is a <button>; only skip explicit no-drag controls (e.g. ⋯ menu).
    ignoreSelector: 'a, input, textarea, select, [data-no-long-press], [role="menuitem"]',
    onArm: id => {
      draggedWsId.value = id
    },
    onMove: (_id, point) => {
      resolveDropIndicatorAtPoint(point.clientX, point.clientY)
    },
    onRelease: async () => {
      await commitDrop()
      finishDrag()
    },
    onCancel: finishDrag,
  })

  return {
    draggedWsId,
    pressingId,
    dropIndicatorIndex,
    onPointerDown,
    onClickCapture,
  }
}
