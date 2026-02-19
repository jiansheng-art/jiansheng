<template>
  <NuxtLink :to="`/gallery/${work.id}`" class="block">
    <UCard :ui="{ body: 'p-2!' }">
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
          prev: 'sm:start-2',
          next: 'sm:end-2',
        }"
      >
        <NuxtImg :src="item.url" class="object-cover w-full h-full aspect-square" />
      </UCarousel>
      <NuxtImg
        v-else-if="work.images[0]?.url" :src="work.images[0].url"
        class="object-cover w-full h-full aspect-square"
      />
      <div v-else class="bg-muted flex items-center justify-center aspect-square">
        <Icon name="lucide:image-off" size="40" />
      </div>
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';

const { work } = defineProps<{
  work: RouterOutput['work']['list'][0];
}>();
</script>
