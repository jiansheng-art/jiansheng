<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...session?.data?.user,
        label: session?.data?.user.name,
        trailingIcon: 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`,
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import { authClient } from '~/lib/auth-client';

const colorMode = useColorMode();
const session = authClient.useSession();

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: session.value?.data?.user.name,
  avatar: {
    icon: 'lucide:user',
  },
}], [{
  label: 'Appearance',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Light',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault();

      colorMode.preference = 'light';
    },
  }, {
    label: 'Dark',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.preference = 'dark';
      }
    },
    onSelect(e: Event) {
      e.preventDefault();
    },
  }],
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out',
  onSelect: () => {
    try {
      authClient.signOut();
      navigateTo('/login');
    }
    catch (error) {
      const toast = useToast();
      toast.add({ title: 'Logout failed', description: (error as Error).message, color: 'error' });
    }
  },
}]]));
</script>
