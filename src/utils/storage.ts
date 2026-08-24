import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants/storageKeys';
import {
  VaultNote,
  ScheduleType,
  NotificationIntervalHours,
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
 * Add a new note and return the updated notes list.
 */
export async function addNote(text: string): Promise<{ newNote: VaultNote; notes: VaultNote[] }> {
  const currentNotes = await getNotes();
  const newNote: VaultNote = {
    id: generateUniqueId(),
    text: text.trim(),
    createdAt: Date.now(),
  };
  const updatedNotes = [newNote, ...currentNotes];
  await saveNotes(updatedNotes);
  return { newNote, notes: updatedNotes };
}

/**
 * Delete a note by id and return the updated notes list.
 */
export async function deleteNote(id: string): Promise<VaultNote[]> {
  const currentNotes = await getNotes();
  const updatedNotes = currentNotes.filter((note) => note.id !== id);
  await saveNotes(updatedNotes);
  return updatedNotes;
}

/**
 * Get schedule type (default: 'interval').
 */
export async function getScheduleType(): Promise<ScheduleType> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.SCHEDULE_TYPE);
    if (raw === 'specific_time' || raw === 'interval') {
      return raw;
    }
    return 'interval';
  } catch (error) {
    console.warn('Failed to load schedule type:', error);
    return 'interval';
  }
}

/**
 * Save schedule type.
 */
export async function saveScheduleType(type: ScheduleType): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.SCHEDULE_TYPE, type);
  } catch (error) {
    console.warn('Failed to save schedule type:', error);
  }
}

/**
 * Get notification interval in hours (default: 12).
 */
export async function getNotificationIntervalHours(): Promise<NotificationIntervalHours> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.NOTIFICATION_INTERVAL_HOURS);
    if (!raw) return 12;
    const parsed = parseInt(raw, 10);
    if (parsed === 6 || parsed === 12 || parsed === 24) {
      return parsed as NotificationIntervalHours;
    }
    return 12;
  } catch (error) {
    console.warn('Failed to load notification interval:', error);
    return 12;
  }
}

/**
 * Save notification interval in hours.
 */
export async function saveNotificationIntervalHours(hours: NotificationIntervalHours): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.NOTIFICATION_INTERVAL_HOURS, hours.toString());
  } catch (error) {
    console.warn('Failed to save notification interval:', error);
  }
}

/**
 * Get custom daily reminder time (default: '21:00').
 */
export async function getCustomTime(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.CUSTOM_TIME);
    return raw && raw.length === 5 ? raw : '21:00';
  } catch (error) {
    console.warn('Failed to load custom time:', error);
    return '21:00';
  }
}

/**
 * Save custom daily reminder time.
 */
export async function saveCustomTime(time: string): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.CUSTOM_TIME, time);
  } catch (error) {
    console.warn('Failed to save custom time:', error);
  }
}

/**
 * Get full schedule config.
 */
export async function getScheduleConfig(): Promise<NotificationScheduleConfig> {
  const scheduleType = await getScheduleType();
  const intervalHours = await getNotificationIntervalHours();
  const customTime = await getCustomTime();
  return { scheduleType, intervalHours, customTime };
}

/**
 * Save full schedule config.
 */
export async function saveScheduleConfig(config: NotificationScheduleConfig): Promise<void> {
  await saveScheduleType(config.scheduleType);
  await saveNotificationIntervalHours(config.intervalHours);
  await saveCustomTime(config.customTime);
}

/**
 * Get privacy mode preference (default: false).
 */
export async function getPrivacyMode(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.PRIVACY_MODE);
    return raw === 'true';
  } catch (error) {
    console.warn('Failed to load privacy mode:', error);
    return false;
  }
}

/**
 * Save privacy mode preference.
 */
export async function savePrivacyMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.PRIVACY_MODE, enabled ? 'true' : 'false');
  } catch (error) {
    console.warn('Failed to save privacy mode:', error);
  }
}

/**
 * Get timestamp when notifications were last scheduled.
 */
export async function getLastScheduledTimestamp(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.LAST_SCHEDULED_TIMESTAMP);
    return raw ? parseInt(raw, 10) : null;
  } catch (error) {
    console.warn('Failed to load last scheduled timestamp:', error);
    return null;
  }
}

/**
 * Save timestamp when notifications were scheduled.
 */
export async function saveLastScheduledTimestamp(ts: number): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.LAST_SCHEDULED_TIMESTAMP, ts.toString());
  } catch (error) {
    console.warn('Failed to save last scheduled timestamp:', error);
  }
}

/**
 * Load protocol state data with backward compatibility.
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
 * Save protocol state data.
 */
export async function saveStoredProtocolState(data: ProtocolStateData): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.PROTOCOL_STATE, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save protocol state:', error);
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
      StorageKeys.SCHEDULE_TYPE,
      StorageKeys.NOTIFICATION_INTERVAL_HOURS,
      StorageKeys.CUSTOM_TIME,
      StorageKeys.PRIVACY_MODE,
      StorageKeys.LAST_SCHEDULED_TIMESTAMP,
    ]);
  } catch (error) {
    console.warn('Failed to clear app data from storage:', error);
  }
}
