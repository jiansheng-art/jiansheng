<template>
  <div>
    <div class="border-x border-neutral-200 mx-5 md:mx-10 h-[calc(32svh+200px)]" />
    <NuxtLink :to="`/gallery/${work.id}`" class="block">
      <UCard :ui="{ body: 'p-2!' }">
        <div v-if="work.images[0]?.url" class="relative w-full">
          <USkeleton v-if="!imageLoaded" class="absolute inset-0 w-full h-full" />
          <NuxtImg
            :src="work.images[0].url"
            class="object-cover w-full h-full transition-opacity duration-500 ease-in-out"
            :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
            @load="imageLoaded = true; $emit('loaded')"
          />
        </div>
        <div v-else class="bg-muted flex items-center justify-center ">
          <Icon name="lucide:image-off" size="40" />
        </div>
      </UCard>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';

const { work } = defineProps<{
  work: RouterOutput['work']['list'][0];
}>();

defineEmits<{
  loaded: [];
}>();

const imageLoaded = ref(false);
</script>
