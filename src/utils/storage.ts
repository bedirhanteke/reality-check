import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants/storageKeys';
import {
  VaultNote,
  NotificationScheduleConfig,
  ProtocolStateData,
} from '../types/protocol';

/**
 * Generate a collision-resistant unique ID (100% offline, zero dependencies).
 */
export function generateUniqueId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Fetch all stored vault notes.
 */
export async function getNotes(): Promise<VaultNote[]> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.NOTES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load notes from storage:', error);
    return [];
  }
}

/**
 * Save notes list to storage.
 */
export async function saveNotes(notes: VaultNote[]): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.warn('Failed to save notes to storage:', error);
  }
}

/**
 * Load protocol state data with backward compatibility.
 * This is the unified single source of truth for the entire protocol.
 */
export async function getStoredProtocolState(): Promise<ProtocolStateData | null> {
  try {
    const raw =
      (await AsyncStorage.getItem(StorageKeys.PROTOCOL_STATE)) ||
      (await AsyncStorage.getItem(StorageKeys.LEGACY_PROTOCOL_STATE));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load protocol state:', error);
    return null;
  }
}

/**
 * Save protocol state data to storage.
 */
export async function saveStoredProtocolState(data: ProtocolStateData): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.PROTOCOL_STATE, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save protocol state:', error);
  }
}

/**
 * Get full schedule config derived directly from the unified protocol state.
 */
export async function getScheduleConfig(): Promise<NotificationScheduleConfig> {
  try {
    const state = await getStoredProtocolState();
    if (state) {
      return {
        scheduleType: state.scheduleType || 'interval',
        intervalHours: state.notificationIntervalHours || 12,
        customTime: state.customTime || '21:00',
      };
    }
  } catch (error) {
    console.warn('Failed to read schedule config from protocol state:', error);
  }

  return {
    scheduleType: 'interval',
    intervalHours: 12,
    customTime: '21:00',
  };
}

/**
 * Get privacy mode preference derived directly from the unified protocol state.
 */
export async function getPrivacyMode(): Promise<boolean> {
  try {
    const state = await getStoredProtocolState();
    return state?.privacyMode ?? false;
  } catch (error) {
    console.warn('Failed to read privacy mode from protocol state:', error);
    return false;
  }
}

/**
 * Get timestamp when notifications were last scheduled from unified protocol state.
 */
export async function getLastScheduledTimestamp(): Promise<number | null> {
  try {
    const state = await getStoredProtocolState();
    return state?.lastScheduledTimestamp ?? null;
  } catch (error) {
    console.warn('Failed to read last scheduled timestamp:', error);
    return null;
  }
}

/**
 * Save timestamp when notifications were scheduled into unified protocol state.
 */
export async function saveLastScheduledTimestamp(ts: number): Promise<void> {
  try {
    const state = await getStoredProtocolState();
    if (state) {
      state.lastScheduledTimestamp = ts;
      await saveStoredProtocolState(state);
    }
  } catch (error) {
    console.warn('Failed to save last scheduled timestamp:', error);
  }
}

/**
 * Clean up legacy/deprecated standalone keys (such as '@spellbreak:notificationIntervalHours')
 * so that '@spellbreak:protocol_state' remains the clean single source of truth.
 */
export async function cleanupLegacyStorageKeys(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      StorageKeys.DEPRECATED_NOTIFICATION_INTERVAL_HOURS,
      StorageKeys.DEPRECATED_SCHEDULE_TYPE,
      StorageKeys.DEPRECATED_CUSTOM_TIME,
      StorageKeys.DEPRECATED_PRIVACY_MODE,
      StorageKeys.DEPRECATED_LAST_SCHEDULED_TIMESTAMP,
    ]);
  } catch (error) {
    console.warn('Failed to clean up legacy storage keys:', error);
  }
}

/**
 * Wipe all stored app records.
 */
export async function clearAllAppData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      StorageKeys.PROTOCOL_STATE,
      StorageKeys.LEGACY_PROTOCOL_STATE,
      StorageKeys.NOTES,
      StorageKeys.DEPRECATED_NOTIFICATION_INTERVAL_HOURS,
      StorageKeys.DEPRECATED_SCHEDULE_TYPE,
      StorageKeys.DEPRECATED_CUSTOM_TIME,
      StorageKeys.DEPRECATED_PRIVACY_MODE,
      StorageKeys.DEPRECATED_LAST_SCHEDULED_TIMESTAMP,
    ]);
  } catch (error) {
    console.warn('Failed to clear app data from storage:', error);
  }
}
