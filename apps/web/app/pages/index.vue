<template>
  <div>
    <div class="-mt-[calc(var(--ui-header-height)+200px+20px)] z-20 px-5 lg:px-10 xl:px-15 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center gap-5 lg:gap-10 xl:gap-15">
      <HomeWorkDisplay
        v-for="(item, index) in works"
        :key="item.id"
        :work="item"
        :class="[index === 2 ? 'hidden md:block' : '', index === 3 ? 'hidden lg:block' : '', index >= 4 ? 'hidden xl:block' : '']"
      />
    </div>

    <UPageHero
      title="張間生"
      description="Jiansheng Zhang"
      :ui="{
        title: 'font-tc-serif font-extrabold sm:text-5xl',
        description: 'font-latin-serif font-extrabold sm:text-lg mt-4',
      }"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'home',
});

const works = [
  {
    id: '1',
    src: '/home/1.jpg',
  },
  {
    id: '2',
    src: '/home/2.jpg',
  },
  {
    id: '3',
    src: '/home/3.jpg',

  },
  {
    id: '4',
    src: '/home/4.jpg',
  },
  {
    id: '5',
    src: '/home/5.jpg',
  },
];
</script>
