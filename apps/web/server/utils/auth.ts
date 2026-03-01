import { eq } from 'drizzle-orm';
import * as jose from 'jose';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { accessTokens, users } from '../db/schema';
import { env } from '../env';

const encode = TextEncoder.prototype.encode.bind(new TextEncoder());
const decode = TextDecoder.prototype.decode.bind(new TextDecoder());

export async function produceAccessToken(id: number) {
  const encPublicKey = await jose.importSPKI(env.ENC_PUBLIC_KEY, 'RSA-OAEP-256');
  const signPrivateKey = await jose.importPKCS8(env.SIGN_PRIVATE_KEY, 'RS512');

  const jwt = await new jose.SignJWT({})
    .setSubject(id.toString())
    .setIssuedAt()
    .setExpirationTime(env.TOKEN_EXPIRATION_TIME)
    .setIssuer('invizible')
    .setJti(nanoid(32))
    .setProtectedHeader({
      alg: 'RS512',
      kid: env.SIGN_KID,
    })
    .sign(signPrivateKey);

  const jwe = await new jose.CompactEncrypt(encode(jwt))
    .setProtectedHeader({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
      kid: env.ENC_KID,
    })
    .encrypt(encPublicKey);

  return jwe;
}

export async function getUserFromToken(token: string) {
  try {
    const signPublicKey = await jose.importSPKI(env.SIGN_PUBLIC_KEY, 'RS512');
    const encPrivateKey = await jose.importPKCS8(env.ENC_PRIVATE_KEY, 'RSA-OAEP-256');
    const { plaintext: decryptedJwt } = await jose.compactDecrypt(token, encPrivateKey);
    const { payload } = await jose.jwtVerify(decode(decryptedJwt), signPublicKey);

    if (!payload.sub)
      throw new Error('ERR_INVALID_TOKEN');

    const user = await db.query.users.findFirst({
      where: eq(users.id, Number.parseInt(payload.sub)),
    });

    return { user };
  }
  catch (err) {
    if (err instanceof jose.errors.JWEDecryptionFailed) {
      return { err: 'ERR_JWE_DECRYPTION_FAILED' as const };
    }
    else if (err instanceof jose.errors.JWTExpired) {
      return { err: 'ERR_JWT_EXPIRED' as const };
    }
    else {
      return { err: 'ERR_INVALID_TOKEN' as const };
    }
  }
}

export async function getUserFromHeader(token: string | undefined) {
  if (!token)
    return undefined;

  // Check if token is active
  try {
    const tokenStatus = await db.query.accessTokens.findFirst({
      columns: {
        status: true,
      },
      where: eq(accessTokens.token, token),
    });

    if (!tokenStatus || tokenStatus.status !== 'active')
      return undefined;
  }
  catch {
    return undefined;
  }

  const result = await getUserFromToken(token);
  if (result.err)
    return undefined;

  return result.user;
}

// Converts env.TOKEN_EXPIRATION_TIME to milliseconds
// Modified from https://github.com/panva/jose/blob/main/src/lib/secs.ts
export function parseDuration(duration: string): number {
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const year = day * 365.25;

  const REGEX
    = /^(\+|-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;

  const matched = REGEX.exec(duration);

  if (!matched || (matched[4] && matched[1]) || !matched[2] || !matched[3]) {
    return week * 1000; // Defaults to one week
  }

  const value = Number.parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();

  let numericDate: number;

  switch (unit) {
    case 'sec':
    case 'secs':
    case 'second':
    case 'seconds':
    case 's':
      numericDate = Math.round(value);
      break;
    case 'minute':
    case 'minutes':
    case 'min':
    case 'mins':
    case 'm':
      numericDate = Math.round(value * minute);
      break;
    case 'hour':
    case 'hours':
    case 'hr':
    case 'hrs':
    case 'h':
      numericDate = Math.round(value * hour);
      break;
    case 'day':
    case 'days':
    case 'd':
      numericDate = Math.round(value * day);
      break;
    case 'week':
    case 'weeks':
    case 'w':
      numericDate = Math.round(value * week);
      break;
      // years matched
    default:
      numericDate = Math.round(value * year);
      break;
  }

  if (matched[1] === '-' || matched[4] === 'ago') {
    return -numericDate * 1000;
  }

  return numericDate * 1000;
}

export async function loginUser(
  user: typeof users.$inferSelect,
  avatarUrl: string | undefined,
  userAgent: string | undefined,
) {
  const token = await produceAccessToken(user.id);
  const expiresAt = new Date(Date.now() + parseDuration(env.TOKEN_EXPIRATION_TIME));

  await db.transaction(async (tx) => {
    await tx.insert(accessTokens).values({
      token,
      userId: user.id,
      status: 'active',
      userAgent,
      expiresAt,
    });
  });

  const { password: _password, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    accessToken: token,
    avatarUrl,
    expiresAt: expiresAt.toString(),
  };
}
