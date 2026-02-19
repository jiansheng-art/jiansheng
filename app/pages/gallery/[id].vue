<template>
  <div>
    <UButton
      to="/gallery"
      variant="link"
      color="neutral"
      icon="lucide:arrow-left"
      class="mb-4 px-0"
    >
      Back to gallery
    </UButton>

    <div v-if="status === 'pending'" class="grid gap-8 md:grid-cols-5">
      <USkeleton class="aspect-square w-full md:col-span-3" />
      <USkeleton class="w-full md:col-span-2" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      title="Failed to load this work"
      description="Please try again later."
    />

    <UAlert
      v-else-if="!work"
      color="neutral"
      variant="soft"
      title="Work not found"
      description="This gallery item does not exist or has been removed."
    />

    <div v-else class="grid gap-8 md:grid-cols-5">
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
          <NuxtImg :src="item.url" class="w-full object-cover" />
        </UCarousel>

        <NuxtImg
          v-else-if="work.images[0]?.url"
          :src="work.images[0].url"
          class="w-full object-cover"
        />

        <div v-else class="bg-muted flex h-105 items-center justify-center">
          <Icon name="lucide:image-off" size="40" />
        </div>
      </div>

      <UCard class="h-min md:col-span-2">
        <h1 class="pb-3 text-4xl font-extrabold font-sc-serif">
          {{ work.title }}
        </h1>

        <p v-if="work.titleEnglish" class="pb-3 text-muted font-latin-text-serif">
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

const {
  data: work,
  status,
  error,
} = useQuery({
  key: ['work.get', workId],
  query: () => $trpc.work.get.query({ id: workId }),
});

useHead({
  title: work.value ? `${work.value.title}` : 'Gallery Item',
});
</script>
