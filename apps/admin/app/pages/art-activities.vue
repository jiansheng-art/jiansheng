<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="艺术活动管理" />
      <UDashboardToolbar>
        <template #left>
          <UModal v-model:open="modalOpen" title="新建活动">
            <UButton color="neutral" variant="soft" icon="lucide:plus">
              新建活动
            </UButton>

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

                <UFormField name="image" label="图片">
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
                  创建
                </UButton>
              </UForm>
            </template>
          </UModal>
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <UChangelogVersions :indicator-motion="false">
        <UChangelogVersion
          v-for="item in activities"
          :key="item.id"
          :title="item.title"
          :description="item.description ?? undefined"
          :date="item.date ? new Date(item.date).toLocaleDateString('zh-CN') : undefined"
          :image="item.images[0]?.url ?? ''"
          :ui="{ image: 'p-2 border border-default' }"
        >
          <template #body>
            <div class="space-y-4">
              <MarkdownViewer
                v-if="item.markdown"
                :markdown="item.markdown"
              />
              <div class="flex justify-end">
                <AdminArtActivityCard :activity="item" />
              </div>
            </div>
          </template>
        </UChangelogVersion>
      </UChangelogVersions>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date';
import type { EditorToolbarItem } from '@nuxt/ui';
import axios from 'axios';
import * as z from 'zod';

const schema = z.object({
  title: z.string().min(1, '请输入标题'),
  description: z.string().optional(),
  markdown: z.string().optional(),
});

type Schema = z.infer<typeof schema>;

const { $trpc } = useNuxtApp();
const toast = useToast();

const state = reactive<Schema>({
  title: '',
  description: '',
  markdown: '',
});

const dateValue = shallowRef<CalendarDate>();

const editorToolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'heading', level: 1, icon: 'i-lucide-heading-1' },
    { kind: 'heading', level: 2, icon: 'i-lucide-heading-2' },
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

const {
  data: activities,
  refetch,
  suspense,
} = useQuery({
  queryKey: ['artActivity.list'],
  queryFn: () => $trpc.artActivity.list.query(),
});

await suspense();

async function onSubmit() {
  submitLoading.value = true;
  const imageIds: number[] = [];

  for (const file of images.value) {
    try {
      const { id, url } = await $trpc.artActivity.createImage.mutate({ fileName: file.name });
      if (!id || !url) {
        toast.add({ title: `${file.name} 上传失败`, description: '获取上传地址失败', color: 'error' });
        continue;
      }
      await axios.put(url, file.slice(), {
        headers: { 'Content-Type': file.type },
      });
      imageIds.push(id);
    }
    catch (err) {
      submitLoading.value = false;
      useErrorHandler(err);
      return;
    }
  }

  try {
    await $trpc.artActivity.create.mutate({
      title: state.title,
      description: state.description || undefined,
      markdown: state.markdown || undefined,
      date: dateValue.value ? dateValue.value.toDate('UTC') : undefined,
      imageIds,
    });

    modalOpen.value = false;
    toast.add({ title: '新建成功', description: '成功新建活动', color: 'success' });
    state.title = '';
    state.description = '';
    state.markdown = '';
    dateValue.value = undefined;
    images.value = [];
    await refetch();
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    submitLoading.value = false;
  }
}
</script>
