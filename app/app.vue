<template>
  <Analytics />
  <SpeedInsights />
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt';
import { SpeedInsights } from '@vercel/speed-insights/nuxt';

useHeadSafe({
  titleTemplate: (title?: string) => !title ? 'ZhangJiansheng Art' : `${title} | ZhangJiansheng Art`,
});

useSeoMeta({
  ogImage: '/hero.jpg',
});
</script>
