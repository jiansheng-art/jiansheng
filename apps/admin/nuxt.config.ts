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

  compatibilityDate: '2025-12-14',
});
