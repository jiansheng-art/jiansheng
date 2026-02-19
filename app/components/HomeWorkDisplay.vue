<template>
  <div class="pointer-events-none">
    <div class="border-x border-neutral-200 mx-5 md:mx-10 h-[32svh]" />
    <UCard :ui="{ body: 'p-2!' }">
      <NuxtImg
        v-if="work.images[0]?.url"
        :src="work.images[0].url"
        class="object-cover w-full h-full aspect-square"
      />
      <div v-else class="bg-muted flex items-center justify-center aspect-square">
        <Icon name="lucide:image-off" size="40" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';

const { work } = defineProps<{
  work: RouterOutput['work']['list'][0];
}>();
</script>
