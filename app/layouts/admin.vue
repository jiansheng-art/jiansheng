<template>
  <UPage>
    <UDashboardGroup>
      <UDashboardSidebar
        v-model:open="open"
        class="bg-elevated/25"
      >
        <template #header>
          <span class="h-5 w-auto shrink-0 font-serif font-bold">Zhang Jiansheng ART</span>
        </template>

        <UDashboardSearchButton class="bg-transparent ring-default" />

        <UNavigationMenu
          :items="items[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <template #footer>
          <AdminUserMenu />
        </template>
      </UDashboardSidebar>

      <UDashboardSearch :groups="groups" />

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
  to: '/admin/',
  onSelect: () => { open.value = false; },
}, {
  label: '作品管理',
  icon: 'i-lucide-image',
  to: '/admin/works',
  onSelect: () => { open.value = false; },
}, {
  label: '联系表格',
  icon: 'i-lucide-mail',
  to: '/admin/contact',
  onSelect: () => { open.value = false; },
}]];

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: items.flat(),
}]);
</script>
