<template>
  <div>
    <UButton
      to="/shop"
      variant="link"
      color="neutral"
      icon="lucide:arrow-left"
      class="mb-4 px-0"
    >
      Back to shop
    </UButton>

    <UEmpty
      v-if="error"
      icon="lucide:triangle-alert"
      title="Failed to load this product"
      variant="naked"
      description="Please try again later."
    />

    <UEmpty
      v-else-if="status === 'success' && !product"
      icon="lucide:file-x"
      title="Product not found"
      variant="naked"
      description="This product does not exist or has been removed."
    />

    <div v-else-if="product" :class="{ 'opacity-0': status === 'pending', 'animate-fade-in': status !== 'pending' }" class="grid gap-8 md:grid-cols-5">
      <div class="md:col-span-3">
        <UCarousel
          v-if="product.images.length > 1"
          v-slot="{ item }"
          loop
          arrows
          :prev="{ variant: 'soft' }"
          :next="{ variant: 'soft' }"
          :items="product.images"
          :ui="{
            container: '',
            prev: 'sm:start-4',
            next: 'sm:end-4',
          }"
        >
          <div class="relative w-full">
            <USkeleton v-if="!loadedImages.has(item.url!)" class="absolute inset-0 w-full h-full" />
            <NuxtImg
              :src="item.url"
              class="w-full object-cover transition-opacity duration-500 ease-in-out"
              :class="loadedImages.has(item.url!) ? 'opacity-100' : 'opacity-0'"
              @load="onImageLoaded(item.url!)"
            />
          </div>
        </UCarousel>

        <div v-else-if="product.images[0]?.url" class="relative w-full">
          <USkeleton v-if="!loadedImages.has(product.images[0].url)" class="absolute inset-0 w-full h-full" />
          <NuxtImg
            :src="product.images[0].url"
            class="w-full object-cover transition-opacity duration-500 ease-in-out"
            :class="loadedImages.has(product.images[0].url) ? 'opacity-100' : 'opacity-0'"
            @load="onImageLoaded(product.images[0].url)"
          />
        </div>

        <div v-else class="bg-muted flex h-105 items-center justify-center">
          <Icon name="lucide:image-off" size="40" />
        </div>
      </div>

      <UCard class="h-min md:col-span-2">
        <div class="flex flex-col gap-8">
          <h1 class="text-4xl font-extrabold font-sc-serif">
            {{ product.name }}
          </h1>

          <p v-if="product.unitAmount != null && product.currency" class="text-2xl font-latin-text-serif">
            {{ formatPrice(product.unitAmount, product.currency) }}
          </p>

          <p v-if="product.description" class="text-sm text-muted">
            {{ product.description }}
          </p>

          <UButton
            class="w-full"
            size="lg"
            icon="lucide:shopping-cart"
            label="Add to Cart"
            @click="addToCart"
          />

          <UAccordion :items="items" />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui';

const route = useRoute();
const { $trpc } = useNuxtApp();

const items = ref<AccordionItem[]>([
  {
    label: 'PACKING',
    content: 'All orders are carefully packed in eco-friendly materials to ensure they arrive in perfect condition. We use recycled boxes and biodegradable packing peanuts whenever possible.',
  },
  {
    label: 'SHIPPING',
    content: 'We offer free standard shipping on all orders. Expedited shipping options are available at checkout.',
  },
  {
    label: 'RETURNS',
    content: 'We offer a 30-day return policy on all products. Items must be in their original condition and packaging.',
  },
  {
    label: 'CARING FOR YOUR PRODUCT',
    content: 'To keep your product looking its best, we recommend spot cleaning with a damp cloth. Avoid using harsh chemicals or abrasive materials.',
  },
]);

const productId = Number(route.params.id);

if (!Number.isInteger(productId) || productId <= 0) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' });
}

const loadedImages = reactive(new Set<string>());

const {
  data: product,
  status,
  error,
} = useQuery({
  key: ['product.get', productId],
  query: () => $trpc.product.get.query({ id: productId }),
});

function onImageLoaded(url: string) {
  loadedImages.add(url);
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

const cart = useCartStore();
const toast = useToast();

function addToCart() {
  if (!product.value)
    return;
  cart.addItem(product.value);
  toast.add({ title: 'Added to cart', description: `${product.value.name} has been added to your cart.`, color: 'success' });
}

useHead({
  title: product.value ? product.value.name : 'Product',
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
