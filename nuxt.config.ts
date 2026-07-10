import tailwindcss from '@tailwindcss/vite'

const isTauriBuild =
  process.env.TAURI_ENV_PLATFORM !== undefined || process.env.NUXT_APP_BASE_URL === './'

const publicAsset = (file: string) => `${isTauriBuild ? './' : '/'}${file}`

export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },

  runtimeConfig: {
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      googleClientId: '',
      googleClientSecret: '',
    },
  },
  modules: ['shadcn-nuxt', '@nuxt/eslint', '@nuxt/image', '@nuxt/icon', '@nuxtjs/i18n'],
  compatibilityDate: '2024-04-03',
  ssr: false,

  // Force static output — Netlify auto-detects netlify-legacy, which breaks SPA deploys.
  nitro: {
    preset: 'static',
  },

  app: {
    baseURL: isTauriBuild ? './' : '/',
    head: {
      title: "So How's progress?",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: publicAsset('favicon.png') },
        { rel: 'icon', type: 'image/x-icon', href: publicAsset('favicon.ico') },
      ],
    },
  },

  css: [
    '@/assets/css/tailwind.css',
    '@/assets/css/scroll-list.css',
    '@/assets/css/product-tour.css',
    'vue-sonner/style.css',
  ],

  vite: {
    server: {
      strictPort: true,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: tailwindcss() as any,
    // TS2322: @tailwindcss/vite and Nuxt resolve different copies of rollup,
    // causing incompatible Plugin<any> types (PluginContextMeta.viteVersion mismatch).
    // Cast is safe — no runtime impact.
  },

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '~/components/ui',
  },

  image: {
    dir: 'assets/images',
  },

  icon: {
    mode: 'css',
    cssLayer: 'base',
  },

  i18n: {
    defaultLocale: 'pl',
    locales: [{ code: 'pl', language: 'pl-PL', file: 'pl.json' }],
    langDir: 'locales',
    restructureDir: 'i18n',
  },
})
