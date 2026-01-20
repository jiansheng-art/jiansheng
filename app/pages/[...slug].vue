<template>
  <ContentRenderer v-if="page" :value="page" />
  <UEmpty
    v-else
    icon="lucide:file-x"
    title="Page Not Found"
    variant="naked"
    description="The page you are looking for does not exist."
    :actions="[
      {
        icon: 'lucide:arrow-left',
        label: 'Back to Home',
        color: 'neutral',
        variant: 'subtle',
        href: '/',
      },
    ]"
    class="h-[calc(100vh-var(--ui-header-height))]"
  />
</template>

<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(route.path, () => queryCollection('content').path(route.path).first());

useSeoMeta({
  title: page.value?.title,
  description: page.value?.description,
});
</script>
