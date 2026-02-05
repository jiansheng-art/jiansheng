<template>
  <UDashboardPanel
    :default-size="25"
    :min-size="20"
    :max-size="30"
    resizable
  >
    <UDashboardNavbar title="联系表格">
      <template #right>
        <UTabs
          v-model="selectedTab"
          :items="tabItems"
          :content="false"
          size="xs"
        />
      </template>
    </UDashboardNavbar>
    <AdminMailItem v-model="selectedMail" :mails="contactForms || []" />
  </UDashboardPanel>

  <AdminInboxMail v-if="selectedMail" :mail="selectedMail" @close="selectedMail = null" />
  <div v-else class="hidden lg:flex flex-1 items-center justify-center">
    <UIcon name="i-lucide-inbox" class="size-32 text-dimmed" />
  </div>

  <ClientOnly>
    <USlideover v-if="isMobile" v-model:open="isMailPanelOpen">
      <template #content>
        <AdminInboxMail v-if="selectedMail" :mail="selectedMail" @close="selectedMail = null" />
      </template>
    </USlideover>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';
import { breakpointsTailwind } from '@vueuse/core';

definePageMeta({
  layout: 'admin',
});
const { $trpc } = useNuxtApp();

const {
  data: contactForms,
} = useQuery({
  key: ['contactForm.list'],
  query: () => $trpc.contactForm.list.query(),
});

const selectedMail = ref<null | RouterOutput['contactForm']['list'][number]>(null);
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('lg');

const isMailPanelOpen = computed({
  get() {
    return !!selectedMail.value;
  },
  set(value: boolean) {
    if (!value) {
      selectedMail.value = null;
    }
  },
});

const selectedTab = ref('all');
const tabItems = [{
  label: '全部',
  value: 'all',
}, {
  label: '未读',
  value: 'unread',
}];
</script>
