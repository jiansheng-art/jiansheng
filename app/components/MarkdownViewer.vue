<template>
  <UEditor
    :model-value="markdown"
    content-type="markdown"
    :editable="false"
    class="w-full"
    :ui="{
      root: 'w-full',
      base: 'min-h-0 border-0 px-0! py-0 prose prose-neutral dark:prose-invert max-w-none',
      content: 'border-0',
    }"
  />
</template>

<script setup lang="ts">
defineProps<{
  markdown: string;
}>();
</script>
