<template>
  <Transition name="fade">
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-default">
      <div class="flex flex-col items-center gap-4">
        <div class="loading-spinner" />
      </div>
    </div>
  </Transition>

  <div :class="{ 'opacity-0': loading, 'animate-fade-in': !loading }">
    <div class="-mt-[calc(var(--ui-header-height)+200px+20px)] z-20 px-5 lg:px-10 xl:px-15 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center gap-5 lg:gap-10 xl:gap-15">
      <HomeWorkDisplay
        v-for="(item, index) in works"
        :key="item.id"
        :work="item"
        :class="[index === 2 ? 'hidden md:block' : '', index === 3 ? 'hidden lg:block' : '', index >= 4 ? 'hidden xl:block' : '']"
        @loaded="onImageLoaded"
      />
    </div>

    <UPageHero
      title="张间生"
      description="Jiansheng Zhang"
      :ui="{
        header: 'font-sc-serif font-extrabold',
        description: 'font-latin-serif',
      }"
    />
  </div>
</template>

<script setup lang="ts">
const { $trpc } = useNuxtApp();

definePageMeta({
  layout: 'home',
});

const loading = ref(true);
const loadedCount = ref(0);

const {
  data: works,
} = useQuery({
  key: ['work.listHome'],
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  query: () => $trpc.work.listHome.query(),
});

function onImageLoaded() {
  loadedCount.value++;
  checkAllLoaded();
}

function checkAllLoaded() {
  if (!works.value)
    return;
  const totalImages = works.value.filter(w => w.images[0]?.url).length;
  if (loadedCount.value >= totalImages) {
    loading.value = false;
  }
}

// Handle case where there are no works/images
watch(works, (val) => {
  if (val && val.length === 0) {
    loading.value = false;
  }
}, { immediate: true });

// Safety timeout to prevent infinite loading
onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 10000);
});
</script>

<style scoped>
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-leave-to {
  opacity: 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease forwards;
}
</style>
