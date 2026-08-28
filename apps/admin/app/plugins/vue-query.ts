import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

export default defineNuxtPlugin({
  name: 'vue-query',
  enforce: 'pre',
  setup(nuxt) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    });

    nuxt.vueApp.use(VueQueryPlugin, { queryClient });
  },
});
