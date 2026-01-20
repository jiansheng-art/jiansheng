<template>
  <UPageCard
    :title="work.title"
    :description="work.description"
    orientation="vertical"
    reverse
    :ui="{
      container: 'p-0!',
      wrapper: 'px-4! pt-4 lg:pt-0 lg:pb-4',
    }"
  >
    <UModal v-model:open="modalOpen" title="修改作品">
      <UButton class="absolute top-3 right-3 z-50" variant="subtle" color="neutral" icon="lucide:edit" />

      <template #body>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="标题" name="title">
            <UInput v-model="state.title" class="w-full" />
          </UFormField>

          <UFormField label="描述" name="description">
            <UTextarea v-model="state.description" :rows="2" class="w-full" />
          </UFormField>

          <UCard v-for="img in workDirty.images" :key="img.id" :ui="{ body: 'p-2!' }">
            <div class="flex gap-2 items-center">
              <NuxtImg :src="img.url" class="w-10" />
              <span class="font-mono text-xs">
                {{ img.fileName }}
              </span>
              <div class="flex-1" />
              <UPopover>
                <UButton icon="lucide:trash" color="error" variant="subtle" size="xs" />
                <template #content="{ close }">
                  <div class="p-4 space-y-4">
                    <p>确定要删除这张图片吗？</p>
                    <div class="flex gap-2 justify-end">
                      <UButton label="取消" variant="outline" size="sm" @click="close" />
                      <UButton
                        label="删除"
                        color="error"
                        size="sm"
                        :loading="isDeleteImageLoading"
                        @click="deleteImage(img.id)"
                      />
                    </div>
                  </div>
                </template>
              </UPopover>
            </div>
          </UCard>

          <UFormField name="image" label="添加图片">
            <UFileUpload
              v-model="images"
              icon="i-lucide-image"
              label="拖拽图片上传"
              description="SVG, PNG, JPG or GIF"
              layout="list"
              multiple
              :interactive="false"
              class="w-full min-h-48"
            >
              <template #actions="{ open }">
                <UButton
                  label="选择图片"
                  icon="lucide:upload"
                  color="neutral"
                  variant="outline"
                  @click="open()"
                />
              </template>

              <template #files-bottom="{ removeFile, files }">
                <UButton
                  v-if="files?.length"
                  label="全部删除"
                  color="neutral"
                  size="sm"
                  variant="outline"
                  class="ml-auto"
                  @click="removeFile()"
                />
              </template>
            </UFileUpload>
          </UFormField>

          <UButton type="submit" :loading="submitLoading">
            修改
          </UButton>
        </UForm>
      </template>
    </UModal>
    <UCarousel
      v-if="work.images.length > 1"
      v-slot="{ item }"
      loop
      arrows
      :prev="{ variant: 'soft' }"
      :next="{ variant: 'soft' }"
      :items="work.images"
      :ui="{
        container: '',
        prev: 'sm:start-8',
        next: 'sm:end-8',
      }"
    >
      <NuxtImg :src="item.url" class="w-full object-cover" />
    </UCarousel>
    <NuxtImg v-else-if="work.images[0]?.url" :src="work.images[0].url" class="w-full object-cover" />
    <div v-else class="bg-muted flex items-center justify-center h-60">
      <Icon name="lucide:image-off" size="40" />
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';
import axios from 'axios';
import z from 'zod';

const { work } = defineProps<{
  work: RouterOutput['work']['list'][0];
}>();

const modalOpen = ref(false);
const workDirty = ref(work);

const schema = z.object({
  title: z.string().min(1, '请输入标题'),
  description: z.string().min(1, '请输入描述'),
});
const { $trpc } = useNuxtApp();

type Schema = z.infer<typeof schema>;

const state = reactive<Schema>({
  title: work.title,
  description: work.description,
});

const isDeleteImageLoading = ref(false);
async function deleteImage(id: number) {
  isDeleteImageLoading.value = true;
  try {
    await $trpc.work.deleteImage.mutate({ id });
    workDirty.value.images = workDirty.value.images.filter(img => img.id !== id);
    isDeleteImageLoading.value = false;
  }
  catch (error) {
    useErrorHandler(error);
    isDeleteImageLoading.value = false;
  }
}

const images = ref<File[]>([]);
const workImages = ref<number[]>([]);

const toast = useToast();
const submitLoading = ref(false);
async function onSubmit() {
  submitLoading.value = true;
  for (const file of images.value) {
    try {
      const { id, url } = await $trpc.work.createImage.mutate({ fileName: file.name });

      await axios.put(url, file.slice(), {
        headers: { 'Content-Type': file.type },
      });

      workImages.value.push(id);
    }
    catch (err) {
      submitLoading.value = false;
      useErrorHandler(err);
      return;
    }
  }

  try {
    await $trpc.work.update.mutate({
      id: work.id,
      title: state.title,
      description: state.description,
      imageIds: workImages.value,
    });
    workDirty.value.title = state.title;
    workDirty.value.description = state.description;
    modalOpen.value = false;
    toast.add({ title: '修改成功', description: '成功修改作品', color: 'success' });
    const queryCache = useQueryCache();
    await queryCache.invalidateQueries({ key: ['work.list'] });
    submitLoading.value = false;
  }
  catch (error) {
    useErrorHandler(error);
    submitLoading.value = false;
  }
}
</script>
