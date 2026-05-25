export const DEFAULT_API_URL = 'https://acadasign.onrender.com';

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

export function getWsBaseUrl() {
  return process.env.NEXT_PUBLIC_WS_URL || DEFAULT_API_URL;
}