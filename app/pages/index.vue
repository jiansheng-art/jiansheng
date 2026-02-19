<template>
  <div class="-mt-[calc(var(--ui-header-height)+20px)] z-20 px-5 lg:px-10 xl:px-15 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 lg:gap-10 xl:gap-15">
    <HomeWorkDisplay
      v-for="(item, index) in works"
      :key="item.id"
      :work="item"
      :class="[index === 2 ? 'hidden md:block' : '', index === 3 ? 'hidden lg:block' : '', index >= 4 ? 'hidden xl:block' : '']"
    />
  </div>

  <UPageHero
    title="张间生"
    description="Jiansheng Zhang"
    :ui="{
      header: 'font-sc-serif font-extrabold',
      description: 'font-latin-serif',
    }"
  />
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

definePageMeta({
  layout: 'home',
});

const {
  data: works,
} = useQuery({
  key: ['work.listHome'],
  query: () => $trpc.work.listHome.query(),
});
</script>
