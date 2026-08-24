import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface NotificationWarningProps {
  unlockTimestamp: number;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

export const NotificationWarning: React.FC<NotificationWarningProps> = ({
  unlockTimestamp,
  onOpenSettings,
  onDismiss,
}) => {
  const dateObj = new Date(unlockTimestamp);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NOTIFICATIONS OFF</Text>
        </View>
      </View>

      <Text style={styles.message}>
        You will not receive reminders or an unlock alert. Check back manually on{' '}
        <Text style={styles.timeHighlight}>
          {formattedDate} at {formattedTime}
        </Text>
        , or enable notifications in system settings.
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenSettings}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDismiss}
          style={styles.dismissButton}
        >
          <Text style={styles.dismissButtonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  timeHighlight: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  settingsButton: {
    backgroundColor: COLORS.surfaceHover,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  settingsButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  dismissButtonText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
});
