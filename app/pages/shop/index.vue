<template>
  <div>
    <UEmpty
      v-if="error"
      icon="lucide:triangle-alert"
      title="Failed to load products"
      variant="naked"
      description="Please try again later."
    />

    <UEmpty
      v-else-if="status === 'success' && (!products || products.length === 0)"
      icon="lucide:shopping-bag"
      title="No products available"
      variant="naked"
      description="Check back later for new items."
    />

    <div
      v-else
      :class="{ 'opacity-0': status === 'pending', 'animate-fade-in': status !== 'pending' }"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6"
    >
      <NuxtLink
        v-for="product in products"
        :key="product.id"
        :to="`/shop/${product.id}`"
        class="block group"
      >
        <UCard :ui="{ body: 'p-2!' }">
          <div v-if="product.images[0]?.url" class="relative aspect-square w-full overflow-hidden">
            <USkeleton v-if="!loadedImages.has(product.images[0].url)" class="absolute inset-0 w-full h-full" />
            <NuxtImg
              :src="product.images[0].url"
              class="object-cover w-full h-full aspect-square transition-all duration-500 ease-in-out"
              :class="loadedImages.has(product.images[0].url) ? 'opacity-100' : 'opacity-0'"
              @load="loadedImages.add(product.images[0].url)"
            />
          </div>
          <div v-else class="bg-muted flex items-center justify-center aspect-square">
            <Icon name="lucide:image-off" size="40" />
          </div>

          <div class="py-2 px-1 space-y-1">
            <h3 class="font-semibold font-latin-text-serif text-lg truncate">
              {{ product.name }}
            </h3>
            <p v-if="product.unitAmount != null && product.currency" class="text-sm text-muted">
              {{ formatPrice(product.unitAmount, product.currency) }}
            </p>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

const {
  data: products,
  status,
  error,
} = useQuery({
  key: ['product.list'],
  query: () => $trpc.product.list.query(),
});

const loadedImages = reactive(new Set<string>());

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

useHead({
  title: 'Shop',
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
