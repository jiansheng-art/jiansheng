<template>
  <div class="py-6">
    <MarkdownViewer :markdown="pageContent?.markdown || ''" />
  </div>
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

const { data: pageContent } = await useAsyncData('page-content-about', () =>
  $trpc.pageContent.getBySlug.query({ slug: 'about' }));

useSeoMeta({
  title: pageContent.value?.title || 'About',
  description: pageContent.value?.description || 'Learn more about Zhang Jiansheng and his art practice.',
});
</script>
