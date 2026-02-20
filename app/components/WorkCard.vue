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
        <div class="relative aspect-square w-full">
          <USkeleton v-if="!loadedImages.has(item.url!)" class="absolute inset-0 w-full h-full" />
          <NuxtImg :src="item.url" class="object-cover w-full h-full aspect-square transition-opacity duration-500 ease-in-out" :class="loadedImages.has(item.url!) ? 'opacity-100' : 'opacity-0'" @load="loadedImages.add(item.url!)" />
        </div>
      </UCarousel>
      <div v-else-if="work.images[0]?.url" class="relative aspect-square w-full">
        <USkeleton v-if="!loadedImages.has(work.images[0].url)" class="absolute inset-0 w-full h-full" />
        <NuxtImg
          :src="work.images[0].url"
          class="object-cover w-full h-full aspect-square transition-opacity duration-500 ease-in-out"
          :class="loadedImages.has(work.images[0].url) ? 'opacity-100' : 'opacity-0'"
          @load="loadedImages.add(work.images[0].url)"
        />
      </div>
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

const loadedImages = reactive(new Set<string>());
</script>
