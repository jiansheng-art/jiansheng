<template>
  <UPageCard
    :title="work.title"
    :description="work.description"
    orientation="vertical"
    reverse
    :ui="{
      container: 'p-0!',
      wrapper: 'px-4! pt-4 lg:pt-0 lg:pb-4',
    }"
  >
    <UCarousel
      v-if="work.images.length > 1"
      v-slot="{ item }"
      loop
      arrows
      :prev="{ variant: 'soft' }"
      :next="{ variant: 'soft' }"
      :items="work.images"
      :ui="{
        container: '',
        prev: 'sm:start-8',
        next: 'sm:end-8',
      }"
    >
      <NuxtImg :src="item.url" class="w-full object-cover" />
    </UCarousel>
    <NuxtImg v-else-if="work.images[0]?.url" :src="work.images[0].url" class="w-full object-cover" />
    <div v-else class="bg-muted flex items-center justify-center h-60">
      <Icon name="lucide:image-off" size="40" />
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';

defineProps<{
  work: RouterOutput['work']['list'][0];
}>();
</script>
