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
    description: 'Nuxt 3.17 is out - bringing a major reworking of the async data layer, a new built-in component, better warnings, and performance improvements!',
    image: 'https://nuxt.com/assets/blog/v3.17.png',
    ui: {
      container: 'max-w-2xl',
    },
  },
]);
</script>
