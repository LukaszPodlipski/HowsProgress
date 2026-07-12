import { detectDesktopPlatform, type DesktopPlatform } from '@/lib/detectDesktopPlatform'
import { isTauriRuntime } from '@/lib/tauriRuntime'

export interface DesktopDownloadAsset {
  url: string
  filename: string
}

export interface DesktopDownloadManifest {
  version: string
  publishedAt: string
  platforms: Partial<Record<DesktopPlatform, DesktopDownloadAsset>>
}

interface LegacyDesktopDownloadManifest {
  version?: string
  publishedAt?: string
  url?: string
  filename?: string
  platforms?: Partial<Record<DesktopPlatform, DesktopDownloadAsset>>
}

const downloadManifest = ref<DesktopDownloadManifest | null>(null)
const detectedPlatform = ref<DesktopPlatform | null>(null)
const isLoading = ref(false)
const hasLoaded = ref(false)

const normalizeManifest = (data: LegacyDesktopDownloadManifest): DesktopDownloadManifest | null => {
  const platforms: Partial<Record<DesktopPlatform, DesktopDownloadAsset>> = {
    ...data.platforms,
  }

  if (typeof data.url === 'string' && data.url.length > 0) {
    platforms.windows = {
      url: data.url,
      filename: data.filename ?? '',
    }
  }

  if (!platforms.windows?.url && !platforms.macos?.url) {
    return null
  }

  return {
    version: data.version ?? '',
    publishedAt: data.publishedAt ?? '',
    platforms,
  }
}

export const useDesktopDownload = () => {
  const { t } = useI18n()

  const activeDownload = computed(() => {
    const platform = detectedPlatform.value
    const manifest = downloadManifest.value

    if (!platform || !manifest) {
      return null
    }

    return manifest.platforms[platform] ?? null
  })

  const isAvailable = computed(() => Boolean(activeDownload.value?.url))

  const downloadTooltip = computed(() => {
    const version = downloadManifest.value?.version
    if (!version) {
      return t('download.desktop')
    }

    return t('download.desktopVersionTooltip', { version })
  })

  const downloadAriaLabel = computed(() => {
    const version = downloadManifest.value?.version
    const platform = detectedPlatform.value

    if (platform === 'windows') {
      return version
        ? t('download.desktopAriaLabelWindowsWithVersion', { version })
        : t('download.desktopAriaLabelWindows')
    }

    if (platform === 'macos') {
      return version
        ? t('download.desktopAriaLabelMacosWithVersion', { version })
        : t('download.desktopAriaLabelMacos')
    }

    return t('download.desktopAriaLabel')
  })

  const loadDownloadInfo = async (): Promise<void> => {
    if (typeof window === 'undefined' || isTauriRuntime() || hasLoaded.value || isLoading.value) {
      return
    }

    detectedPlatform.value = detectDesktopPlatform()
    if (!detectedPlatform.value) {
      hasLoaded.value = true
      return
    }

    isLoading.value = true

    try {
      const response = await fetch('/downloads/latest.json', {
        cache: 'no-store',
      })

      if (!response.ok) {
        return
      }

      const data = (await response.json()) as LegacyDesktopDownloadManifest
      downloadManifest.value = normalizeManifest(data)
    } catch {
      // Ignore fetch errors and keep the sidebar action hidden.
    } finally {
      isLoading.value = false
      hasLoaded.value = true
    }
  }

  onMounted(() => {
    void loadDownloadInfo()
  })

  return {
    downloadManifest,
    activeDownload,
    detectedPlatform,
    isAvailable,
    isLoading,
    downloadTooltip,
    downloadAriaLabel,
    loadDownloadInfo,
  }
}
