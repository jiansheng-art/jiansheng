<template>
  <MDC
    :value="markdown"
    tag="article"
    class="prose prose-neutral dark:prose-invert max-w-none"
  />
</template>

<script setup lang="ts">
defineProps<{
  markdown: string;
}>();
</script>
