<template>
  <div class="overflow-y-auto divide-y divide-default">
    <div
      v-for="(mail, index) in mails"
      :key="index"
      :ref="(el) => { if (el) mailsRefs[mail.id] = el as Element }"
    >
      <div
        class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
        :class="[
          selectedMail && selectedMail.id === mail.id
            ? 'border-primary bg-primary/10'
            : 'border-bg hover:border-primary hover:bg-primary/5',
          mail.unread ? 'text-highlighted' : 'text-toned',
        ]"
        @click="selectedMail = mail"
      >
        <div class="flex items-center justify-between" :class="[mail.unread && 'font-semibold']">
          <div class="flex items-center gap-1">
            <UIcon v-if="mail.starred" name="tabler:star-filled" />
            {{ mail.firstName }} {{ mail.lastName }}
          </div>

          <span v-if="mail.createdAt">
            {{ useTimeAgo(mail.createdAt) }}
          </span>
        </div>
        <p class="truncate" :class="[mail.unread && 'font-semibold']">
          {{ mail.subject }}
        </p>
        <p class="text-dimmed line-clamp-1">
          {{ mail.message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~/types/trpc';

type Mail = RouterOutput['contactForm']['list'][number];
const props = defineProps<{
  mails: Mail[];
}>();

const mailsRefs = ref<Element[]>([]);

const selectedMail = defineModel<Mail | null>();

watch(selectedMail, () => {
  if (!selectedMail.value) {
    return;
  }
  const ref = mailsRefs.value[selectedMail.value.id];
  if (ref) {
    ref.scrollIntoView({ block: 'nearest' });
  }
});

defineShortcuts({
  arrowdown: () => {
    const index = props.mails.findIndex((mail: Mail) => mail.id === selectedMail.value?.id);

    if (index === -1) {
      selectedMail.value = props.mails[0];
    }
    else if (index < props.mails.length - 1) {
      selectedMail.value = props.mails[index + 1];
    }
  },
  arrowup: () => {
    const index = props.mails.findIndex((mail: Mail) => mail.id === selectedMail.value?.id);

    if (index === -1) {
      selectedMail.value = props.mails[props.mails.length - 1];
    }
    else if (index > 0) {
      selectedMail.value = props.mails[index - 1];
    }
  },
});
</script>
