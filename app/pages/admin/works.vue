<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="作品管理" />
      <UDashboardToolbar>
        <template #left>
          <UModal v-model:open="modalOpen" title="新建作品">
            <UButton color="neutral" variant="soft" icon="lucide:plus">
              新建作品
            </UButton>

            <template #body>
              <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="标题" name="title">
                  <UInput v-model="state.title" class="w-full" />
                </UFormField>

                <UFormField label="描述" name="description">
                  <UTextarea v-model="state.description" :rows="2" class="w-full" />
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
      <UScrollArea
        v-slot="{ item }"
        :items="works"
        orientation="vertical"
        :virtualize="{
          gap: 24,
          lanes: 4,
          estimateSize: 480,
        }"
        class="w-full h-[calc(100vh-var(--ui-header-height))] p-px"
      >
        <WorkCard :work="item" />
      </UScrollArea>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import axios from 'axios';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});

const schema = z.object({
  title: z.string().min(1, '请输入标题'),
  description: z.string().min(1, '请输入描述'),
});

const { $trpc } = useNuxtApp();

type Schema = z.infer<typeof schema>;

const state = reactive<Schema>({
  title: '',
  description: '',
});

const modalOpen = ref(false);

const {
  data: works,
  refresh,
} = useQuery({
  key: ['work.list'],
  query: () => $trpc.work.list.query(),
});

const images = ref<File[]>([]);
const workImages = ref<number[]>([]);

const toast = useToast();
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

  await $trpc.work.create.mutate({
    title: state.title,
    description: state.description,
    imageIds: workImages.value,
  });

  modalOpen.value = false;
  toast.add({ title: '新建成功', description: '成功新建新作品', color: 'success' });
  submitLoading.value = false;
  state.description = '';
  state.title = '';
  workImages.value = [];
  await refresh();
}
</script>
