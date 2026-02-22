<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="商品管理" />
      <UDashboardToolbar>
        <template #left>
          <UModal v-model:open="modalOpen" title="新建商品">
            <UButton color="neutral" variant="soft" icon="lucide:plus">
              新建商品
            </UButton>

            <template #body>
              <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="名称" name="name">
                  <UInput v-model="state.name" class="w-full" />
                </UFormField>

                <UFormField label="描述" name="description">
                  <UEditor
                    v-slot="{ editor }"
                    v-model="state.description"
                    content-type="markdown"
                    placeholder="输入商品描述..."
                    class="w-full min-h-40 border border-default rounded-md"
                  >
                    <UEditorToolbar
                      :editor="editor"
                      :items="editorToolbarItems"
                      class="border-b border-default px-3 py-2 overflow-x-auto"
                    />
                  </UEditor>
                </UFormField>

                <UFormField label="价格（分）" name="unitAmount" description="以货币最小单位计，如 CAD 的分">
                  <UInputNumber v-model="state.unitAmount" class="w-full" />
                </UFormField>

                <UFormField label="上架" name="active">
                  <USwitch v-model="state.active" />
                </UFormField>

                <UFormField label="关联作品" name="workId">
                  <USelect
                    v-model="state.workId"
                    :items="workOptions"
                    placeholder="选择作品"
                    class="w-full"
                  />
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
      <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <AdminProductCard v-for="item in products" :key="item.id" :product="item" />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui';
import axios from 'axios';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});

const schema = z.object({
  name: z.string().min(1, '请输入名称'),
  description: z.string().optional(),
  workId: z.number().int().positive().nullable().optional(),
  unitAmount: z.number().int().nonnegative({ message: '请输入价格' }),
  active: z.boolean().optional(),
});

type Schema = z.infer<typeof schema>;

const { $trpc } = useNuxtApp();

const state = reactive<Schema>({
  name: '',
  description: '',
  workId: undefined,
  unitAmount: 0,
  active: true,
});

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
    { kind: 'link', icon: 'i-lucide-link' },
  ],
];

const modalOpen = ref(false);

const {
  data: products,
  refresh,
} = useQuery({
  key: ['product.list'],
  query: () => $trpc.product.list.query(),
});

const { data: works } = useQuery({
  key: ['work.list'],
  query: () => $trpc.work.list.query(),
});

const workOptions = computed(() => {
  const base = [{ label: '不关联作品', value: null as number | null }];
  const items = (works.value ?? []).map(work => ({
    label: work.titleEnglish ? `${work.title} / ${work.titleEnglish}` : work.title,
    value: work.id,
  }));
  return [...base, ...items];
});

const images = ref<File[]>([]);
const productImageIds = ref<number[]>([]);

const toast = useToast();
const submitLoading = ref(false);

async function onSubmit() {
  submitLoading.value = true;

  for (const file of images.value) {
    try {
      const { id, url } = await $trpc.product.createImage.mutate({ fileName: file.name });
      if (!id || !url) {
        toast.add({ title: `${file.name} 上传失败`, description: '获取上传地址失败', color: 'error' });
        continue;
      }

      await axios.put(url, file.slice(), {
        headers: { 'Content-Type': file.type },
      });

      productImageIds.value.push(id);
    }
    catch (err) {
      submitLoading.value = false;
      useErrorHandler(err);
      return;
    }
  }

  try {
    await $trpc.product.create.mutate({
      name: state.name,
      description: state.description || undefined,
      workId: state.workId ?? null,
      unitAmount: state.unitAmount,
      active: state.active,
      imageIds: productImageIds.value.length ? productImageIds.value : undefined,
    });

    modalOpen.value = false;
    toast.add({ title: '新建成功', description: '成功新建商品', color: 'success' });
    state.name = '';
    state.description = '';
    state.workId = undefined;
    state.unitAmount = 0;
    state.active = true;
    productImageIds.value = [];
    images.value = [];
    await refresh();
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    submitLoading.value = false;
  }
}
</script>
