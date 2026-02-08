<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <WorkCard v-for="item in works" :key="item.id" :work="item" />
  </div>
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

const {
  data: works,
} = useQuery({
  key: ['work.list'],
  query: () => $trpc.work.list.query(),
});
</script>
