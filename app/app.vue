<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
useHeadSafe({
  titleTemplate: (title?: string) => !title ? 'ZhangJiansheng Art' : `${title} | ZhangJiansheng Art`,
});

useSeoMeta({
  ogImage: '/hero.jpg',
});
</script>
