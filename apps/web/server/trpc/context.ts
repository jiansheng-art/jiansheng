import type { H3Event } from 'h3';
import { getUserFromHeader } from '../utils/auth';

export async function createContext(event: H3Event) {
  const token = getRequestHeader(event, 'Authorization');
  const userAgent = getRequestHeader(event, 'user-agent');
  const user = await getUserFromHeader(token);

  return {
    user,
    token,
    userAgent,
    event,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
