export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return
  }

  document.addEventListener('click', event => {
    const anchor = (event.target as HTMLElement | null)?.closest('a[href]')
    if (!(anchor instanceof HTMLAnchorElement)) return
    if (!anchor.href || anchor.href.startsWith('javascript:')) return

    const opensExternally =
      anchor.target === '_blank' ||
      anchor.origin !== window.location.origin ||
      anchor.hasAttribute('download')

    if (!opensExternally) return

    event.preventDefault()

    void import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl(anchor.href))
  })
})
