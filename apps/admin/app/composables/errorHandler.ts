import type { AppRouter } from '~~/server/trpc/routers';
import { TRPCClientError } from '@trpc/client';

export function useIsTRPCClientError(cause: unknown): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}

export async function useErrorHandler(err: any): Promise<void> {
  const toast = useToast();

  if (useIsTRPCClientError(err)) {
    if (err.data?.zodError) {
      for (const issue of err.data.zodError.issues) {
        toast.add({ title: 'Error', description: issue.message, color: 'error' });
      }
    }
    else {
      if (err.data?.code === 'UNAUTHORIZED') {
        onNuxtReady(() => {
          useLoginRedirect().setRedirect(useRoute().path);
          navigateTo('/admin/login');
        });
      }
      toast.add({ title: 'Error', description: err.message, color: 'error' });
    }
  }
  else {
    toast.add({ title: 'Error', description: 'An error occurred.', color: 'error' });
  }
}
