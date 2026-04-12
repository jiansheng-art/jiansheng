import { i18n } from '@better-auth/i18n';
import { db } from '@jiansheng/shared/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, username } from 'better-auth/plugins';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    username(),
    admin(),
    i18n({
      defaultLocale: 'zh-CN',
      translations: {
        'zh-CN': {
          INVALID_USERNAME_OR_PASSWORD: '用户名或密码错误',
        },
      },
    }),
  ],
});
