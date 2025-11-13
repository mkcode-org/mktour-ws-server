import { customAlphabet } from 'nanoid';

export const newid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789', 8);

export function getClientIp(request: Request): string {
  const headers = request.headers;

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp;

  console.log('unknown ip: ', headers.get('user-agent'));
  return 'UNKNOWN';
}
