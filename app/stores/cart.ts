import type { RouterOutput } from '~/types/trpc';
import { defineStore } from 'pinia';

export interface CartItem {
  productId: number;
  name: string;
  unitAmount: number;
  currency: string;
  imageUrl?: string;
  quantity: number;
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);

  const totalItems = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));

  const totalAmount = computed(() => items.value.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0));

  const currency = computed(() => items.value[0]?.currency ?? 'cad');

  function addItem(product: RouterOutput['product']['list'][number], quantity = 1) {
    const existing = items.value.find(item => item.productId === product.id);

    if (existing) {
      existing.quantity += quantity;
    }
    else {
      items.value.push({
        productId: product.id,
        name: product.name,
        unitAmount: product.unitAmount ?? 0,
        currency: product.currency ?? 'cad',
        imageUrl: product.images[0]?.url,
        quantity,
      });
    }
  }

  function removeItem(productId: number) {
    items.value = items.value.filter(item => item.productId !== productId);
  }

  function updateQuantity(productId: number, quantity: number) {
    const item = items.value.find(i => i.productId === productId);
    if (!item)
      return;

    if (quantity <= 0) {
      removeItem(productId);
    }
    else {
      item.quantity = quantity;
    }
  }

  function clear() {
    items.value = [];
  }

  return {
    items,
    totalItems,
    totalAmount,
    currency,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  };
}, {
  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
  },
});
