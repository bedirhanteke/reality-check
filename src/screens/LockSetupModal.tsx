import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/colors';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useNotifications } from '../hooks/useNotifications';

type DurationPreset = '24h' | '48h' | 'custom';

export interface LockConfirmationPayload {
  durationMs: number;
  notificationSettings: {
    granted: boolean;
    dailyHour: number | null;
    dailyMinute: number | null;
    scheduledIds: string[];
  };
}

export interface LockSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmLock: (payload: LockConfirmationPayload) => void;
}

const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_24_HOURS = 24 * MS_IN_HOUR;
const MS_IN_48_HOURS = 48 * MS_IN_HOUR;

export const LockSetupModal: React.FC<LockSetupModalProps> = ({
  visible,
  onClose,
  onConfirmLock,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DurationPreset>('24h');

  // Custom unlock target date (minimum +1 hour from now, default +3 days)
  const [customUnlockDate, setCustomUnlockDate] = useState<Date>(
    new Date(Date.now() + 72 * MS_IN_HOUR)
  );

  // Android picker step management
  const [androidPickerMode, setAndroidPickerMode] = useState<'date' | 'time' | null>(null);

  // Daily reminder time state (defaults to 9:00 PM or current time)
  const [dailyReminderDate, setDailyReminderDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0); // Default to 9:00 PM
    return d;
  });
  const [showReminderPicker, setShowReminderPicker] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { requestPermission, scheduleLockNotifications } = useNotifications();

  const getEffectiveDurationMs = (): number => {
    const minAllowedTimestamp = Date.now() + MS_IN_HOUR;
    switch (selectedPreset) {
      case '24h':
        return MS_IN_24_HOURS;
      case '48h':
        return MS_IN_48_HOURS;
      case 'custom': {
        const targetTime = customUnlockDate.getTime();
        return Math.max(targetTime - Date.now(), MS_IN_HOUR);
      }
      default:
        return MS_IN_24_HOURS;
    }
  };

  // Custom Date/Time Handler for iOS & Android
  const handleCustomDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (androidPickerMode === 'date') {
        setAndroidPickerMode(null);
        if (selectedDate) {
          // Merge chosen date with current custom time
          const merged = new Date(selectedDate);
          merged.setHours(customUnlockDate.getHours(), customUnlockDate.getMinutes(), 0, 0);
          setCustomUnlockDate(merged);
          // Open time picker step
          setTimeout(() => {
            setAndroidPickerMode('time');
          }, 100);
        }
      } else if (androidPickerMode === 'time') {
        setAndroidPickerMode(null);
        if (selectedDate) {
          const merged = new Date(customUnlockDate);
          merged.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
          // Enforce minimum 1 hour in the future
          const minTime = Date.now() + MS_IN_HOUR;
          if (merged.getTime() < minTime) {
            setCustomUnlockDate(new Date(minTime + 5 * 60 * 1000));
          } else {
            setCustomUnlockDate(merged);
          }
        }
      }
    } else {
      // iOS
      if (selectedDate) {
        const minTime = Date.now() + MS_IN_HOUR;
        if (selectedDate.getTime() < minTime) {
          setCustomUnlockDate(new Date(minTime));
        } else {
          setCustomUnlockDate(selectedDate);
        }
      }
    }
  };

  const handleReminderTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowReminderPicker(false);
    }
    if (selectedDate) {
      setDailyReminderDate(selectedDate);
    }
  };

  const proceedWithPermissionAndLock = async () => {
    setIsSubmitting(true);
    const durationMs = getEffectiveDurationMs();
    const unlockTimestamp = Date.now() + durationMs;
    const dailyHour = dailyReminderDate.getHours();
    const dailyMinute = dailyReminderDate.getMinutes();

    try {
      const granted = await requestPermission();
      let scheduledIds: string[] = [];

      if (granted) {
        scheduledIds = await scheduleLockNotifications(
          unlockTimestamp,
          dailyHour,
          dailyMinute
        );
      }

      onConfirmLock({
        durationMs,
        notificationSettings: {
          granted,
          dailyHour,
          dailyMinute,
          scheduledIds,
        },
      });
    } catch (error) {
      console.warn('Error during lock confirmation:', error);
      onConfirmLock({
        durationMs,
        notificationSettings: {
          granted: false,
          dailyHour,
          dailyMinute,
          scheduledIds: [],
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPress = () => {
    Alert.alert(
      'Daily Reminder & Unlock Alert',
      'Would you like Reality Check to send a quiet daily reminder and notify you when your cool-down ends?',
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: () => {
            const durationMs = getEffectiveDurationMs();
            onConfirmLock({
              durationMs,
              notificationSettings: {
                granted: false,
                dailyHour: dailyReminderDate.getHours(),
                dailyMinute: dailyReminderDate.getMinutes(),
                scheduledIds: [],
              },
            });
          },
        },
        {
          text: 'Enable Notifications',
          onPress: proceedWithPermissionAndLock,
        },
      ]
    );
  };

  const formattedReminderTime = dailyReminderDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedCustomDate = customUnlockDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const minimumCustomDate = new Date(Date.now() + MS_IN_HOUR);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>Cool-Down Duration</Text>
              <Text style={styles.explanation}>
                Give your mind time to settle. You can revisit and edit your answers anytime, but
                your full review will unlock once the timer completes.
              </Text>
            </View>

            {/* Duration Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECT DURATION</Text>

              {/* 24 Hours */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedPreset('24h')}
                style={[
                  styles.optionCard,
                  selectedPreset === '24h' && styles.optionCardSelected,
                ]}
              >
                <View style={styles.radioRow}>
                  <View style={styles.radioOuter}>
                    {selectedPreset === '24h' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>24 Hours</Text>
                    <Text style={styles.optionSublabel}>Standard reset for emotional clarity</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 48 Hours */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedPreset('48h')}
                style={[
                  styles.optionCard,
                  selectedPreset === '48h' && styles.optionCardSelected,
                ]}
              >
                <View style={styles.radioRow}>
                  <View style={styles.radioOuter}>
                    {selectedPreset === '48h' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>48 Hours</Text>
                    <Text style={styles.optionSublabel}>Deep reset to decouple persistent thought loops</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Custom Date / Time */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedPreset('custom');
                  if (Platform.OS === 'android') {
                    setAndroidPickerMode('date');
                  }
                }}
                style={[
                  styles.optionCard,
                  selectedPreset === 'custom' && styles.optionCardSelected,
                ]}
              >
                <View style={styles.radioRow}>
                  <View style={styles.radioOuter}>
                    {selectedPreset === 'custom' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>Custom Date & Time</Text>
                    <Text style={styles.optionSublabel}>
                      {selectedPreset === 'custom'
                        ? `Target: ${formattedCustomDate}`
                        : 'Choose a specific date and time (min. 1 hour)'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Custom Date Picker Interface */}
              {selectedPreset === 'custom' && (
                <View style={styles.customPickerContainer}>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.iosPickerWrapper}>
                      <DateTimePicker
                        value={customUnlockDate}
                        mode="datetime"
                        display="spinner"
                        minimumDate={minimumCustomDate}
                        themeVariant="dark"
                        onChange={handleCustomDateChange}
                        textColor={COLORS.textPrimary}
                      />
                    </View>
                  ) : (
                    <Button
                      variant="secondary"
                      title={`Select Date & Time (${formattedCustomDate})`}
                      onPress={() => setAndroidPickerMode('date')}
                      style={styles.changeDateBtn}
                    />
                  )}

                  {/* Android Pickers */}
                  {androidPickerMode === 'date' && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={customUnlockDate}
                      mode="date"
                      minimumDate={minimumCustomDate}
                      onChange={handleCustomDateChange}
                    />
                  )}
                  {androidPickerMode === 'time' && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={customUnlockDate}
                      mode="time"
                      onChange={handleCustomDateChange}
                    />
                  )}
                </View>
              )}
            </View>

            {/* Daily Reminder Time Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DAILY REMINDER</Text>
              <Card style={styles.reminderCard}>
                <Text style={styles.reminderExpl}>
                  Set a daily moment to stay centered while mid-protocol.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowReminderPicker(true)}
                  style={styles.reminderTimeButton}
                >
                  <Text style={styles.reminderTimeLabel}>Reminder Time</Text>
                  <View style={styles.timeTag}>
                    <Text style={styles.timeTagText}>{formattedReminderTime}</Text>
                  </View>
                </TouchableOpacity>

                {showReminderPicker && (
                  <View style={styles.timePickerContainer}>
                    <DateTimePicker
                      value={dailyReminderDate}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant="dark"
                      textColor={COLORS.textPrimary}
                      onChange={handleReminderTimeChange}
                    />
                    {Platform.OS === 'ios' && (
                      <Button
                        variant="ghost"
                        title="Done"
                        onPress={() => setShowReminderPicker(false)}
                      />
                    )}
                  </View>
                )}
              </Card>
            </View>

            {/* Action Buttons */}
            <View style={styles.footerActions}>
              <Button
                variant="primary"
                title="Start Cool-Down"
                loading={isSubmitting}
                onPress={handleConfirmPress}
              />
              <Button
                variant="ghost"
                title="Cancel"
                disabled={isSubmitting}
                onPress={onClose}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
    gap: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  explanation: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 14,
  },
  optionCardSelected: {
    backgroundColor: COLORS.surfaceHover,
    borderColor: COLORS.accent,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionSublabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  customPickerContainer: {
    marginTop: 4,
  },
  iosPickerWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    marginTop: 4,
  },
  changeDateBtn: {
    marginTop: 6,
  },
  reminderCard: {
    padding: 14,
    gap: 12,
  },
  reminderExpl: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  reminderTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceHover,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  reminderTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  timeTag: {
    backgroundColor: COLORS.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  timePickerContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerActions: {
    marginTop: 8,
    gap: 8,
  },
});
