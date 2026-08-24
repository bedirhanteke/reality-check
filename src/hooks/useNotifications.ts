import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  setupNotificationChannel,
  requestNotificationPermission,
  cancelRotatingQueue,
} from '../utils/notificationHelper';

export function useNotifications() {
  // Ensure Android notification channel is configured on mount
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
   * Cancel all notifications.
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
    cancelAllNotifications,
    openAppSettings,
  };
}
