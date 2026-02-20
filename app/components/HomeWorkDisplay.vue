<template>
  <div>
    <div class="border-x border-neutral-200 mx-5 md:mx-10 h-[calc(32svh+200px)]" />
    <NuxtLink :to="`/gallery/${work.id}`" class="block">
      <UCard :ui="{ body: 'p-2!' }">
        <NuxtImg
          v-if="work.images[0]?.url"
          :src="work.images[0].url"
          class="object-cover w-full h-full "
          @load="$emit('loaded')"
        />
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
</script>
