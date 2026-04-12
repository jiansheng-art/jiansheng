<template>
  <UDashboardPanel id="admin-home">
    <template #header>
      <UDashboardNavbar title="主页" />
    </template>

    <template #body>
      <!-- Stats row -->
      <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
        <UPageCard
          v-for="(stat, index) in stats"
          :key="index"
          :icon="stat.icon"
          :title="stat.label"
          :to="stat.to"
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
              {{ stat.value ?? '–' }}
            </span>
          </div>
        </UPageCard>
      </UPageGrid>

      <!-- Recent contacts table -->
      <div class="mt-8">
        <h2 class="text-lg font-semibold mb-4">
          最近联系表格
        </h2>

        <UTable
          v-if="recentContacts?.length"
          :data="recentContacts"
          :columns="contactColumns"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
          }"
        >
          <template #unread-cell="{ row }">
            <UIcon
              :name="row.original.unread ? 'i-lucide-mail' : 'i-lucide-mail-open'"
              class="size-5"
              :class="row.original.unread ? 'text-primary' : 'text-muted'"
            />
          </template>

          <template #name-cell="{ row }">
            <span class="font-medium">{{ row.original.firstName }} {{ row.original.lastName }}</span>
          </template>

          <template #date-cell="{ row }">
            <span class="text-muted">{{ row.original.createdAt ? formatDate(row.original.createdAt) : '' }}</span>
          </template>
        </UTable>

        <p v-else class="text-muted">
          暂无联系表格
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { h, resolveComponent } from 'vue';

const { $trpc } = useNuxtApp();

const UBadge = resolveComponent('UBadge');

const { data: countStats } = await $trpc.home.counter.useQuery();
const { data: contactForms } = await $trpc.contactForm.list.useQuery();

const stats = computed(() => [
  {
    label: '作品总数',
    value: countStats.value?.workCount,
    icon: 'i-lucide-image',
    to: '/works',
  },
  {
    label: '系列总数',
    value: countStats.value?.seriesCount,
    icon: 'i-lucide-folder',
    to: '/works',
  },
  {
    label: '商品总数',
    value: countStats.value?.productCount,
    icon: 'i-lucide-shopping-bag',
    to: '/products',
  },
  {
    label: '未读消息',
    value: countStats.value?.contactFormCount,
    icon: 'i-lucide-mail',
    to: '/contact',
  },
]);

interface ContactForm {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  unread: boolean;
  createdAt: Date | null;
}

const recentContacts = computed(() => (contactForms.value?.slice(0, 5) ?? []) as ContactForm[]);

const contactColumns: TableColumn<ContactForm>[] = [
  {
    accessorKey: 'unread',
    header: '',
    id: 'unread',
  },
  {
    accessorKey: 'firstName',
    header: '姓名',
    id: 'name',
  },
  {
    accessorKey: 'email',
    header: '邮箱',
  },
  {
    accessorKey: 'subject',
    header: '主题',
  },
  {
    accessorKey: 'unread',
    header: '状态',
    id: 'status',
    cell: ({ row }) => {
      const unread = row.original.unread;
      return h(UBadge, {
        color: unread ? 'primary' : 'neutral',
        variant: 'subtle',
        class: 'capitalize',
      }, () => unread ? '未读' : '已读');
    },
  },
  {
    accessorKey: 'createdAt',
    header: '时间',
    id: 'date',
  },
];

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
