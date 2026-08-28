<template>
  <div class="py-6">
    <MarkdownViewer :markdown="pageContent?.markdown || ''" />
  </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query';

const { $orpc } = useNuxtApp();
const queryClient = useQueryClient();

const pageContentQuery = $orpc.pageContent.getBySlug.queryOptions({ input: { slug: 'about' } });
if (import.meta.server) {
  await queryClient.prefetchQuery(pageContentQuery);
}
const { data: pageContent } = useQuery(pageContentQuery);

useSeoMeta({
  title: pageContent.value?.title || 'About',
  description:
    pageContent.value?.description || 'Learn more about Zhang Jiansheng and his art practice.',
});
</script>
