import { authClient } from '~/lib/auth-client';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { data: session } = await authClient.useSession(useFetch);
  if (to.path !== '/login' && from.path !== '/login' && !session.value) {
    return navigateTo('/login');
  }
});
