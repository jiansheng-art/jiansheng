import { ORPCError } from '@orpc/client';

function issueMessage(issue: unknown): string | undefined {
  if (
    issue &&
    typeof issue === 'object' &&
    'message' in issue &&
    typeof issue.message === 'string'
  ) {
    return issue.message;
  }
}

export function useErrorHandler(err: unknown): void {
  const toast = useToast();

  if (err instanceof ORPCError) {
    const data = err.data;
    if (data && typeof data === 'object' && 'issues' in data && Array.isArray(data.issues)) {
      for (const issue of data.issues) {
        toast.add({
          title: 'Error',
          description: issueMessage(issue) ?? err.message,
          color: 'error',
        });
      }
      return;
    }

    toast.add({ title: 'Error', description: err.message, color: 'error' });
    return;
  }

  toast.add({ title: 'Error', description: 'An error occurred.', color: 'error' });
}
