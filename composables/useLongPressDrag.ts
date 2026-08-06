export type LongPressPoint = {
  clientX: number
  clientY: number
}

type UseLongPressDragOptions = {
  delayMs?: number
  moveCancelPx?: number
  /** CSS selector for targets that should not start a long-press drag */
  ignoreSelector?: string
  onArm: (id: string, point: LongPressPoint) => void
  onMove: (id: string, point: LongPressPoint) => void
  onRelease: (id: string, point: LongPressPoint) => void
  onCancel?: () => void
}

const DEFAULT_DELAY_MS = 150
const DEFAULT_MOVE_CANCEL_PX = 10
const DEFAULT_IGNORE_SELECTOR =
  'button, a, input, textarea, select, label, [role="menuitem"], [data-no-long-press]'

/**
 * Long-press then drag via pointer events (mouse + touch).
 * HTML5 DnD cannot reliably start from a delayed press, so this is pointer-based.
 */
export const useLongPressDrag = ({
  delayMs = DEFAULT_DELAY_MS,
  moveCancelPx = DEFAULT_MOVE_CANCEL_PX,
  ignoreSelector = DEFAULT_IGNORE_SELECTOR,
  onArm,
  onMove,
  onRelease,
  onCancel,
}: UseLongPressDragOptions) => {
  const activeId = ref<string | null>(null)
  /** Item currently being pressed (pending long-press or already armed). */
  const pressingId = ref<string | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingId: string | null = null
  let startX = 0
  let startY = 0
  let pointerId: number | null = null
  let captureEl: HTMLElement | null = null
  let suppressClick = false

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const removeWindowListeners = () => {
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp)
    window.removeEventListener('pointercancel', onWindowPointerUp)
  }

  const releaseCapture = () => {
    if (captureEl && pointerId !== null) {
      try {
        if (captureEl.hasPointerCapture(pointerId)) {
          captureEl.releasePointerCapture(pointerId)
        }
      } catch {
        // ignore
      }
    }
    captureEl = null
  }

  const resetGesture = () => {
    clearTimer()
    pendingId = null
    pressingId.value = null
    pointerId = null
    releaseCapture()
    removeWindowListeners()
    document.documentElement.classList.remove('is-long-press-dragging')
  }

  const cancelPending = () => {
    const wasArmed = activeId.value !== null
    clearTimer()
    pendingId = null
    pressingId.value = null
    if (wasArmed) {
      activeId.value = null
      onCancel?.()
    }
    releaseCapture()
    removeWindowListeners()
    document.documentElement.classList.remove('is-long-press-dragging')
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (pointerId !== null && e.pointerId !== pointerId) return

    if (activeId.value) {
      e.preventDefault()
      onMove(activeId.value, { clientX: e.clientX, clientY: e.clientY })
      return
    }

    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.hypot(dx, dy) > moveCancelPx) {
      clearTimer()
      pendingId = null
      pressingId.value = null
      removeWindowListeners()
    }
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (pointerId !== null && e.pointerId !== pointerId) return

    const id = activeId.value
    if (id) {
      suppressClick = true
      onRelease(id, { clientX: e.clientX, clientY: e.clientY })
      activeId.value = null
      resetGesture()
      return
    }

    clearTimer()
    pendingId = null
    pressingId.value = null
    pointerId = null
    removeWindowListeners()
  }

  const onPointerDown = (id: string, e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if ((e.target as Element | null)?.closest?.(ignoreSelector)) return

    clearTimer()
    if (activeId.value) {
      activeId.value = null
      onCancel?.()
      releaseCapture()
    }
    removeWindowListeners()

    pendingId = id
    pressingId.value = id
    startX = e.clientX
    startY = e.clientY
    pointerId = e.pointerId
    captureEl = e.currentTarget as HTMLElement

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false })
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)

    timer = setTimeout(() => {
      if (pendingId !== id) return
      activeId.value = id
      suppressClick = true
      document.documentElement.classList.add('is-long-press-dragging')
      try {
        captureEl?.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      onArm(id, { clientX: startX, clientY: startY })
    }, delayMs)
  }

  /** Use on the drag root with @click.capture to block the click after a drag. */
  const onClickCapture = (e: MouseEvent) => {
    if (!suppressClick) return
    e.preventDefault()
    e.stopPropagation()
    suppressClick = false
  }

  onUnmounted(() => {
    clearTimer()
    releaseCapture()
    removeWindowListeners()
    document.documentElement.classList.remove('is-long-press-dragging')
  })

  return {
    activeId,
    pressingId,
    onPointerDown,
    onClickCapture,
    cancel: cancelPending,
  }
}
