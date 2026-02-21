<template>
  <UPageCard
    :title="productDirty.name"
    :description="productDirty.description ?? ''"
    orientation="vertical"
    reverse
    :ui="{
      container: 'p-0!',
      wrapper: 'px-4! pt-4 lg:pt-0 lg:pb-4',
    }"
  >
    <template #footer>
      <div class="flex items-center gap-2">
        <UBadge
          :color="productDirty.active ? 'success' : 'neutral'"
          :label="productDirty.active ? '上架' : '下架'"
          size="sm"
          variant="subtle"
        />
        <span v-if="productDirty.unitAmount != null && productDirty.currency" class="text-sm font-semibold">
          {{ formatPrice(productDirty.unitAmount, productDirty.currency) }}
        </span>
      </div>
    </template>

    <UModal v-model:open="modalOpen" title="修改商品">
      <UButton class="absolute top-3 right-3 z-50" variant="subtle" color="neutral" icon="lucide:edit" />
      <UPopover>
        <UButton class="absolute top-3 right-14 z-50" variant="subtle" color="error" icon="lucide:trash" />
        <template #content="{ close }">
          <div class="p-4 space-y-4">
            <p>确定要删除这个商品吗？</p>
            <div class="flex gap-2 justify-end">
              <UButton label="取消" variant="outline" size="sm" @click="close" />
              <UButton
                label="删除"
                color="error"
                size="sm"
                :loading="isDeleteLoading"
                @click="deleteProduct(close)"
              />
            </div>
          </div>
        </template>
      </UPopover>

      <template #body>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="名称" name="name">
            <UInput v-model="state.name" class="w-full" />
          </UFormField>

          <UFormField label="描述" name="description">
            <UTextarea v-model="state.description" :rows="2" class="w-full" />
          </UFormField>

          <UFormField label="价格（分）" name="unitAmount">
            <UInputNumber v-model="state.unitAmount" class="w-full" />
          </UFormField>

          <UFormField label="货币" name="currency">
            <UInput v-model="state.currency" class="w-full" placeholder="cny" />
          </UFormField>

          <UFormField label="上架" name="active">
            <USwitch v-model="state.active" />
          </UFormField>

          <UCard v-for="img in productDirty.images" :key="img.id" :ui="{ body: 'p-2!' }">
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
      v-if="product.images.length > 1"
      v-slot="{ item }"
      loop
      arrows
      :prev="{ variant: 'soft' }"
      :next="{ variant: 'soft' }"
      :items="product.images"
      :ui="{
        container: '',
        prev: 'sm:start-4',
        next: 'sm:end-4',
      }"
    >
      <NuxtImg :src="item.url" class="w-full aspect-square object-cover" />
    </UCarousel>
    <NuxtImg v-else-if="product.images[0]?.url" :src="product.images[0].url" class="w-full aspect-square object-cover" />
    <div v-else class="bg-muted flex items-center justify-center aspect-square object-cover">
      <Icon name="lucide:image-off" size="40" />
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';
import axios from 'axios';
import z from 'zod';

const { product } = defineProps<{
  product: RouterOutput['product']['list'][number];
}>();

const modalOpen = ref(false);
const productDirty = ref(product);

const schema = z.object({
  name: z.string().min(1, '请输入名称'),
  description: z.string().optional(),
  unitAmount: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  active: z.boolean().optional(),
});

type Schema = z.infer<typeof schema>;

const { $trpc } = useNuxtApp();
const queryCache = useQueryCache();
const toast = useToast();

const state = reactive<Schema>({
  name: product.name,
  description: product.description ?? undefined,
  unitAmount: product.unitAmount ?? undefined,
  currency: product.currency ?? undefined,
  active: product.active,
});

const isDeleteLoading = ref(false);
const isDeleteImageLoading = ref(false);

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

async function deleteProduct(close: () => void) {
  isDeleteLoading.value = true;
  try {
    await $trpc.product.delete.mutate({ id: product.id });
    close();
    modalOpen.value = false;
    toast.add({ title: '删除成功', description: '商品已删除', color: 'success' });
    await queryCache.invalidateQueries({ key: ['product.list'] });
  }
  catch (error) {
    useErrorHandler(error);
  }
  finally {
    isDeleteLoading.value = false;
  }
}

async function deleteImage(id: number) {
  isDeleteImageLoading.value = true;
  try {
    await $trpc.product.deleteImage.mutate({ id });
    productDirty.value.images = productDirty.value.images.filter(img => img.id !== id);
  }
  catch (error) {
    useErrorHandler(error);
  }
  finally {
    isDeleteImageLoading.value = false;
  }
}

const images = ref<File[]>([]);
const productImageIds = ref<number[]>([]);

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
    await $trpc.product.update.mutate({
      id: product.id,
      name: state.name,
      description: state.description,
      unitAmount: state.unitAmount,
      currency: state.currency,
      active: state.active,
      imageIds: productImageIds.value.length ? productImageIds.value : undefined,
    });

    productDirty.value.name = state.name;
    productDirty.value.description = state.description ?? null;
    productDirty.value.unitAmount = state.unitAmount ?? null;
    productDirty.value.currency = state.currency ?? null;
    productDirty.value.active = state.active ?? true;
    modalOpen.value = false;
    toast.add({ title: '修改成功', description: '成功修改商品', color: 'success' });
    await queryCache.invalidateQueries({ key: ['product.list'] });
  }
  catch (err) {
    useErrorHandler(err);
  }
  finally {
    submitLoading.value = false;
    productImageIds.value = [];
    images.value = [];
  }
}
</script>
