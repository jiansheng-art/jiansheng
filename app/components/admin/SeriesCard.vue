<template>
  <UCard :ui="{ body: 'space-y-2' }">
    <div class="flex justify-end gap-2 relative">
      <UModal v-model:open="modalOpen" title="编辑系列">
        <UButton
          variant="soft"
          color="neutral"
          icon="lucide:edit"
          class="absolute top-3 right-3 z-50"
          @click="openEditSeries"
        />

        <template #body>
          <UForm :schema="seriesSchema" :state="editSeriesState" class="space-y-4" @submit="onUpdateSeries">
            <UFormField label="标题" name="title">
              <UInput v-model="editSeriesState.title" class="w-full" />
            </UFormField>

            <UFormField label="英文标题" name="titleEnglish">
              <UInput v-model="editSeriesState.titleEnglish" class="w-full" />
            </UFormField>

            <UFormField label="描述" name="description">
              <UTextarea v-model="editSeriesState.description" :rows="2" class="w-full" />
            </UFormField>

            <UButton type="submit" :loading="seriesUpdateLoading">
              保存修改
            </UButton>
          </UForm>
        </template>
      </UModal>

      <UPopover>
        <UButton variant="soft" color="error" icon="lucide:trash" class="absolute top-3 right-14 z-50" />
        <template #content="{ close }">
          <div class="p-4 space-y-4">
            <p class="text-sm">
              确定要删除系列「{{ series.title }}」吗？
            </p>
            <div class="flex justify-end gap-2">
              <UButton label="取消" variant="outline" size="sm" @click="close" />
              <UButton
                label="删除"
                color="error"
                size="sm"
                :loading="seriesDeleteLoading"
                @click="onDeleteSeries(close)"
              />
            </div>
          </div>
        </template>
      </UPopover>
    </div>

    <p class="text-2xl font-semibold">
      {{ series.title }}
    </p>
    <p v-if="series.titleEnglish" class="text-sm text-muted font-latin-text-serif">
      {{ series.titleEnglish }}
    </p>
    <p v-if="series.description" class="text-sm text-muted">
      {{ series.description }}
    </p>
  </UCard>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';
import * as z from 'zod';

const { series } = defineProps<{
  series: RouterOutput['work']['listSeries'][number];
}>();

const emit = defineEmits<{
  changed: [];
}>();

const seriesSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  titleEnglish: z.string().optional(),
  description: z.string().optional(),
});

type SeriesSchema = z.infer<typeof seriesSchema>;

const editSeriesState = reactive<SeriesSchema>({
  title: '',
  titleEnglish: '',
  description: '',
});

const { $trpc } = useNuxtApp();
const toast = useToast();

const modalOpen = ref(false);
const seriesUpdateLoading = ref(false);
const seriesDeleteLoading = ref(false);

function openEditSeries() {
  editSeriesState.title = series.title;
  editSeriesState.titleEnglish = series.titleEnglish ?? '';
  editSeriesState.description = series.description ?? '';
}

async function onUpdateSeries() {
  seriesUpdateLoading.value = true;
  try {
    await $trpc.work.updateSeries.mutate({
      id: series.id,
      title: editSeriesState.title,
      titleEnglish: editSeriesState.titleEnglish || undefined,
      description: editSeriesState.description || undefined,
    });

    toast.add({ title: '更新成功', description: '系列已更新', color: 'success' });
    modalOpen.value = false;
    emit('changed');
    seriesUpdateLoading.value = false;
  }
  catch (error) {
    seriesUpdateLoading.value = false;
    useErrorHandler(error);
  }
}

async function onDeleteSeries(close: () => void) {
  seriesDeleteLoading.value = true;
  try {
    await $trpc.work.deleteSeries.mutate({ id: series.id });
    toast.add({ title: '删除成功', description: '系列已删除', color: 'success' });
    close();
    emit('changed');
    seriesDeleteLoading.value = false;
  }
  catch (error) {
    seriesDeleteLoading.value = false;
    useErrorHandler(error);
  }
}
</script>
