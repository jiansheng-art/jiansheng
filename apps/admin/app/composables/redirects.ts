export function useLoginRedirectState() {
  return useCookie<string | undefined>('login_redirect', { default: () => '/admin' });
}

export function useLoginRedirect() {
  const redirectUri = useLoginRedirectState();

  const redirect = () => {
    navigateTo(redirectUri.value ?? '/admin');
    redirectUri.value = '/admin';
  };

  const setRedirect = (uri?: string) => {
    redirectUri.value = uri ?? '/admin';
  };

  return {
    redirect,
    redirectUri,
    setRedirect,
  };
}
