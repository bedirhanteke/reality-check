import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { VaultNote, NotificationScheduleConfig } from '../types/protocol';
import {
  setupNotificationChannel,
  requestNotificationPermission,
  scheduleRotatingRealityChecks,
  cancelRotatingQueue,
  checkAndRefillQueue,
  ANDROID_NOTIFICATION_CHANNEL_ID,
} from '../utils/notificationHelper';

export function useNotifications() {
  // Ensure Android notification channel is configured on hook mount
  useEffect(() => {
    setupNotificationChannel();
  }, []);

  /**
   * Request notification permission from the OS.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    return requestNotificationPermission();
  }, []);

  /**
   * Schedule lock notifications (one-time unlock notification at unlockTimestamp).
   */
  const scheduleLockNotifications = useCallback(
    async (
      unlockTimestamp: number,
      _dailyHour?: number,
      _dailyMinute?: number
    ): Promise<string[]> => {
      const scheduledIds: string[] = [];

      try {
        if (unlockTimestamp > Date.now()) {
          const unlockNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Spellbreak',
              body: 'Your objective review is ready. Open with clarity.',
              sound: true,
              data: {
                targetScreen: 'vault',
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(unlockTimestamp),
              channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
            },
          });
          if (unlockNotificationId) {
            scheduledIds.push(unlockNotificationId);
          }
        }
      } catch (error) {
        console.warn('Failed to schedule lock notification:', error);
      }

      return scheduledIds;
    },
    []
  );

  /**
   * Schedule rotating circular queue for vault notes.
   */
  const scheduleNotesQueue = useCallback(
    async (
      notes?: VaultNote[],
      scheduleConfig?: NotificationScheduleConfig,
      privacyMode?: boolean
    ): Promise<string[]> => {
      return scheduleRotatingRealityChecks(notes, scheduleConfig, privacyMode);
    },
    []
  );

  /**
   * Cancel all notifications (both lock and rotating queue).
   */
  const cancelAllNotifications = useCallback(async (ids?: string[]): Promise<void> => {
    try {
      if (ids && ids.length > 0) {
        await Promise.allSettled(
          ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
        );
      }
      await cancelRotatingQueue();
    } catch (error) {
      console.warn('Failed to cancel notifications:', error);
    }
  }, []);

  /**
   * Refill rotating queue if pending count < 5.
   */
  const refillQueueIfLow = useCallback(async (): Promise<void> => {
    await checkAndRefillQueue();
  }, []);

  /**
   * Deep-link to OS system settings for this app.
   */
  const openAppSettings = useCallback(async (): Promise<void> => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.warn('Unable to open app settings:', error);
    }
  }, []);

  return {
    requestPermission,
    scheduleLockNotifications,
    scheduleNotesQueue,
    cancelAllNotifications,
    refillQueueIfLow,
    openAppSettings,
  };
}
