import { ONLINE_THRESHOLD_MS } from '../constants/config';
import type { PresenceStatus } from '../types';

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

const pad = (value: number) => String(value).padStart(2, '0');

export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Russian pluralization: 1 минуту / 2 минуты / 5 минут. */
export function plural(count: number, one: string, few: string, many: string): string {
  const absolute = Math.abs(count) % 100;
  const last = absolute % 10;
  if (absolute > 10 && absolute < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const isYesterday = (date: Date, now: Date) => {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return isSameDay(date, yesterday);
};

export function formatTime(value: string | Date): string {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return '—';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}, ${formatTime(date)}`;
}

/**
 * Human-friendly "last seen" label. This is the key information on a family
 * map, so it is deliberately granular in the first hour.
 */
export function timeAgo(value?: string | null, now: number = Date.now()): string {
  const date = parseDate(value);
  if (!date) return 'нет данных';

  const diff = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) {
    return `${minutes} ${plural(minutes, 'минуту', 'минуты', 'минут')} назад`;
  }

  const hours = Math.floor(minutes / 60);
  if (isSameDay(date, new Date(now))) return `сегодня в ${formatTime(date)}`;
  if (isYesterday(date, new Date(now))) return `вчера в ${formatTime(date)}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** Compact "last seen" for chips and markers: "сейчас", "5 мин", "2 ч". */
export function shortTimeAgo(value?: string | null, now: number = Date.now()): string {
  const date = parseDate(value);
  if (!date) return '—';

  const minutes = Math.floor(Math.max(0, now - date.getTime()) / 60_000);
  if (minutes < 1) return 'сейчас';
  if (minutes < 60) return `${minutes} мин`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн`;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function presenceOf(value?: string | null, now: number = Date.now()): PresenceStatus {
  const date = parseDate(value);
  if (!date) return 'unknown';

  const diff = Math.max(0, now - date.getTime());
  if (diff <= ONLINE_THRESHOLD_MS) return 'online';
  if (diff <= 60 * 60_000) return 'recent';
  return 'offline';
}

export function formatAccuracy(accuracy?: number | null): string | null {
  if (accuracy == null || !Number.isFinite(accuracy)) return null;
  if (accuracy >= 1000) {
    return `± ${(accuracy / 1000).toFixed(1).replace('.', ',')} км`;
  }
  return `± ${Math.round(accuracy)} м`;
}

export function formatBattery(level?: number | null): string | null {
  if (level == null || !Number.isFinite(level)) return null;
  return `${Math.round(level)}%`;
}

/** Great-circle distance in meters. */
export function distanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const earthRadius = 6_371_000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const deltaLat = toRad(to.latitude - from.latitude);
  const deltaLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} м`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} км`;
}

/** mm:ss left until an ISO timestamp; used by the invite countdown. */
export function countdown(expiresAt: string, now: number = Date.now()): {
  expired: boolean;
  label: string;
} {
  const date = parseDate(expiresAt);
  if (!date) return { expired: true, label: '—' };

  const remaining = date.getTime() - now;
  if (remaining <= 0) return { expired: true, label: 'истёк' };

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { expired: false, label: `${minutes}:${pad(seconds)}` };
}
