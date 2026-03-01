// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/mdc',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxtjs/seo',
  ],

  imports: {
    presets: [
      {
        from: '@tanstack/vue-query',
        imports: ['useMutation', 'useQuery', 'useQueryClient'],
      },
    ],
  },

  ogImage: {
    enabled: false,
  },

  css: ['~/assets/css/main.css'],

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },

  build: {
    transpile: ['trpc-nuxt'],
  },

  robots: {
    disallow: ['/'],
  },

  site: {
    name: 'Jiansheng Art Admin',
    url: 'https://admin.jiansheng.art',
    indexable: false,
  },

  compatibilityDate: '2025-12-14',
});
