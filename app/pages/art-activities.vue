<template>
  <UChangelogVersions
    :versions="versions"
    :indicator-motion="false"
  />
</template>

<script setup lang="ts">
import type { ChangelogVersionProps } from '@nuxt/ui';

const versions = ref<ChangelogVersionProps[]>([
  {
    title: 'Early Works',
    description: 'A collection of early works by Jiansheng Zhang, showcasing his artistic journey and development.',
    image: 'https://nuxt.com/assets/blog/v3.17.png',
    ui: {
      container: 'max-w-2xl',
    },
  },
]);
</script>
