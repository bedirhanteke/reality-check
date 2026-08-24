import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { VaultNote, NotificationScheduleConfig } from '../types/protocol';
import {
  getNotes,
  getScheduleConfig,
  getPrivacyMode,
  saveLastScheduledTimestamp,
  getLastScheduledTimestamp,
} from './storage';

export const ANDROID_NOTIFICATION_CHANNEL_ID = 'spellbreak-alerts';
export const MAX_QUEUE_NOTIFICATIONS = 20;
export const REFILL_THRESHOLD = 5;

// Configure foreground notification presentation handler
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('Failed to configure notification handler:', e);
}

/**
 * Configure Android notification channel on startup.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
        name: 'Spellbreak Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E0E1EC',
        enableVibrate: true,
        showBadge: false,
      });
    } catch (error) {
      console.warn('Failed to configure Android notification channel:', error);
    }
  }
}

/**
 * Request notification permissions from the OS.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.status === 'granted') {
      return true;
    }

    const requestResult = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });

    return requestResult.granted || requestResult.status === 'granted';
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Cancel all scheduled rotating queue notifications.
 */
export async function cancelRotatingQueue(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel rotating notifications queue:', error);
  }
}

/**
 * Schedule or reschedule rotating queue of notifications (up to 20 notifications).
 * Supports both interval-based scheduling (6h / 12h / 24h) and specific daily time scheduling.
 */
export async function scheduleRotatingRealityChecks(
  notesOverride?: VaultNote[],
  scheduleConfigOverride?: NotificationScheduleConfig,
  privacyOverride?: boolean
): Promise<string[]> {
  const scheduledIds: string[] = [];

  try {
    const notes = notesOverride !== undefined ? notesOverride : await getNotes();
    const config = scheduleConfigOverride !== undefined ? scheduleConfigOverride : await getScheduleConfig();
    const privacyMode = privacyOverride !== undefined ? privacyOverride : await getPrivacyMode();

    // 1. Cancel existing queue first to prevent duplicate/orphaned notifications
    await cancelRotatingQueue();

    // If notes array is empty, do not schedule any notifications
    if (!notes || notes.length === 0) {
      return [];
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return [];
    }

    await setupNotificationChannel();

    const countToSchedule = Math.min(MAX_QUEUE_NOTIFICATIONS, 20);
    const now = new Date();
    await saveLastScheduledTimestamp(now.getTime());

    if (config.scheduleType === 'specific_time') {
      // Parse chosen hour & minute (e.g. '21:00')
      const [hourStr, minuteStr] = (config.customTime || '21:00').split(':');
      const targetHour = parseInt(hourStr, 10) || 21;
      const targetMinute = parseInt(minuteStr, 10) || 0;

      const targetToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        targetHour,
        targetMinute,
        0,
        0
      );

      // If target time today has already passed, start scheduling from tomorrow
      const startOffsetDays = targetToday.getTime() <= now.getTime() ? 1 : 0;

      for (let i = 0; i < countToSchedule; i++) {
        const note = notes[i % notes.length];
        const scheduledDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + startOffsetDays + i,
          targetHour,
          targetMinute,
          0,
          0
        );

        const title = 'Spellbreak — Reality Check';
        const body = privacyMode
          ? 'A recorded reality awaits. Tap to view.'
          : `Did you forget this: "${note.text}"`;

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
            data: {
              targetScreen: 'vault',
              noteId: note.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledDate,
            channelId: Platform.OS === 'android' ? ANDROID_NOTIFICATION_CHANNEL_ID : undefined,
          },
        });

        if (notificationId) {
          scheduledIds.push(notificationId);
        }
      }
    } else {
      // Interval-based scheduling (6h / 12h / 24h)
      const intervalSeconds = (config.intervalHours || 12) * 3600;

      for (let i = 0; i < countToSchedule; i++) {
        const note = notes[i % notes.length];
        const triggerSeconds = intervalSeconds * (i + 1);

        const title = 'Spellbreak — Reality Check';
        const body = privacyMode
          ? 'A recorded reality awaits. Tap to view.'
          : `Did you forget this: "${note.text}"`;

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
            data: {
              targetScreen: 'vault',
              noteId: note.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: triggerSeconds,
            repeats: false,
            channelId: Platform.OS === 'android' ? ANDROID_NOTIFICATION_CHANNEL_ID : undefined,
          },
        });

        if (notificationId) {
          scheduledIds.push(notificationId);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to schedule rotating reality checks:', error);
  }

  return scheduledIds;
}

// Alias for backwards compatibility
export const scheduleRotatingQueue = scheduleRotatingRealityChecks;

/**
 * Check if the pending scheduled notification queue has dropped below REFILL_THRESHOLD (5),
 * and automatically refill the queue if needed.
 */
export async function checkAndRefillQueue(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const spellbreakScheduled = scheduled.filter(
      (n) => n.content?.data?.targetScreen === 'vault'
    );

    if (spellbreakScheduled.length < REFILL_THRESHOLD) {
      const notes = await getNotes();
      if (notes.length > 0) {
        await scheduleRotatingRealityChecks();
      }
    }
  } catch (error) {
    console.warn('Failed to check and refill notification queue:', error);
  }
}

/**
 * Calculate the next upcoming notification timestamp based on schedule config.
 */
export function getNextReminderTimestamp(
  config: NotificationScheduleConfig,
  lastScheduledTimestamp: number | null
): number {
  if (config.scheduleType === 'specific_time') {
    const [h, m] = (config.customTime || '21:00').split(':');
    const targetH = parseInt(h, 10) || 21;
    const targetM = parseInt(m, 10) || 0;
    const now = new Date();
    const targetToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      targetH,
      targetM,
      0,
      0
    );

    if (targetToday.getTime() > now.getTime()) {
      return targetToday.getTime();
    }
    const targetTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      targetH,
      targetM,
      0,
      0
    );
    return targetTomorrow.getTime();
  } else {
    const intervalMs = (config.intervalHours || 12) * 3600 * 1000;
    const base = lastScheduledTimestamp || Date.now();
    let next = base + intervalMs;
    const now = Date.now();
    while (next <= now) {
      next += intervalMs;
    }
    return next;
  }
}
