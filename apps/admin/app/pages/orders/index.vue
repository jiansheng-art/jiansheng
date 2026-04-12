<template>
  <UDashboardPanel id="admin-orders">
    <template #header>
      <UDashboardNavbar title="订单管理" />
    </template>

    <template #body>
      <!-- Orders table -->
      <UTable
        :data="orders ?? []"
        :columns="columns"
        :loading="isLoading"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
        }"
        @select="onRowSelect"
      >
        <template #shippingStatus-cell="{ row }">
          <UBadge
            :color="shippingStatusColor(row.original.shippingStatus)"
            variant="subtle"
            size="sm"
          >
            {{ shippingStatusLabel(row.original.shippingStatus) }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-right"
            size="sm"
            :to="`/orders/${row.original.id}`"
            @click.stop
          />
        </template>
      </UTable>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4">
        <UButton
          v-if="cursorStack.length > 0"
          variant="soft"
          color="neutral"
          icon="i-lucide-chevron-left"
          label="上一页"
          @click="prevPage"
        />
        <span v-else />
        <UButton
          v-if="data?.hasMore"
          variant="soft"
          color="neutral"
          icon="i-lucide-chevron-right"
          trailing
          label="下一页"
          @click="nextPage"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h, resolveComponent } from 'vue';

const { $trpc } = useNuxtApp();
const router = useRouter();

const UBadge = resolveComponent('UBadge');

interface Order {
  id: string;
  amountTotal: number | null;
  currency: string | null;
  status: string;
  customerEmail: string | null;
  customerName: string | null;
  shippingAddress: string | null;
  lineItems: { description: string | null; quantity: number | null; amountTotal: number }[];
  shippingStatus: string;
  trackingNumber: string | null;
  carrier: string | null;
  notes: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

const PAGE_SIZE = 25;
const cursor = ref<string | undefined>(undefined);
const cursorStack = ref<string[]>([]);
const orderListInput = computed(() => ({
  limit: PAGE_SIZE,
  startingAfter: cursor.value,
}));

const {
  data,
  status,
} = await $trpc.order.list.useQuery(orderListInput);

const isLoading = computed(() => status.value === 'pending');
const orders = computed(() => data.value?.orders as Order[] | undefined);

const columns: TableColumn<Order>[] = [
  {
    accessorKey: 'createdAt',
    header: '时间',
    id: 'date',
    cell: ({ row }) => {
      const val = row.original.createdAt;
      return val ? formatDate(val) : '–';
    },
  },
  {
    accessorKey: 'customerName',
    header: '客户',
    cell: ({ row }) => row.original.customerName || '–',
  },
  {
    accessorKey: 'amountTotal',
    header: () => h('div', { class: 'text-right' }, '金额'),
    id: 'amount',
    cell: ({ row }) => {
      const formatted = formatAmount(row.original.amountTotal, row.original.currency);
      return h('div', { class: 'text-right font-medium' }, formatted);
    },
  },
  {
    accessorKey: 'status',
    header: '支付',
    id: 'paymentStatus',
    cell: ({ row }) => {
      const s = row.original.status;
      const color = {
        paid: 'success' as const,
        unpaid: 'warning' as const,
        no_payment_required: 'info' as const,
      }[s] ?? 'neutral' as const;
      return h(UBadge, { variant: 'subtle', color }, () => statusLabel(s));
    },
  },
  {
    accessorKey: 'shippingStatus',
    header: '物流',
    id: 'shippingStatus',
  },
  {
    id: 'actions',
    header: '',
  },
];

function onRowSelect(_event: Event, row: { original: Order }) {
  router.push(`/orders/${row.original.id}`);
}

// --- Pagination ---
function nextPage() {
  if (!data.value?.lastId)
    return;
  if (cursor.value) {
    cursorStack.value.push(cursor.value);
  }
  else {
    cursorStack.value.push('');
  }
  cursor.value = data.value.lastId;
}

function prevPage() {
  const prev = cursorStack.value.pop();
  cursor.value = prev || undefined;
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: string) {
  switch (status) {
    case 'paid': return '已支付';
    case 'unpaid': return '未支付';
    case 'no_payment_required': return '无需支付';
    default: return status;
  }
}

function shippingStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'neutral' as const;
    case 'processing': return 'warning' as const;
    case 'shipped': return 'info' as const;
    case 'delivered': return 'success' as const;
    case 'cancelled': return 'error' as const;
    default: return 'neutral' as const;
  }
}

function shippingStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '待处理';
    case 'processing': return '处理中';
    case 'shipped': return '已发货';
    case 'delivered': return '已送达';
    case 'cancelled': return '已取消';
    default: return status;
  }
}
</script>
