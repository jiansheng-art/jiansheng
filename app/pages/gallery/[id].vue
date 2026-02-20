<template>
  <div>
    <UButton
      :to="`/gallery/series/${work?.seriesId}`"
      variant="link"
      color="neutral"
      icon="lucide:arrow-left"
      class="mb-4 px-0"
    >
      Back to series
    </UButton>

    <div v-if="!imagesReady && !error" class="flex items-center justify-center py-32">
      <div class="loading-spinner" />
    </div>

    <UEmpty
      v-if="error"
      icon="lucide:triangle-alert"
      title="Failed to load this work"
      variant="naked"
      description="Please try again later."
    />

    <UEmpty
      v-else-if="imagesReady && !work"
      icon="lucide:file-x"
      title="Work not found"
      variant="naked"
      description="This gallery item does not exist or has been removed."
    />

    <div v-else-if="work" :class="{ 'opacity-0': !imagesReady, 'animate-fade-in': imagesReady }" class="grid gap-8 md:grid-cols-5">
      <div class="md:col-span-3">
        <UCarousel
          v-if="work.images.length > 1"
          v-slot="{ item }"
          loop
          arrows
          :prev="{ variant: 'soft' }"
          :next="{ variant: 'soft' }"
          :items="work.images"
          :ui="{
            container: '',
            prev: 'sm:start-4',
            next: 'sm:end-4',
          }"
        >
          <NuxtImg :src="item.url" class="w-full object-cover" @load="onImageLoaded" />
        </UCarousel>

        <NuxtImg
          v-else-if="work.images[0]?.url"
          :src="work.images[0].url"
          class="w-full object-cover"
          @load="onImageLoaded"
        />

        <div v-else class="bg-muted flex h-105 items-center justify-center">
          <Icon name="lucide:image-off" size="40" />
        </div>
      </div>

      <UCard class="h-min md:col-span-2">
        <h1 class="pb-3 text-4xl font-extrabold font-sc-serif">
          {{ work.title }}
        </h1>

        <p v-if="work.titleEnglish" class="pb-3 text-muted text-xl font-latin-text-serif">
          {{ work.titleEnglish }}
        </p>

        <p v-if="work.description" class="text-sm text-muted">
          {{ work.description }}
        </p>

        <dl class="mt-5 space-y-2 text-md text-muted">
          <div v-if="work.year">
            <dt class="font-medium text-toned">
              Year
            </dt>
            <dd>{{ work.year }}</dd>
          </div>
          <div v-if="work.material">
            <dt class="font-medium text-toned">
              Material
            </dt>
            <dd>{{ work.material }}</dd>
          </div>
          <div v-if="work.dimensions">
            <dt class="font-medium text-toned">
              Dimensions
            </dt>
            <dd>{{ work.dimensions }}</dd>
          </div>
        </dl>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { $trpc } = useNuxtApp();

const workId = Number(route.params.id);

if (!Number.isInteger(workId) || workId <= 0) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' });
}

const imagesReady = ref(false);
const loadedCount = ref(0);

const {
  data: work,
  error,
} = useQuery({
  key: ['work.get', workId],
  query: () => $trpc.work.get.query({ id: workId }),
});

function onImageLoaded() {
  loadedCount.value++;
  if (!work.value)
    return;
  // For carousel: wait for all images; for single: 1 is enough
  const total = work.value.images.length;
  if (loadedCount.value >= total) {
    imagesReady.value = true;
  }
}

// Handle works with no images
watch(work, (val) => {
  if (val && val.images.length === 0) {
    imagesReady.value = true;
  }
}, { immediate: true });

// Safety timeout
onMounted(() => {
  setTimeout(() => {
    imagesReady.value = true;
  }, 10000);
});

useHead({
  title: work.value ? `${work.value.title}` : 'Gallery Item',
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

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
