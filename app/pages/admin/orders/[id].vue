<template>
  <UDashboardPanel id="admin-order-detail">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            to="/admin/orders"
            class="mr-2"
          />
          <span class="text-lg font-semibold">订单详情</span>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex items-center justify-center py-24">
        <UIcon name="i-lucide-loader" class="size-6 animate-spin text-muted" />
      </div>

      <div v-else-if="order" class="space-y-6 w-full lg:max-w-4xl mx-auto">
        <!-- Order summary -->
        <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
          <UPageCard
            icon="i-lucide-credit-card"
            title="金额"
            variant="subtle"
            :ui="{
              container: 'gap-y-1.5',
              wrapper: 'items-start',
              leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
              title: 'font-normal text-muted text-xs uppercase',
            }"
            class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
          >
            <div class="flex items-center gap-2">
              <span class="text-2xl font-semibold text-highlighted">
                {{ formatAmount(order.amountTotal, order.currency) }}
              </span>
            </div>
          </UPageCard>

          <UPageCard
            icon="i-lucide-check-circle"
            title="支付状态"
            variant="subtle"
            :ui="{
              container: 'gap-y-1.5',
              wrapper: 'items-start',
              leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
              title: 'font-normal text-muted text-xs uppercase',
            }"
            class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
          >
            <div class="flex items-center gap-2">
              <UBadge :color="paymentColor" variant="subtle" size="lg">
                {{ paymentLabel }}
              </UBadge>
            </div>
          </UPageCard>

          <UPageCard
            icon="i-lucide-truck"
            title="物流状态"
            variant="subtle"
            :ui="{
              container: 'gap-y-1.5',
              wrapper: 'items-start',
              leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
              title: 'font-normal text-muted text-xs uppercase',
            }"
            class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
          >
            <div class="flex items-center gap-2">
              <UBadge :color="shippingColor" variant="subtle" size="lg">
                {{ shippingLabel }}
              </UBadge>
            </div>
          </UPageCard>
        </UPageGrid>

        <!-- Customer & Shipping Info -->
        <div class="grid gap-6 lg:grid-cols-2">
          <UPageCard title="客户信息">
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted">
                  姓名
                </dt>
                <dd>{{ order.customerName || '–' }}</dd>
              </div>
              <USeparator />
              <div class="flex justify-between">
                <dt class="text-muted">
                  邮箱
                </dt>
                <dd>{{ order.customerEmail || '–' }}</dd>
              </div>
              <USeparator />
              <div class="flex justify-between">
                <dt class="text-muted">
                  下单时间
                </dt>
                <dd>{{ formatDate(order.createdAt) }}</dd>
              </div>
            </dl>
          </UPageCard>

          <UPageCard title="收货地址">
            <div v-if="order.shippingAddress" class="text-sm leading-relaxed">
              {{ order.shippingAddress }}
            </div>
            <div v-else class="text-sm text-muted">
              未提供
            </div>
          </UPageCard>
        </div>

        <!-- Line Items -->
        <UPageCard title="商品明细">
          <UTable
            :data="order.lineItems"
            :columns="itemColumns"
          />
        </UPageCard>

        <!-- Shipping Management -->
        <UPageCard title="物流管理">
          <UForm :state="shippingForm" class="space-y-4" @submit="onShippingSubmit">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="物流状态" name="shippingStatus">
                <USelect
                  v-model="shippingForm.shippingStatus"
                  :items="shippingStatusOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="快递公司" name="carrier">
                <UInput v-model="shippingForm.carrier" placeholder="如 Canada Post, FedEx..." class="w-full" />
              </UFormField>

              <UFormField label="快递单号" name="trackingNumber">
                <UInput v-model="shippingForm.trackingNumber" placeholder="输入快递单号" class="w-full" />
              </UFormField>

              <UFormField label="备注" name="notes">
                <UTextarea v-model="shippingForm.notes" placeholder="备注信息..." class="w-full" />
              </UFormField>
            </div>

            <div v-if="order.shippedAt || order.deliveredAt" class="text-sm text-muted space-y-1">
              <p v-if="order.shippedAt">
                发货时间: {{ formatDate(order.shippedAt) }}
              </p>
              <p v-if="order.deliveredAt">
                送达时间: {{ formatDate(order.deliveredAt) }}
              </p>
            </div>

            <div class="flex justify-end">
              <UButton type="submit" :loading="shippingSubmitLoading" label="保存物流信息" />
            </div>
          </UForm>
        </UPageCard>

        <!-- Stripe Session ID -->
        <div class="text-xs text-muted">
          Stripe Session: {{ order.id }}
        </div>
      </div>

      <div v-else class="text-center py-24 text-muted">
        订单不存在
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h } from 'vue';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const { $trpc } = useNuxtApp();
const toast = useToast();

