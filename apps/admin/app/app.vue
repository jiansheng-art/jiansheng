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
  titleTemplate: (title?: string) => !title ? '管理 JianshengArt' : `${title} | 管理 JianshengArt`,
});
</script>
