import { useState, useEffect, useRef } from 'react';

export interface CountdownResult {
  formattedTime: string; // e.g. "11h 59m 16s"
  colonFormattedTime: string; // e.g. "11:59:16"
  isExpired: boolean;
  totalSecondsRemaining: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(
  targetTimestamp: number | null,
  onExpire?: () => void
): CountdownResult {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const calculateRemaining = (): CountdownResult => {
    if (!targetTimestamp) {
      return {
        formattedTime: '00h 00m 00s',
        colonFormattedTime: '00:00:00',
        isExpired: true,
        totalSecondsRemaining: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const now = Date.now();
    const diffMs = targetTimestamp - now;

    if (diffMs <= 0) {
      return {
        formattedTime: '00h 00m 00s',
        colonFormattedTime: '00:00:00',
        isExpired: true,
        totalSecondsRemaining: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalHours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    const formattedHours = String(totalHours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSecs = String(seconds).padStart(2, '0');

    return {
      formattedTime: `${formattedHours}h ${formattedMinutes}m ${formattedSecs}s`,
      colonFormattedTime: `${formattedHours}:${formattedMinutes}:${formattedSecs}`,
      isExpired: false,
      totalSecondsRemaining: totalSeconds,
      days,
      hours: remainingHours,
      minutes,
      seconds,
    };
  };

  const [state, setState] = useState<CountdownResult>(calculateRemaining);
  const hasTriggeredExpire = useRef(false);

  useEffect(() => {
    hasTriggeredExpire.current = false;
    const initial = calculateRemaining();
    setState(initial);

    if (initial.isExpired && targetTimestamp) {
      if (!hasTriggeredExpire.current) {
        hasTriggeredExpire.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    const interval = setInterval(() => {
      const current = calculateRemaining();
      setState(current);

      if (current.isExpired) {
        clearInterval(interval);
        if (!hasTriggeredExpire.current) {
          hasTriggeredExpire.current = true;
          onExpireRef.current?.();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return state;
}
