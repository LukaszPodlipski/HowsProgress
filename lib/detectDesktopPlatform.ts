export type DesktopPlatform = 'windows' | 'macos'

export const detectDesktopPlatform = (): DesktopPlatform | null => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null
  }

  const platform = navigator.platform ?? ''
  const userAgent = navigator.userAgent ?? ''

  if (/Win/i.test(platform) || /Windows/i.test(userAgent)) {
    return 'windows'
  }

  if (/Mac/i.test(platform) || /Macintosh|Mac OS X/i.test(userAgent)) {
    return 'macos'
  }

  return null
}
