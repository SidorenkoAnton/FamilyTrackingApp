import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Re-runs a loader on an interval while the screen is focused, and immediately
 * when the app returns to the foreground. Polling stops when the screen is
 * blurred or the app is in the background, which saves battery and data.
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      const run = () => {
        if (AppState.currentState === 'active') {
          void callbackRef.current();
        }
      };

      const interval = setInterval(run, intervalMs);
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void callbackRef.current();
      });

      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }, [enabled, intervalMs]),
  );
}

/** A ticking timestamp so "5 минут назад" labels stay fresh. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
