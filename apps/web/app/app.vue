<template>
  <UApp>
    <NuxtLoadingIndicator :color="false" class="z-100 bg-primary" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
useSeoMeta({
  titleTemplate: (title?: string) => !title ? 'Jiansheng Art' : `${title} | Jiansheng Art`,
  ogImage: '/hero.jpg',
});
</script>
