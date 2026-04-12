<template>
  <ContentContact>
    <MarkdownViewer :markdown="pageContent?.markdown || ''" />
  </ContentContact>
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

const { data: pageContent } = await $trpc.pageContent.getBySlug.useQuery({ slug: 'contact' });

useSeoMeta({
  title: pageContent.value?.title || 'Contact',
  description: pageContent.value?.description || 'Get in touch with Zhang Jiansheng Art for inquiries and collaborations.',
});
</script>
