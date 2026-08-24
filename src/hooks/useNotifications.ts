import { useCallback, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure foreground notification presentation options
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = 'reality-check-alerts';

export function useNotifications() {
  // Ensure Android notification channel is configured
  useEffect(() => {
    async function configureAndroidChannel() {
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
            name: 'Reality Check Notifications',
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
    configureAndroidChannel();
  }, []);

  /**
   * Request notification permissions from the OS.
   * Returns true if granted, false otherwise.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const existingStatus = await Notifications.getPermissionsAsync();
      if (existingStatus.granted || existingStatus.status === 'granted') {
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
  }, []);

  /**
   * Schedule lock notifications:
   * 1. Repeating daily reminder at user-selected hour & minute.
   * 2. One-time notification at unlockTimestamp.
   *
   * Returns an array of scheduled notification identifiers.
   */
  const scheduleLockNotifications = useCallback(
    async (
      unlockTimestamp: number,
      dailyHour: number,
      dailyMinute: number
    ): Promise<string[]> => {
      const scheduledIds: string[] = [];

      try {
        // 1. Schedule repeating daily reminder mid-protocol
        const dailyNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Reality Check — Protocol Active',
            body: 'You are currently mid-protocol. Remember to evaluate your reality with objective clarity.',
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: dailyHour,
            minute: dailyMinute,
            channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
          },
        });
        if (dailyNotificationId) {
          scheduledIds.push(dailyNotificationId);
        }

        // 2. Schedule one-time unlock alert at target timestamp
        if (unlockTimestamp > Date.now()) {
          const unlockNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Reality Check',
              body: 'Your De-Romanticization review is ready. Open with an objective mind.',
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(unlockTimestamp),
              channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
            },
          });
          if (unlockNotificationId) {
            scheduledIds.push(unlockNotificationId);
          }
        }
      } catch (error) {
        console.warn('Failed to schedule lock notifications:', error);
      }

      return scheduledIds;
    },
    []
  );

  /**
   * Cancel all pending scheduled notifications (or specific ids if provided).
   */
  const cancelAllNotifications = useCallback(async (ids?: string[]): Promise<void> => {
    try {
      if (ids && ids.length > 0) {
        await Promise.allSettled(
          ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
        );
      }
      // Also cancel all to avoid any orphaned repeating daily reminders
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Failed to cancel scheduled notifications:', error);
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
    scheduleLockNotifications,
    cancelAllNotifications,
    openAppSettings,
  };
}
