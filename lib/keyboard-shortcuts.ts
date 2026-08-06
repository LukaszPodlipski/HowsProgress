import { shortcutKbdClass } from '@/lib/shortcut-kbd'

export { shortcutKbdClass }

export const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const platform = navigator.platform || ''
  const ua = navigator.userAgent || ''
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS|iPhone|iPad|iPod/i.test(ua)
}

/**
 * Modifier shown in UI for task form shortcuts.
 * Apple uses Control — Option remaps characters and breaks event.key matching.
 */
export const getShortcutModLabel = (): string => (isApplePlatform() ? '⌃' : 'Alt')

/** Spoken/aria form of the task-form modifier. */
export const getShortcutModAriaLabel = (): string => (isApplePlatform() ? 'Control' : 'Alt')

/**
 * Letter from the physical key (`event.code`), not `event.key`.
 * Needed when Option is involved; also keeps layout quirks from breaking Control shortcuts.
 */
export const getLetterFromKeyboardEvent = (event: KeyboardEvent): string | null => {
  const match = /^Key([A-Z])$/.exec(event.code)
  return match?.[1]?.toLowerCase() ?? null
}

/**
 * Task-form shortcut modifier without the other platform's primary mod.
 * - Apple: Control (not Cmd, not Option)
 * - Others: Alt (not Ctrl, not Win)
 */
export const isShortcutModifierPressed = (event: KeyboardEvent): boolean => {
  if (isApplePlatform()) {
    return event.ctrlKey && !event.metaKey && !event.altKey
  }
  return event.altKey && !event.ctrlKey && !event.metaKey
}

export const matchesShortcutLetter = (event: KeyboardEvent, letter: string): boolean => {
  const pressed = getLetterFromKeyboardEvent(event)
  return pressed !== null && pressed === letter.toLowerCase()
}

/** Sidebar toggle: ⌘ on Apple, Ctrl elsewhere — avoids clashing with ⌃B task shortcut on Mac. */
export const isSidebarToggleShortcut = (event: KeyboardEvent, letter: string): boolean => {
  if (!matchesShortcutLetter(event, letter) && event.key.toLowerCase() !== letter.toLowerCase()) {
    return false
  }
  if (event.altKey || event.shiftKey) return false

  if (isApplePlatform()) {
    return event.metaKey && !event.ctrlKey
  }
  return event.ctrlKey && !event.metaKey
}
