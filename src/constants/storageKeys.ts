export enum StorageKeys {
  PROTOCOL_STATE = '@spellbreak:protocol_state',
  LEGACY_PROTOCOL_STATE = '@reality_check:protocol_state',
  NOTES = '@spellbreak:notes',

  // Deprecated standalone keys (cleaned up and unified into PROTOCOL_STATE)
  DEPRECATED_NOTIFICATION_INTERVAL_HOURS = '@spellbreak:notificationIntervalHours',
  DEPRECATED_SCHEDULE_TYPE = '@spellbreak:scheduleType',
  DEPRECATED_CUSTOM_TIME = '@spellbreak:customTime',
  DEPRECATED_PRIVACY_MODE = '@spellbreak:privacyMode',
  DEPRECATED_LAST_SCHEDULED_TIMESTAMP = '@spellbreak:lastScheduledTimestamp',
}