const sessionId = computed(() => route.params.id as string);

const { data: order, status, refetch, suspense } = useQuery({
  queryKey: computed(() => ['order.get', sessionId.value]),
  queryFn: () => $trpc.order.get.query({ id: sessionId.value }),
});

await suspense();

const isLoading = computed(() => status.value === 'pending');

// --- Payment status ---
const paymentColor = computed(() => {
  switch (order.value?.status) {
    case 'paid': return 'success' as const;
    case 'unpaid': return 'warning' as const;
    case 'no_payment_required': return 'info' as const;
    default: return 'neutral' as const;
  }
});

const paymentLabel = computed(() => {
  switch (order.value?.status) {
    case 'paid': return '已支付';
    case 'unpaid': return '未支付';
    case 'no_payment_required': return '无需支付';
    default: return order.value?.status ?? '–';
  }
});

// --- Shipping status ---
const shippingColor = computed(() => {
  switch (order.value?.shippingStatus) {
    case 'pending': return 'neutral' as const;
    case 'processing': return 'warning' as const;
    case 'shipped': return 'info' as const;
    case 'delivered': return 'success' as const;
    case 'cancelled': return 'error' as const;
    default: return 'neutral' as const;
  }
});

const shippingLabel = computed(() => {
  switch (order.value?.shippingStatus) {
    case 'pending': return '待处理';
    case 'processing': return '处理中';
    case 'shipped': return '已发货';
    case 'delivered': return '已送达';
    case 'cancelled': return '已取消';
    default: return order.value?.shippingStatus ?? '–';
  }
});

// --- Line items table ---
interface LineItem {
  description: string | null;
  quantity: number | null;
  amountTotal: number;
}

const itemColumns: TableColumn<LineItem>[] = [
  {
    accessorKey: 'description',
    header: '商品',
    cell: ({ row }) => row.original.description || '–',
  },
  {
    accessorKey: 'quantity',
    header: '数量',
    cell: ({ row }) => String(row.original.quantity ?? 0),
  },
  {
    accessorKey: 'amountTotal',
    header: () => h('div', { class: 'text-right' }, '金额'),
    cell: ({ row }) => {
      const formatted = formatAmount(row.original.amountTotal, order.value?.currency ?? null);
      return h('div', { class: 'text-right font-medium' }, formatted);
    },
  },
];

// --- Shipping form ---
const shippingSubmitLoading = ref(false);

const shippingForm = reactive({
  shippingStatus: 'pending',
  trackingNumber: '',
  carrier: '',
  notes: '',
});

const shippingStatusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已发货', value: 'shipped' },
  { label: '已送达', value: 'delivered' },
  { label: '已取消', value: 'cancelled' },
];

// Sync form when order data loads
watch(order, (o) => {
  if (o) {
    shippingForm.shippingStatus = o.shippingStatus;
    shippingForm.trackingNumber = o.trackingNumber ?? '';
    shippingForm.carrier = o.carrier ?? '';
    shippingForm.notes = o.notes ?? '';
  }
}, { immediate: true });

async function onShippingSubmit() {
  if (!order.value)
    return;
  shippingSubmitLoading.value = true;

  try {
    await $trpc.order.updateShipping.mutate({
      stripeSessionId: order.value.id,
      shippingStatus: shippingForm.shippingStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
      trackingNumber: shippingForm.trackingNumber || null,
      carrier: shippingForm.carrier || null,
      notes: shippingForm.notes || null,
    });
    toast.add({ title: '物流状态已更新', color: 'success' });
    refetch();
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    shippingSubmitLoading.value = false;
  }
}

// --- Formatters ---
function formatAmount(amount: number | null, currency: string | null): string {
  if (amount == null)
    return '–';
  const value = amount / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: (currency ?? 'cad').toUpperCase(),
  }).format(value);
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
