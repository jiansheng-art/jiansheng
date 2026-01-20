<template>
  <UScrollArea
    v-slot="{ item }"
    :items="works"
    orientation="vertical"
    :virtualize="{
      gap: 24,
      lanes: 4,
      estimateSize: 480,
    }"
    class="w-full h-[calc(100vh-var(--ui-header-height))] p-px"
  >
    <WorkCard :work="item" />
  </UScrollArea>
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

const {
  data: works,
  refresh,
} = useQuery({
  key: ['users'],
  query: () => $trpc.work.list.query(),
});
</script>
