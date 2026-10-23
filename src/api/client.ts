import axios, { type AxiosError } from 'axios';
import { API_URL } from '../constants/config';
import { ApiError } from '../utils/errors';

/**
 * Thin axios wrapper:
 * - the token is cached in memory (SecureStore is only read on app start),
 * - every failure is converted to an `ApiError` with a message that is safe to
 *   show to the user,
 * - a 401 on a non-auth endpoint clears the session through a callback, so the
 *   navigation tree switches back to the login screen instead of silently
 *   keeping a dead token.
 */

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

function fallbackMessage(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') {
    return 'Сервер долго не отвечает. Попробуйте ещё раз.';
  }
  if (!error.response) {
    return 'Нет соединения с сервером. Проверьте интернет.';
  }

  const status = error.response.status;
  if (status === 401) return 'Неверный email или пароль';
  if (status === 403) return 'Недостаточно прав для этого действия';
  if (status === 404) return 'Данные не найдены';
  if (status === 409) return 'Такая запись уже существует';
  if (status === 422 || status === 400) return 'Проверьте введённые данные';
  if (status === 429) return 'Слишком много попыток. Подождите немного.';
  if (status >= 500) return 'Ошибка сервера. Попробуйте позже.';
  return 'Не удалось выполнить запрос';
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      authToken = null;
      unauthorizedHandler?.();
    }

    const data = error.response?.data as { message?: string; error?: string } | undefined;
    const message = data?.message ?? data?.error ?? fallbackMessage(error);
    const code =
      !error.response && error.code !== 'ECONNABORTED'
        ? 'network'
        : error.code === 'ECONNABORTED'
          ? 'timeout'
          : undefined;

    return Promise.reject(new ApiError(message, status, code));
  },
);

export default api;
