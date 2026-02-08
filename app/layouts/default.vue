<template>
  <UPage>
    <UHeader
      title="Jiansheng ART"
      mode="slideover"
      :ui="{
        root: 'border-b-0 bg-default',
        title: 'font-serif',
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
        <USlideover title="Cart">
          <UButton icon="lucide:shopping-cart" variant="ghost" color="neutral">
            <UBadge label="0" variant="soft" color="neutral" size="sm" />
          </UButton>

          <template #body>
            aa
          </template>
        </USlideover>
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

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          Copyright © {{ new Date().getFullYear() }}
        </p>
      </template>
      <template #right>
        <UButton
          icon="i-simple-icons-x"
          color="neutral"
          variant="ghost"
          to="https://go.nuxt.com/x"
          target="_blank"
          aria-label="X"
        />
      </template>
    </UFooter>
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
