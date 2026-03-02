<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="网页内容" />

      <UDashboardToolbar>
        <UNavigationMenu :items="menuItems" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UForm :schema="schema" :state="currentState" class="space-y-4 w-full lg:max-w-4xl mx-auto" @submit="() => onSubmit(selectedSlug)">
        <UFormField label="标题" name="title">
          <UInput v-model="currentState.title" class="w-full" />
        </UFormField>

        <UFormField label="描述" name="description">
          <UTextarea v-model="currentState.description" :rows="3" class="w-full" />
        </UFormField>

        <UFormField label="Markdown 内容" name="markdown">
          <UEditor
            v-slot="{ editor }"
            v-model="currentState.markdown"
            content-type="markdown"
            placeholder="输入页面内容..."
            :ui="{ base: 'p-8 sm:px-16' }"
            class="w-full min-h-80 border border-default"
          >
            <UEditorToolbar
              :editor="editor"
              :items="editorToolbarItems"
              class="border-b border-default px-3 py-2 overflow-x-auto"
            />
          </UEditor>
        </UFormField>

        <UButton type="submit" :loading="isSaving[selectedSlug]">
          保存
        </UButton>
      </UForm>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { EditorToolbarItem, NavigationMenuItem } from '@nuxt/ui';
import * as z from 'zod';

const { $trpc } = useNuxtApp();
const toast = useToast();

const schema = z.object({
  title: z.string().min(1, '请输入标题'),
  description: z.string().optional(),
  markdown: z.string().min(1, '请输入内容'),
});

type PageSlug = 'about' | 'contact';
type FormState = z.infer<typeof schema>;

const selectedSlug = ref<PageSlug>('about');

const menuItems = computed<NavigationMenuItem[][]>(() => [[
  {
    label: 'About 页面',
    active: selectedSlug.value === 'about',
    onSelect: (e: Event) => {
      e.preventDefault();
      selectedSlug.value = 'about';
    },
  },
  {
    label: 'Contact 页面',
    active: selectedSlug.value === 'contact',
    onSelect: (e: Event) => {
      e.preventDefault();
      selectedSlug.value = 'contact';
    },
  },
]]);

const states = reactive<Record<PageSlug, FormState>>({
  about: {
    title: '',
    description: '',
    markdown: '',
  },
  contact: {
    title: '',
    description: '',
    markdown: '',
  },
});

const isSaving = reactive<Record<PageSlug, boolean>>({
  about: false,
  contact: false,
});

const currentState = computed(() => states[selectedSlug.value]);

const editorToolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'heading', level: 1, icon: 'i-lucide-heading-1' },
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

const { data: pages, refetch, suspense } = useQuery({
  queryKey: ['pageContent.list'],
  queryFn: () => $trpc.pageContent.list.query(),
});

await suspense();

watch(
  pages,
  (items) => {
    if (!items) {
      return;
    }

    for (const slug of ['about', 'contact'] as const) {
      const page = items.find(item => item.slug === slug);
      if (!page) {
        continue;
      }

      states[slug].title = page.title;
      states[slug].description = page.description ?? '';
      states[slug].markdown = page.markdown;
    }
  },
  { immediate: true },
);

async function onSubmit(slug: PageSlug) {
  isSaving[slug] = true;
  try {
    await $trpc.pageContent.upsert.mutate({
      slug,
      title: states[slug].title,
      description: states[slug].description || undefined,
      markdown: states[slug].markdown,
    });

    toast.add({ title: '保存成功', description: '网页内容已更新', color: 'success' });
    await refetch();
  }
  catch (error) {
    useErrorHandler(error);
  }
  finally {
    isSaving[slug] = false;
  }
}
</script>
