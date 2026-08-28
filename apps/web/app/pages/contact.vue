<template>
  <ContentContact>
    <MarkdownViewer :markdown="pageContent?.markdown || ''" />
  </ContentContact>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query';

const { $orpc } = useNuxtApp();
const queryClient = useQueryClient();

const pageContentQuery = $orpc.pageContent.getBySlug.queryOptions({ input: { slug: 'contact' } });
if (import.meta.server) {
  await queryClient.prefetchQuery(pageContentQuery);
}
const { data: pageContent } = useQuery(pageContentQuery);

useSeoMeta({
  title: pageContent.value?.title || 'Contact',
  description:
    pageContent.value?.description ||
    'Get in touch with Zhang Jiansheng Art for inquiries and collaborations.',
});
</script>
