<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="主页" />
    </template>
    <template #body>
      <!-- Stats overview -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <UCard
          v-for="stat in stats"
          :key="stat.label"
          class="hover:ring-primary/50 transition-colors cursor-pointer"
          @click="navigateTo(stat.to)"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-primary/10 p-3">
              <UIcon :name="stat.icon" class="size-6 text-primary" />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ stat.value ?? '–' }}
              </p>
              <p class="text-sm text-muted">
                {{ stat.label }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Recent contact forms -->
      <h2 class="text-lg font-semibold mb-4">
        最近联系表格
      </h2>
      <UCard v-if="recentContacts?.length">
        <div class="divide-y divide-default">
          <div
            v-for="contact in recentContacts"
            :key="contact.id"
            class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div class="flex items-center gap-3 min-w-0">
              <UIcon
                :name="contact.unread ? 'i-lucide-mail' : 'i-lucide-mail-open'"
                class="size-5 shrink-0"
                :class="contact.unread ? 'text-primary' : 'text-muted'"
              />
              <div class="min-w-0">
                <p class="font-medium truncate">
                  {{ contact.firstName }} {{ contact.lastName }}
                  <span class="text-muted font-normal">– {{ contact.subject }}</span>
                </p>
                <p class="text-sm text-muted truncate">
                  {{ contact.email }}
                </p>
              </div>
            </div>
            <span class="text-xs text-muted whitespace-nowrap">
              {{ contact.createdAt ? formatDate(contact.createdAt) : '' }}
            </span>
          </div>
        </div>
      </UCard>
      <p v-else class="text-muted">
        暂无联系表格
      </p>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

const { $trpc } = useNuxtApp();

const { data: works } = useQuery({
  key: ['work.list'],
  query: () => $trpc.work.list.query(),
});

const { data: seriesList } = useQuery({
  key: ['work.listSeries'],
  query: () => $trpc.work.listSeries.query(),
});

const { data: products } = useQuery({
  key: ['product.list'],
  query: () => $trpc.product.list.query(),
});

const { data: contactForms } = useQuery({
  key: ['contactForm.list'],
  query: () => $trpc.contactForm.list.query(),
});

const unreadCount = computed(() => contactForms.value?.filter(f => f.unread).length ?? 0);

const stats = computed(() => [
  {
    label: '作品总数',
    value: works.value?.length,
    icon: 'i-lucide-image',
    to: '/admin/works',
  },
  {
    label: '系列总数',
    value: seriesList.value?.length,
    icon: 'i-lucide-folder',
    to: '/admin/works',
  },
  {
    label: '商品总数',
    value: products.value?.length,
    icon: 'i-lucide-shopping-bag',
    to: '/admin/products',
  },
  {
    label: '未读消息',
    value: unreadCount.value,
    icon: 'i-lucide-mail',
    to: '/admin/contact',
  },
]);

const recentContacts = computed(() => contactForms.value?.slice(0, 5));

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
