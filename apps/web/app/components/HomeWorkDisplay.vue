<template>
  <div>
    <div class="border-x border-default mx-5 md:mx-10 h-[calc(32svh+200px)]" />
    <NuxtLink :to="`/gallery/${work.id}`" class="block">
      <UCard :ui="{ body: 'p-2!' }">
        <NuxtImg
          :src="work.src"
          class="relative object-cover w-full h-full"
          loading="eager"
          preload
        />
      </UCard>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { work } = defineProps<{
  work: { id: string; src: string };
}>();
</script>
