<template>
  <Analytics />
  <SpeedInsights />
  <UApp>
    <NuxtLoadingIndicator :color="false" class="z-100 bg-primary" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt';
import { SpeedInsights } from '@vercel/speed-insights/nuxt';

useSeoMeta({
  titleTemplate: (title?: string) => !title ? 'ZhangJiansheng Art' : `${title} | ZhangJiansheng Art`,
  ogImage: '/hero.jpg',
});
</script>
