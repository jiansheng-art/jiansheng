<template>
  <div class="min-h-[calc(100vh-var(--ui-header-height)-40px)] flex items-center">
    <div class="flex flex-col items-center w-full justify-center gap-4 p-4">
      <UPageCard class="w-full max-w-md">
        <UAuthForm
          :schema="schema"
          title="登录"
          icon="i-lucide-user"
          :fields="fields"
          :submit="{
            label: '登录',
          }"
          :loading="isLoading"
          @submit="(payload: FormSubmitEvent<Schema>) => login(payload.data)"
        />
      </UPageCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui';

import * as z from 'zod';
import { zhCN } from 'zod/locales';

z.config(zhCN());
const { $trpc } = useNuxtApp();
const toast = useToast();

const fields: AuthFormField[] = [{
  name: 'name',
  type: 'text',
  label: '用户名',
  placeholder: '输入用户名',
  required: true,
}, {
  name: 'password',
  type: 'password',
  label: '密码',
  placeholder: '输入密码',
  required: true,
}];

const schema = z.object({
  name: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type Schema = z.output<typeof schema>;

const { mutate: login, isLoading } = useMutation({
  mutation: $trpc.user.login.mutate,
  onSuccess: (res) => {
    useUserStore().login(res);
    useLoginRedirect().redirect();
    toast.add({ title: 'Success', description: 'Logged in successfully' });
  },
  onError: err => useErrorHandler(err),
});
</script>
