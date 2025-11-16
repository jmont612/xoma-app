// Parte superior del archivo: tipos, opciones y tokens
import { getApiBaseUrl } from './config';
import { saveTokens, loadTokens } from './storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

(async () => {
  const { accessToken: storedAccess, refreshToken: storedRefresh } = await loadTokens();
  if (storedAccess || storedRefresh) {
    accessToken = storedAccess || null;
    refreshToken = storedRefresh || null;
  }
})();

// Unificado: una sola función para refresh usando el refreshToken en memoria
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    const url = `${base}/auth/refresh`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const text = await res.text();
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const json = isJson && text ? JSON.parse(text) : null;

    if (!res.ok) return false;

    const newAccess = json?.data?.accessToken as string | undefined;
    if (!newAccess) return false;

    accessToken = newAccess;
    await saveTokens(newAccess, refreshToken || '');
    return true;
  } catch {
    return false;
  }
}

// request: respeta skipAuth y reintenta una vez en 401 si no es skipAuth
async function request<T>(path: string, options: RequestOptions = {}, retryOnUnauthorized = true): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  let res: Response;
  try {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    const reqPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${base}${reqPath}`;
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && !skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e: any) {
    const err: any = new Error('No se pudo conectar con el servidor');
    err.code = 'NETWORK_ERROR';
    err.cause = e;
    try {
      const base = getApiBaseUrl().replace(/\/+$/, '');
      const reqPath = path.startsWith('/') ? path : `/${path}`;
      err.url = `${base}${reqPath}`;
    } catch {}
    throw err;
  }

  if (res.status === 401 && retryOnUnauthorized && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, false);
    }
  }

  const text = await res.text();
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson && text ? JSON.parse(text) : (text as unknown as T);

  if (!res.ok) {
    const message =
      (isJson && (data as any)?.message) ||
      (isJson && (data as any)?.error) ||
      res.statusText ||
      'Error de API';
    const err: any = new Error(String(message));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

// Exponer helpers aceptando opciones; respetan skipAuth
export function get<T>(path: string, options?: RequestOptions) {
  return request<T>(path, { ...options, method: 'GET' });
}

export function post<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>(path, { ...options, method: 'POST', body });
}

export function put<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>(path, { ...options, method: 'PUT', body });
}

export function del<T>(path: string, options?: RequestOptions) {
  return request<T>(path, { ...options, method: 'DELETE' });
}

export function patch<T>(path: string, body?: unknown, options?: RequestOptions) {
  return request<T>(path, { ...options, method: 'PATCH', body });
}