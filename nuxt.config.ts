import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['shadcn-nuxt', '@nuxt/eslint', '@nuxt/image', '@nuxt/icon'],
  compatibilityDate: '2024-04-03',
  ssr: false,

  app: {
    head: {
      title: "How's progress?",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  css: ['@/assets/css/tailwind.css', '@/assets/css/scroll-list.css', 'vue-sonner/style.css'],

  vite: {
    plugins: [tailwindcss()],
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
})
