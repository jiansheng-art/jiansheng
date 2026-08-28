<template>
  <UChangelogVersions :indicator-motion="false">
    <UChangelogVersion
      v-for="activity in activities"
      :key="activity.id"
      :title="activity.title"
      :date="activity.date ? new Date(activity.date).toLocaleDateString('en-US') : undefined"
      :image="activity.images[0]?.url ?? ''"
      :ui="{ image: 'p-2 border border-default' }"
    >
      <template #body>
        <MarkdownViewer v-if="activity.markdown" :markdown="activity.markdown" />
      </template>
    </UChangelogVersion>
  </UChangelogVersions>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query';

const { $orpc } = useNuxtApp();
const queryClient = useQueryClient();

const activitiesQuery = $orpc.artActivity.list.queryOptions();
if (import.meta.server) {
  await queryClient.prefetchQuery(activitiesQuery);
}
const { data: activities } = useQuery(activitiesQuery);
</script>
