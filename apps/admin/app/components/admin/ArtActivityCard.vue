<template>
  <span class="absolute top-0">
    <UModal v-model:open="modalOpen" title="修改活动">
      <UButton variant="subtle" color="neutral" icon="lucide:edit" />
      <UPopover>
        <UButton variant="subtle" color="error" icon="lucide:trash" />
        <template #content="{ close }">
          <div class="p-4 space-y-4">
            <p>确定要删除这个活动吗？</p>
            <div class="flex gap-2 justify-end">
              <UButton label="取消" variant="outline" size="sm" @click="close" />
              <UButton
                label="删除"
                color="error"
                size="sm"
                :loading="isDeleteLoading"
                @click="deleteActivity(close)"
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

          <UFormField label="简述" name="description">
            <UInput
              v-model="state.description"
              class="w-full"
            />
          </UFormField>

          <UFormField label="描述" name="markdown">
            <UEditor
              v-slot="{ editor }"
              v-model="state.markdown"
              content-type="markdown"
              placeholder="输入活动描述..."
              class="w-full min-h-40 border border-default rounded-md"
            >
              <UEditorToolbar
                :editor="editor"
                :items="editorToolbarItems"
                class="border-b border-default px-3 py-2 overflow-x-auto"
              />
            </UEditor>
          </UFormField>

          <UFormField label="日期">
            <UInputDate v-model="dateValue" class="w-full" />
          </UFormField>

          <UCard v-for="img in activityDirty.images" :key="img.id" :ui="{ body: 'p-2!' }">
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
            保存
          </UButton>
        </UForm>
      </template>
    </UModal>
  </span>
</template>

<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui';
import type { RouterOutput } from '~/types/trpc';
import { CalendarDate } from '@internationalized/date';
import * as z from 'zod';

const props = defineProps<{
  activity: RouterOutput['artActivity']['list'][number];
}>();

const schema = z.object({
  title: z.string().min(1, '请输入标题'),
  description: z.string().optional(),
  markdown: z.string().optional(),
});

type Schema = z.infer<typeof schema>;

const { $trpc } = useNuxtApp();
const toast = useToast();
const queryCache = useQueryClient();

const activityDirty = ref(structuredClone(toRaw(props.activity)));

const state = reactive<Schema>({
  title: props.activity.title,
  description: props.activity.description ?? '',
  markdown: props.activity.markdown ?? '',
});

const dateValue = shallowRef<CalendarDate | undefined>(
  props.activity.date
    ? (() => {
        const d = new Date(props.activity.date);
        return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
      })()
    : undefined,
);

const editorToolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2' },
    { kind: 'heading', level: 3, icon: 'i-lucide-heading-3' },
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

const modalOpen = ref(false);
const images = ref<File[]>([]);
const submitLoading = ref(false);
const isDeleteLoading = ref(false);
const isDeleteImageLoading = ref(false);

async function deleteActivity(closeFn: () => void) {
  isDeleteLoading.value = true;
  try {
    await $trpc.artActivity.delete.mutate({ id: props.activity.id });
    toast.add({ title: '删除成功', color: 'success' });
    closeFn();
    queryCache.invalidateQueries({ queryKey: ['artActivity.list'] });
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    isDeleteLoading.value = false;
  }
}

async function deleteImage(imageId: number) {
  isDeleteImageLoading.value = true;
  try {
    await $trpc.artActivity.deleteImage.mutate({ id: imageId });
    activityDirty.value.images = activityDirty.value.images.filter(i => i.id !== imageId);
    toast.add({ title: '图片已删除', color: 'success' });
    queryCache.invalidateQueries({ queryKey: ['artActivity.list'] });
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    isDeleteImageLoading.value = false;
  }
}

async function onSubmit() {
  submitLoading.value = true;
  const newImageIds: number[] = [];

  for (const file of images.value) {
    try {
      const { id, url } = await $trpc.artActivity.createImage.mutate({ fileName: file.name });
      if (!id || !url) {
        toast.add({ title: `${file.name} 上传失败`, description: '获取上传地址失败', color: 'error' });
        continue;
      }
      await $fetch(url, {
        method: 'PUT',
        body: file.slice(),
        headers: { 'Content-Type': file.type },
      });
      newImageIds.push(id);
    }
    catch (err) {
      submitLoading.value = false;
      useErrorHandler(err);
      return;
    }
  }

  try {
    await $trpc.artActivity.update.mutate({
      id: props.activity.id,
      title: state.title,
      description: state.description || undefined,
      markdown: state.markdown || undefined,
      date: dateValue.value ? dateValue.value.toDate('UTC') : undefined,
      imageIds: newImageIds.length > 0 ? newImageIds : undefined,
    });

    modalOpen.value = false;
    toast.add({ title: '保存成功', color: 'success' });
    images.value = [];
    queryCache.invalidateQueries({ queryKey: ['artActivity.list'] });
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    submitLoading.value = false;
  }
}
</script>
