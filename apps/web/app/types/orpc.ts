import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

export type RouterOutput = InferRouterOutputs<AppRouter>;
export type RouterInput = InferRouterInputs<AppRouter>;
