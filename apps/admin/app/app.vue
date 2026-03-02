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
  titleTemplate: (title?: string) => !title ? 'ZhangJiansheng Art' : `${title} | ZhangJiansheng Art`,
  ogImage: '/hero.jpg',
});
</script>
