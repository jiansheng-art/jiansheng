<template>
  <UPage>
    <UHeader
      title="Jiansheng ART"
      mode="slideover"
      :ui="{
        root: 'border-b-0 bg-default',
        title: 'font-latin-serif',
        right: 'gap-5',
      }"
    >
      <UNavigationMenu
        highlight
        variant="link" color="neutral" :items="items" :ui="{
          list: 'gap-5',
        }"
      />

      <template #right>
        <CartSlideover />
      </template>

      <template #body>
        <UNavigationMenu
          variant="link" orientation="vertical" color="neutral" :items="items" :ui="{
            list: 'flex flex-col gap-4',
          }"
        />
      </template>
    </UHeader>

    <UContainer class="min-h-[calc(100vh-var(--ui-header-height))] pt-5">
      <slot />
    </UContainer>

    <LayoutFooter />
  </UPage>
</template>

<script setup lang="ts">
const items = ref([
  {
    label: 'HOME',
    to: '/',
  },
  {
    label: 'ABOUT',
    to: '/about',
  },
  {
    label: 'GALLERY',
    to: '/gallery',
  },
  {
    label: 'ART ACTIVITIES',
    to: '/art-activities',
  },
  {
    label: 'SHOP',
    to: '/shop',
  },
  {
    label: 'CONTACT ME',
    to: '/contact',
  },
]);
</script>
