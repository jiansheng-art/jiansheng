<template>
  <div class="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
    <UIcon name="lucide:circle-check" class="mb-6 size-16 text-green-600" />
    <h1 class="mb-2 text-3xl font-bold">
      Thank you for your order!
    </h1>
    <p class="text-muted mb-8 max-w-md text-lg">
      Your payment was successful. We'll get started on your order right away.
    </p>
    <UButton
      label="Continue Shopping"
      to="/shop"
      size="lg"
    />
  </div>
</template>

<script setup lang="ts">
const cart = useCartStore();

onMounted(() => {
  cart.clear();
});
</script>
