// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },

  ssr: false,

  modules: ['@nuxt/ui', '@nuxtjs/mdc', '@vueuse/nuxt', '@nuxt/image'],

  css: ['~/assets/css/main.css'],

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },

  compatibilityDate: '2025-12-14',
});
