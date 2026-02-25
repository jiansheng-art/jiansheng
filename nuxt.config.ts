// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    '@pinia/colada-nuxt',
    '@nuxt/image',
    '@nuxtjs/seo',
  ],

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
    allow: ['/'],
    disallow: ['/admin'],
  },

  routeRules: {
    '/admin/**': { robots: false },
  },

  site: {
    name: 'Jiansheng Art',
    url: 'https://jiansheng.art',
    indexable: true,
  },

  compatibilityDate: '2025-12-14',
});
