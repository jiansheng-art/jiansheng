<template>
  <div :class="wrapperClass">
    <USkeleton v-if="!loaded" :class="skeletonClass" />
    <NuxtImg
      ref="imageRef"
      :src="src"
      :alt="alt"
      :class="[imageClass, loaded ? 'opacity-100' : 'opacity-0']"
      @load="onImageLoad"
    />
  </div>
</template>

<script setup lang="ts">
const {
  src,
  alt = '',
  wrapperClass = 'relative aspect-square w-full',
  imageClass = 'object-cover w-full h-full aspect-square transition-opacity duration-500 ease-in-out',
  skeletonClass = 'absolute inset-0 w-full h-full',
} = defineProps<{
  src: string;
  alt?: string;
  wrapperClass?: string;
  imageClass?: string;
  skeletonClass?: string;
}>();

const emit = defineEmits<{
  loaded: [];
}>();

const loaded = ref(false);
const loadedEmitted = ref(false);
const imageRef = ref<{ $el?: HTMLImageElement } | HTMLImageElement | null>(null);

function resolveImageEl() {
  if (!imageRef.value) {
    return null;
  }

  if (imageRef.value instanceof HTMLImageElement) {
    return imageRef.value;
  }

  return imageRef.value.$el ?? null;
}

function syncImageLoadedState() {
  const imageEl = resolveImageEl();

  if (imageEl?.complete && imageEl.naturalWidth > 0) {
    markLoaded();
  }
}

function markLoaded() {
  loaded.value = true;

  if (!loadedEmitted.value) {
    loadedEmitted.value = true;
    emit('loaded');
  }
}

function onImageLoad() {
  markLoaded();
}

watch(
  () => src,
  async () => {
    loaded.value = false;
    loadedEmitted.value = false;
    await nextTick();
    syncImageLoadedState();
  },
  { immediate: true },
);

onMounted(() => {
  syncImageLoadedState();
});
</script>
