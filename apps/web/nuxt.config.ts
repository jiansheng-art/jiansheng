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
    '@vercel/speed-insights',
    '@vercel/analytics',
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

  site: {
    name: 'Jiansheng Art',
    url: 'https://jiansheng.art',
    indexable: true,
  },

  compatibilityDate: '2025-12-14',
});
