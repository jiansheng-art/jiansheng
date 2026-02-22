<template>
  <UPageCard
    :title="work.title"
    :description="work.titleEnglish ?? undefined"
    orientation="vertical"
    reverse
    :ui="{
      container: 'p-0!',
      wrapper: 'px-4! pt-4 lg:pt-0 lg:pb-4',
    }"
  >
    <UModal v-model:open="modalOpen" title="修改作品">
      <UButton class="absolute top-3 right-3 z-50" variant="subtle" color="neutral" icon="lucide:edit" />
      <UPopover>
        <UButton class="absolute top-3 right-14 z-50" variant="subtle" color="error" icon="lucide:trash" />
        <template #content="{ close }">
          <div class="p-4 space-y-4">
            <p>确定要删除这个作品吗？</p>
            <div class="flex gap-2 justify-end">
              <UButton label="取消" variant="outline" size="sm" @click="close" />
              <UButton
                label="删除"
                color="error"
                size="sm"
                :loading="isDeleteWorkLoading"
                @click="deleteWork(close)"
              />
            </div>
          </div>
        </template>
      </UPopover>

      <template #body>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="标题" name="title">
            <UInput v-model="state.title" class="w-full" />
          </UFormField>

          <UFormField label="英文标题" name="titleEnglish">
            <UInput v-model="state.titleEnglish" class="w-full" />
          </UFormField>

          <UFormField label="描述" name="description">
            <UEditor
              v-slot="{ editor }"
              v-model="state.description"
              content-type="markdown"
              placeholder="输入作品描述..."
              class="w-full min-h-40 border border-default rounded-md"
            >
              <UEditorToolbar
                :editor="editor"
                :items="editorToolbarItems"
                class="border-b border-default px-3 py-2 overflow-x-auto"
              />
            </UEditor>
          </UFormField>

          <UFormField label="系列" name="seriesId">
            <USelect
              v-model="state.seriesId"
              :items="seriesOptions"
              placeholder="选择系列"
              class="w-full"
            />
          </UFormField>

          <UFormField label="年份" name="year">
            <UInputNumber v-model="state.year" class="w-full" />
          </UFormField>

          <UFormField label="材料" name="material">
            <UInput v-model="state.material" class="w-full" />
          </UFormField>

          <UFormField label="尺寸" name="dimensions">
            <UInput v-model="state.dimensions" class="w-full" />
          </UFormField>

          <UCard v-for="img in workDirty.images" :key="img.id" :ui="{ body: 'p-2!' }">
            <div class="flex gap-2 items-center">
              <NuxtImg :src="img.url" class="w-10 aspect-square" />
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
        prev: 'sm:start-4',
        next: 'sm:end-4',
      }"
    >
      <NuxtImg :src="item.url" class="w-full aspect-square object-cover" />
    </UCarousel>
    <NuxtImg v-else-if="work.images[0]?.url" :src="work.images[0].url" class="w-full aspect-square object-cover" />
    <div v-else class="bg-muted flex items-center justify-center aspect-square object-cover">
      <Icon name="lucide:image-off" size="40" />
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui';
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
  titleEnglish: z.string().optional(),
  description: z.string().optional(),
  seriesId: z.number().int().positive().optional(),
  year: z.number().int().positive().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
});
const { $trpc } = useNuxtApp();
const queryCache = useQueryCache();
const toast = useToast();

const { data: seriesList } = useQuery({
  key: ['work.listSeries'],
  query: () => $trpc.work.listSeries.query(),
});

const seriesOptions = computed(() => {
  const base = [{ label: '不分配系列', value: null as number | null }];
  const items = (seriesList.value ?? []).map(series => ({
    label: series.titleEnglish ? `${series.title} / ${series.titleEnglish}` : series.title,
    value: series.id,
  }));
  return [...base, ...items];
});

type Schema = z.infer<typeof schema>;

const state = reactive<Schema>({
  title: work.title,
  titleEnglish: work.titleEnglish ?? undefined,
  description: work.description ?? undefined,
  seriesId: work.seriesId ?? undefined,
  year: work.year ?? undefined,
  material: work.material ?? undefined,
  dimensions: work.dimensions ?? undefined,
});

const editorToolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Heading 1' },
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Heading 2' },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold' },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic' },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline' },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list' },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered' },
    { kind: 'blockquote', icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', icon: 'i-lucide-square-code' },
    { kind: 'link', icon: 'i-lucide-link' },
  ],
];

const isDeleteImageLoading = ref(false);
const isDeleteWorkLoading = ref(false);

async function deleteWork(close: () => void) {
  isDeleteWorkLoading.value = true;
  try {
    await $trpc.work.delete.mutate({ id: work.id });
    close();
    modalOpen.value = false;
    toast.add({ title: '删除成功', description: '作品已删除', color: 'success' });
    await queryCache.invalidateQueries({ key: ['work.list'] });
    isDeleteWorkLoading.value = false;
  }
  catch (error) {
    useErrorHandler(error);
    isDeleteWorkLoading.value = false;
  }
}

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

const submitLoading = ref(false);
async function onSubmit() {
  submitLoading.value = true;
  for (const file of images.value) {
    try {
      const { id, url } = await $trpc.work.createImage.mutate({ fileName: file.name });
      if (!id || !url) {
        toast.add({ title: `${file.name} 上传失败`, description: '获取上传地址失败', color: 'error' });
        continue;
      }

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
      titleEnglish: state.titleEnglish,
      description: state.description,
      seriesId: state.seriesId,
      year: state.year,
      material: state.material,
      dimensions: state.dimensions,
      imageIds: workImages.value,
    });
    workDirty.value.title = state.title;
    workDirty.value.titleEnglish = state.titleEnglish ?? null;
    workDirty.value.description = state.description ?? null;
    workDirty.value.seriesId = state.seriesId ?? null;
    workDirty.value.year = state.year ?? null;
    workDirty.value.material = state.material ?? null;
    workDirty.value.dimensions = state.dimensions ?? null;
    modalOpen.value = false;
    toast.add({ title: '修改成功', description: '成功修改作品', color: 'success' });
    await queryCache.invalidateQueries({ key: ['work.list'] });
    submitLoading.value = false;
  }
  catch (error) {
    useErrorHandler(error);
    submitLoading.value = false;
  }
}
</script>
