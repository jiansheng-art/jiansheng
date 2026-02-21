<template>
  <USlideover title="Cart">
    <UButton icon="lucide:shopping-cart" variant="ghost" color="neutral">
      <UBadge :label="String(cart.totalItems)" variant="soft" color="primary" size="sm" />
    </UButton>

    <template #body>
      <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center h-full gap-4 text-muted">
        <Icon name="lucide:shopping-bag" size="48" />
        <p>Your cart is empty</p>
        <UButton to="/shop" variant="soft" label="Browse Shop" />
      </div>

      <div v-else class="flex flex-col gap-4">
        <div v-for="item in cart.items" :key="item.productId" class="flex gap-3 items-center">
          <NuxtImg v-if="item.imageUrl" :src="item.imageUrl" class="w-16 h-16 object-cover rounded-md shrink-0" />
          <div v-else class="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
            <Icon name="lucide:image-off" size="20" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">
              {{ item.name }}
            </p>
            <p class="text-sm text-muted">
              {{ formatPrice(item.unitAmount, item.currency) }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <UButton
                icon="lucide:minus"
                size="xs"
                variant="outline"
                color="neutral"
                @click="cart.updateQuantity(item.productId, item.quantity - 1)"
              />
              <span class="text-sm w-6 text-center">{{ item.quantity }}</span>
              <UButton
                icon="lucide:plus"
                size="xs"
                variant="outline"
                color="neutral"
                @click="cart.updateQuantity(item.productId, item.quantity + 1)"
              />
            </div>
          </div>

          <UButton
            icon="lucide:x"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="cart.removeItem(item.productId)"
          />
        </div>

        <USeparator />

        <div class="flex justify-between items-center">
          <span class="font-semibold">Total</span>
          <span class="font-bold text-lg">{{ formatPrice(cart.totalAmount, cart.currency) }}</span>
        </div>

        <UButton
          label="Checkout"
          icon="lucide:credit-card"
          block
          :loading="checkoutLoading"
          @click="checkout"
        />

        <UButton
          label="Clear Cart"
          variant="outline"
          color="neutral"
          block
          @click="cart.clear()"
        />
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
const cart = useCartStore();
const { $trpc } = useNuxtApp();

const checkoutLoading = ref(false);

async function checkout() {
  if (cart.items.length === 0)
    return;

  checkoutLoading.value = true;
  try {
    const { url } = await $trpc.product.createCheckoutSession.mutate({
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    await navigateTo(url, { external: true });
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    checkoutLoading.value = false;
  }
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}
</script>
