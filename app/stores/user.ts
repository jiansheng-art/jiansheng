import type { RouterOutput } from '~/types/trpc';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const loggedIn = ref(false);
  const accessToken = ref<string>();

  const id = ref<number>();
  const name = ref<string>();
  const expiresAt = ref<string>();

  const login = (data: RouterOutput['user']['login'] & { avatarUrl?: string }) => {
    loggedIn.value = true;
    accessToken.value = data.accessToken;

    id.value = data.id;
    name.value = data.name;
    expiresAt.value = data.expiresAt;
  };

  const logout = async () => {
    const { $trpc } = useNuxtApp();
    try {
      await $trpc.user.logout.mutate();
      navigateTo('/');

      loggedIn.value = false;
      accessToken.value = undefined;

      id.value = undefined;
      name.value = undefined;
      expiresAt.value = undefined;
    }
    catch (e) {
      useErrorHandler(e);
    }
  };

  const isTokenExpired = (expiresAtISO: string) => {
    const expirationDate = new Date(expiresAtISO);
    return Date.now() >= expirationDate.getTime();
  };

  const isLoggedIn = () => {
    return loggedIn.value
      && accessToken.value
      && expiresAt.value
      && !isTokenExpired(expiresAt.value);
  };

  return {
    loggedIn,
    accessToken,
    id,
    name,
    expiresAt,
    login,
    logout,
    isLoggedIn,
  };
}, {
  persist: {
    storage: piniaPluginPersistedstate.cookies({
      maxAge: 30 * 24 * 60 * 60, // One month
    }),
  },
});
