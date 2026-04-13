<template>
  <NuxtLink :to="`/gallery/${work.id}`" class="block">
    <UCard :ui="{ body: 'p-2!' }">
      <LoadingImage v-if="work.images[0]?.url" :src="work.images[0].url" />
      <div v-else class="bg-muted flex items-center justify-center aspect-square">
        <Icon name="lucide:image-off" size="40" />
      </div>
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';

const { work } = defineProps<{
  work: Pick<RouterOutput['work']['list'][number], 'id' | 'images'>;
}>();
</script>
