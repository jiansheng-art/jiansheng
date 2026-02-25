import type { PiniaColadaOptions } from '@pinia/colada';
import { PiniaColadaQueryHooksPlugin } from '@pinia/colada';
import { useErrorHandler } from './app/composables/errorHandler';

export default {
  plugins: [
    PiniaColadaQueryHooksPlugin({
      onError(error) {
        if (!import.meta.client)
          return;

        if (!window.location.pathname.startsWith('/admin'))
          return;

        useErrorHandler(error);
      },
    }),
  ],
} satisfies PiniaColadaOptions;
