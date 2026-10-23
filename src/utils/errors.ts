import axios from 'axios';

/** Normalized error thrown by the API layer; `message` is safe to show. */
export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  if (axios.isAxiosError(error)) return error.response?.status;
  return undefined;
}

/** True when the request never reached the server. */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.code === 'network' || error.code === 'timeout';
  return axios.isAxiosError(error) && !error.response;
}

/**
 * Every screen uses this helper so users see one consistent, human message
 * instead of "Request failed with status code 500".
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? fallback;
  }

  return fallback;
}
