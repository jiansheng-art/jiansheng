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

    <UEmpty
      v-if="error"
      icon="lucide:triangle-alert"
      title="Failed to load this work"
      variant="naked"
      description="Please try again later."
    />

    <UEmpty
      v-else-if="status === 'success' && !work"
      icon="lucide:file-x"
      title="Work not found"
      variant="naked"
      description="This gallery item does not exist or has been removed."
    />

    <div v-else-if="work" :class="{ 'opacity-0': status === 'pending', 'animate-fade-in': status !== 'pending' }" class="grid gap-4 md:gap-8 md:grid-cols-5">
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
          <div class="relative w-full">
            <USkeleton v-if="!loadedImages.has(item.url!)" class="absolute inset-0 w-full h-full" />
            <NuxtImg :src="item.url" class="w-full object-cover transition-opacity duration-500 ease-in-out" :class="loadedImages.has(item.url!) ? 'opacity-100' : 'opacity-0'" @load="onImageLoaded(item.url!)" />
          </div>
        </UCarousel>

        <div v-else-if="work.images[0]?.url" class="relative w-full">
          <USkeleton v-if="!loadedImages.has(work.images[0].url)" class="absolute inset-0 w-full h-full" />
          <NuxtImg
            :src="work.images[0].url"
            class="w-full object-cover transition-opacity duration-500 ease-in-out"
            :class="loadedImages.has(work.images[0].url) ? 'opacity-100' : 'opacity-0'"
            @load="onImageLoaded(work.images[0].url)"
          />
        </div>

        <div v-else class="bg-muted flex h-105 items-center justify-center">
          <Icon name="lucide:image-off" size="40" />
        </div>
      </div>

      <div class="md:col-span-2">
        <div class="md:sticky top-[calc(var(--ui-header-height)+1px)] flex flex-col gap-4 md:gap-8">
          <UCard>
            <div class="flex flex-col gap-3">
              <h1 class="text-4xl font-extrabold font-sc-serif">
                {{ work.title }}
              </h1>

              <p v-if="work.titleEnglish" class="text-muted text-xl font-latin-text-serif">
                {{ work.titleEnglish }}
              </p>

              <dl v-if="work.year || work.material || work.dimensions" class="mt-2 space-y-2 text-md text-muted">
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
            </div>
          </UCard>

          <UPageCard v-if="work.description" title="Work Description">
            <USkeleton
              v-if="!workDescriptionEditorReady"
              class="h-28 w-full rounded-md transition-opacity duration-300"
            />
            <UEditor
              :model-value="work.description"
              content-type="markdown"
              :editable="false"
              :on-mount="() => workDescriptionEditorReady = true"
              :ui="{
                base: 'px-0!',
              }"
              class="w-full transition-opacity duration-300"
              :class="workDescriptionEditorReady ? 'opacity-100' : 'opacity-0'"
            />
          </UPageCard>
        </div>
      </div>
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

const loadedImages = reactive(new Set<string>());
const workDescriptionEditorReady = ref(false);

const {
  data: work,
  status,
  error,
} = useQuery({
  key: ['work.get', workId],
  query: () => $trpc.work.get.query({ id: workId }),
});

function onImageLoaded(url: string) {
  loadedImages.add(url);
}

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
</style>
