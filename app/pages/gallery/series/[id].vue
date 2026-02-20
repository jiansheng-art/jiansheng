<template>
  <UButton
    to="/gallery"
    variant="link"
    color="neutral"
    icon="lucide:arrow-left"
    class="mb-6 px-0"
  >
    Back to gallery
  </UButton>

  <UEmpty
    v-if="error"
    icon="lucide:triangle-alert"
    title="Failed to load this series"
    variant="naked"
    description="Please try again later."
  />

  <UEmpty
    v-else-if="!series"
    icon="lucide:folder-x"
    title="Series not found"
    variant="naked"
    description="This exhibition does not exist or has been removed."
    :class="{ 'opacity-0': status === 'pending' }"
  />

  <div v-else :class="{ 'opacity-0': status === 'pending', 'animate-fade-in': status !== 'pending' }" class="flex flex-col gap-12">
    <div>
      <h2 class="mt-3 mb-3 text-4xl md:text-6xl font-extrabold font-sc-serif">
        {{ series.title }}
      </h2>
      <p v-if="series.titleEnglish" class="text-muted text-xl font-latin-serif font-semibold">
        {{ series.titleEnglish }}
      </p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <WorkCard v-for="item in series.works" :key="item.id" :work="item" />
    </div>

    <div v-if="series.description">
      <p class="text-lg font-bold">
        Work Introduction
      </p>
      <p class="text-muted">
        {{ series.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { $trpc } = useNuxtApp();

const seriesId = Number(route.params.id);

if (!Number.isInteger(seriesId) || seriesId <= 0) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' });
}

const {
  data: series,
  status,
  error,
} = useQuery({
  key: ['work.getSeries', seriesId],
  query: () => $trpc.work.getSeries.query({ id: seriesId }),
});

useHead({
  title: series.value ? `${series.value.title}` : 'Exhibition',
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fade-in 0.5s ease forwards;
}
</style>
