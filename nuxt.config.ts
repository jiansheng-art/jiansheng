// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

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

  studio: {
    i18n: {
      defaultLocale: 'zh',
    },
    repository: {
      provider: 'github',
      owner: 'jiansheng-art',
      repo: 'jiansheng',
      branch: 'main',
    },
  },

  content: {
    experimental: {
      nativeSqlite: true,
      sqliteConnector: 'native',
    },
  },

  compatibilityDate: '2025-12-14',
});
