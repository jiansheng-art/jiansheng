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
                  <UTextarea v-model="state.description" :rows="2" class="w-full" />
                </UFormField>

                <UFormField label="价格（分）" name="unitAmount" description="以货币最小单位计，如 CNY 的分">
                  <UInputNumber v-model="state.unitAmount" class="w-full" />
                </UFormField>

                <UFormField label="货币" name="currency">
                  <UInput v-model="state.currency" class="w-full" placeholder="cny" />
                </UFormField>

                <UFormField label="上架" name="active">
                  <USwitch v-model="state.active" />
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
import axios from 'axios';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});

const schema = z.object({
  name: z.string().min(1, '请输入名称'),
  description: z.string().optional(),
  unitAmount: z.number().int().nonnegative({ message: '请输入价格' }),
  currency: z.string().min(1, '请输入货币'),
  active: z.boolean().optional(),
});

type Schema = z.infer<typeof schema>;

const { $trpc } = useNuxtApp();

const state = reactive<Schema>({
  name: '',
  description: '',
  unitAmount: 0,
  currency: 'cny',
  active: true,
});

const modalOpen = ref(false);

const {
  data: products,
  refresh,
} = useQuery({
  key: ['product.list'],
  query: () => $trpc.product.list.query(),
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
      unitAmount: state.unitAmount,
      currency: state.currency,
      active: state.active,
      imageIds: productImageIds.value.length ? productImageIds.value : undefined,
    });

    modalOpen.value = false;
    toast.add({ title: '新建成功', description: '成功新建商品', color: 'success' });
    state.name = '';
    state.description = '';
    state.unitAmount = 0;
    state.currency = 'cny';
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
