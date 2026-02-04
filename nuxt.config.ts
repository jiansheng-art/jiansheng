// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    '@pinia/colada-nuxt',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxtjs/seo',
    'nuxt-studio',
  ],

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

  site: {
    name: 'ZhangJiansheng Art',
    url: 'https://jiansheng.art',
    indexable: true,
  },

  // studio: {
  //   repository: {
  //     provider: 'github',
  //     owner: ''
  //   }
  // },

  compatibilityDate: '2025-12-14',
});
