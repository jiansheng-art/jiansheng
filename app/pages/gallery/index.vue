<template>
  <div class="flex flex-col gap-6 lg:gap-10">
    <NuxtLink
      v-for="series in seriesList"
      :key="series.id"
      :to="`/gallery/series/${series.id}`"
    >
      <UCard>
        <div class="grid gap-6 md:grid-cols-6">
          <div class="col-span-2">
            <h2 class="mt-2 text-4xl font-bold font-sc-serif">
              {{ series.title }}
            </h2>
            <p v-if="series.titleEnglish" class="mt-1 text-xl text-muted font-latin-serif font-semibold">
              {{ series.titleEnglish }}
            </p>
            <p v-if="series.description" class="line-clamp-3 mt-4 text-sm leading-relaxed text-muted">
              {{ series.description }}
            </p>
          </div>

          <div class="col-span-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="(preview, index) in series.works"
              :key="preview.id"
            >
              <UCard
                :ui="{ body: 'p-2!' }"
                :work="preview"
                :class="{
                  'hidden md:block': index === 2,
                  'hidden lg:block': index === 3,
                }"
              >
                <NuxtImg
                  v-if="preview.images[0]?.url" :src="preview.images[0].url"
                  class="object-cover w-full h-full aspect-square"
                />
                <div v-else class="bg-muted flex items-center justify-center aspect-square">
                  <Icon name="lucide:image-off" size="40" />
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </UCard>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

const {
  data: seriesList,
} = useQuery({
  key: ['work.listSeries'],
  query: () => $trpc.work.listSeries.query(),
});
</script>
