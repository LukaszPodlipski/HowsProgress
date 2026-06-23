export const isTauriRuntime = (): boolean =>
  import.meta.client && typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
