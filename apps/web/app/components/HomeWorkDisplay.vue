<template>
  <div>
    <div class="border-x border-default mx-5 md:mx-10 h-[calc(32svh+200px)]" />
    <NuxtLink :to="`/gallery/${work.id}`" class="block">
      <UCard :ui="{ body: 'p-2!' }">
        <NuxtImg
          :src="work.src"
          class="relative object-cover w-full h-full"
          sizes="50vw md:33vw lg:25vw xl:20vw"
          format="webp"
          :loading="loading"
          :preload="preload ? { fetchPriority: 'high' } : false"
        />
      </UCard>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const {
  work,
  preload = false,
  loading = 'lazy',
} = defineProps<{
  work: { id: string; src: string };
  preload?: boolean;
  loading?: 'eager' | 'lazy';
}>();
</script>
