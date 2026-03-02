<template>
  <UPage>
    <UDashboardGroup>
      <UDashboardSidebar
        v-model:open="open"
        class="bg-elevated/25"
      >
        <template #header>
          <AdminUserMenu />
        </template>

        <UNavigationMenu
          :items="items[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <template #footer />
      </UDashboardSidebar>
      <slot />
    </UDashboardGroup>
  </UPage>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const open = ref(false);

const items: NavigationMenuItem[][] = [[{
  label: '主页',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => { open.value = false; },
}, {
  label: '作品管理',
  icon: 'i-lucide-image',
  to: '/works',
  onSelect: () => { open.value = false; },
}, {
  label: '商品管理',
  icon: 'i-lucide-shopping-bag',
  to: '/products',
  onSelect: () => { open.value = false; },
}, {
  label: '订单管理',
  icon: 'i-lucide-receipt',
  to: '/orders',
  onSelect: () => { open.value = false; },
}, {
  label: '艺术活动',
  icon: 'i-lucide-palette',
  to: '/art-activities',
  onSelect: () => { open.value = false; },
}, {
  label: '联系表格',
  icon: 'i-lucide-mail',
  to: '/contact',
  onSelect: () => { open.value = false; },
}, {
  label: '网页内容',
  icon: 'lucide:square-pen',
  to: '/page-content',
  onSelect: () => { open.value = false; },
}]];
</script>
