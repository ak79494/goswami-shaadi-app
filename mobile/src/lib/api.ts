import { getApiUrl } from './config';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
  }
}

let authToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export const getAuthToken = () => authToken;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

const TIMEOUT_MS = 20000;

// ngrok's free plan can put a "visit site" warning page in front of requests unless this
// header is present. Other servers ignore it.
export const TUNNEL_HEADERS = { 'ngrok-skip-browser-warning': '1' };

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...TUNNEL_HEADERS };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/api${path}`, { method, headers, body: payload, signal: controller.signal });
  } catch {
    throw networkError();
  } finally {
    clearTimeout(timer);
  }

  return parseResponse<T>(res.status, await res.text());
}

function networkError() {
  return new ApiError(
    0,
    "Can't reach the GoswamiShaadi server. Check your internet connection and try again — the server may be offline right now.",
  );
}

function parseResponse<T>(status: number, text: string): T {
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Some endpoints return plain strings (e.g. interest status).
  }

  if (status < 200 || status >= 300) {
    // Spring Security answers 401/403 when the JWT is missing or expired.
    if ((status === 401 || status === 403) && authToken) onSessionExpired?.();
    let message = `Something went wrong (${status})`;
    if (data && typeof data === 'object' && 'message' in data && data.message) message = String(data.message);
    else if (typeof data === 'string' && data && data.length < 200) message = data;
    throw new ApiError(status, message, data);
  }
  return data as T;
}

const UPLOAD_TIMEOUT_MS = 120000;

/**
 * Sends multipart form data with XMLHttpRequest. Expo's fetch (React Native's default fetch since
 * SDK 54) can't send React Native's `{ uri, name, type }` file parts, so photo uploads must go
 * through XHR. Also reports upload progress (0–1).
 */
export function upload<T>(path: string, form: FormData, onProgress?: (fraction: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getApiUrl()}/api${path}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader('Accept', 'application/json');
    for (const [key, value] of Object.entries(TUNNEL_HEADERS)) xhr.setRequestHeader(key, value);
    if (authToken) xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      try {
        resolve(parseResponse<T>(xhr.status, xhr.responseText));
      } catch (e) {
        reject(e);
      }
    };
    xhr.onerror = () => reject(networkError());
    xhr.ontimeout = () => reject(new ApiError(0, 'The upload is taking too long. Check your connection and try again.'));
    xhr.send(form);
  });
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}

/** Turns a backend path like /uploads/abc.jpg into a full URL the phone can load. */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${getApiUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** expo-image source for a backend photo, with the same tunnel header as API calls. */
export function imageSource(path?: string | null) {
  const uri = mediaUrl(path);
  return uri ? { uri, headers: TUNNEL_HEADERS } : undefined;
}
