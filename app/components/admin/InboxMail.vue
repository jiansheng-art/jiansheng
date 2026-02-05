<template>
  <UDashboardPanel id="inbox-2">
    <UDashboardNavbar :title="mail.subject" :toggle="false">
      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          @click="emits('close')"
        />
      </template>

      <template #right>
        <UTooltip text="标记为已读">
          <UButton
            :icon="dirtyMail.unread ? 'lucide:mail-open' : 'lucide:mail'"
            color="neutral"
            variant="ghost"
            :loading="readButtonLoading"
            @click="toggleRead"
          />
        </UTooltip>

        <UTooltip text="星标">
          <UButton
            :icon="dirtyMail.starred ? 'tabler:star-filled' : 'tabler:star'" color="neutral" variant="ghost"
            :loading="starButtonLoading"
            @click="toggleStarred"
          />
        </UTooltip>
      </template>
    </UDashboardNavbar>

    <div class="flex flex-col sm:flex-row justify-between gap-1 p-4 sm:px-6 border-b border-default">
      <div class="flex items-start gap-4 sm:my-1.5">
        <UAvatar
          icon="lucide:user"
          size="3xl"
        />

        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ mail.firstName }} {{ mail.lastName }}
          </p>
          <p class="text-muted">
            {{ mail.email }}
          </p>
        </div>
      </div>

      <p v-if="mail.createdAt" class="max-sm:pl-16 text-muted text-sm sm:mt-2">
        {{ useDateFormat(mail.createdAt, 'YYYY MMM HH:mm') }}
      </p>
    </div>

    <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
      <p class="whitespace-pre-wrap">
        {{ mail.message }}
      </p>
    </div>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';

type Mail = RouterOutput['contactForm']['list'][number];

const { mail } = defineProps<{
  mail: Mail;
}>();
const emits = defineEmits(['close']);
const dirtyMail = ref({ ...mail });
watch(() => mail, (newMail) => {
  dirtyMail.value = { ...newMail };
});

const { $trpc } = useNuxtApp();
const toast = useToast();

const readButtonLoading = ref(false);
async function toggleRead() {
  try {
    readButtonLoading.value = true;
    await $trpc.contactForm.toggleRead.mutate({ id: mail.id });
    dirtyMail.value.unread = !dirtyMail.value.unread;
    const queryCache = useQueryCache();
    await queryCache.invalidateQueries({ key: ['contactForm.list'] });
    readButtonLoading.value = false;
  }
  catch {
    toast.add({
      title: '操作失败',
      description: '请稍后再试',
      color: 'error',
    });
  }
}

const starButtonLoading = ref(false);
async function toggleStarred() {
  try {
    starButtonLoading.value = true;
    await $trpc.contactForm.toggleStarred.mutate({ id: mail.id });
    dirtyMail.value.starred = !dirtyMail.value.starred;
    const queryCache = useQueryCache();
    await queryCache.invalidateQueries({ key: ['contactForm.list'] });
    starButtonLoading.value = false;
  }
  catch {
    toast.add({
      title: '操作失败',
      description: '请稍后再试',
      color: 'error',
    });
  }
}
</script>
