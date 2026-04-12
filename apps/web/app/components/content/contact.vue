<template>
  <NuxtImg src="/hero.jpg" class="w-full h-70 object-cover pb-10" />
  <div class="flex flex-col lg:flex-row gap-20">
    <div class="basis-1/2">
      <slot />
    </div>
    <UForm :schema="schema" :state="state" class="lg:basis-2/3 space-y-4" @submit="onSubmit">
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="First Name" name="firstName">
          <UInput v-model="state.firstName" class="w-full" />
        </UFormField>
        <UFormField label="Last Name" name="lastName">
          <UInput v-model="state.lastName" class="w-full" />
        </UFormField>
      </div>

      <UFormField label="Email" name="email">
        <UInput v-model="state.email" class="w-full" />
      </UFormField>

      <UFormField label="Subject" name="subject">
        <UInput v-model="state.subject" class="w-full" />
      </UFormField>

      <UFormField label="Message" name="message">
        <UTextarea v-model="state.message" :rows="5" class="w-full" />
      </UFormField>

      <UButton size="lg" type="submit" :loading="isPending">
        Submit
      </UButton>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import * as z from 'zod';

const schema = z.object({
  firstName: z.string('First name is required').min(1, 'First name is required').max(255, 'First name is too long'),
  lastName: z.string('Last name is required').min(1, 'Last name is required').max(255, 'Last name is too long'),
  email: z.email('Invalid email'),
  subject: z.string('Subject is required').min(1, 'Subject is required').max(255, 'Subject is too long'),
  message: z.string('Message is required').min(1, 'Message is required').max(2000, 'Message is too long'),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  subject: undefined,
  message: undefined,
});

const { $trpc } = useNuxtApp();

const isPending = ref(false);
const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isPending.value = true;
  try {
    await $trpc.contactForm.create.mutate(event.data);

    toast.add({ title: 'Success', description: 'The form has been submitted.' });

    // Reset form state
    state.firstName = undefined;
    state.lastName = undefined;
    state.email = undefined;
    state.subject = undefined;
    state.message = undefined;
  }
  catch (error) {
    useErrorHandler(error);
  }
  finally {
    isPending.value = false;
  }
}
</script>
