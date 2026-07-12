import { isTauriRuntime } from '@/lib/tauriRuntime'

export interface DesktopDownloadInfo {
  version: string
  url: string
  filename: string
  publishedAt: string
}

const downloadInfo = ref<DesktopDownloadInfo | null>(null)
const isLoading = ref(false)
const hasLoaded = ref(false)

export const useDesktopDownload = () => {
  const { t } = useI18n()

  const isAvailable = computed(() => Boolean(downloadInfo.value?.url))

  const downloadLabel = computed(() => {
    const version = downloadInfo.value?.version
    if (!version) {
      return t('download.desktop')
    }

    return t('download.desktopWithVersion', { version })
  })

  const loadDownloadInfo = async (): Promise<void> => {
    if (!import.meta.client || isTauriRuntime() || hasLoaded.value || isLoading.value) {
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

      const data = (await response.json()) as Partial<DesktopDownloadInfo>
      if (typeof data.url === 'string' && data.url.length > 0) {
        downloadInfo.value = {
          version: data.version ?? '',
          url: data.url,
          filename: data.filename ?? '',
          publishedAt: data.publishedAt ?? '',
        }
      }
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
    downloadInfo,
    isAvailable,
    isLoading,
    downloadLabel,
    loadDownloadInfo,
  }
}
