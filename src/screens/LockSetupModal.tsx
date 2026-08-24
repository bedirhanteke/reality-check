import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/colors';
import { Button } from '../components/common/Button';
import {
  NotificationIntervalHours,
  NotificationScheduleConfig,
} from '../types/protocol';
import { useNotifications } from '../hooks/useNotifications';

type ScheduleOption = '6h' | '12h' | '24h' | 'specific_time';

export interface ScheduleConfirmationPayload {
  scheduleConfig: NotificationScheduleConfig;
  privacyMode: boolean;
  permissionGranted: boolean;
}

export interface LockSetupModalProps {
  visible: boolean;
  initialConfig?: NotificationScheduleConfig;
  initialPrivacyMode?: boolean;
  onClose: () => void;
  onConfirmSchedule: (payload: ScheduleConfirmationPayload) => void;
}

export const LockSetupModal: React.FC<LockSetupModalProps> = ({
  visible,
  initialConfig,
  initialPrivacyMode = false,
  onClose,
  onConfirmSchedule,
}) => {
  // 1. Notification Schedule (6h | 12h | 24h | Specific Time) -> Single source of truth for both reminders and vault unlock
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('12h');

  // Specific Time State
  const [dailyTimeDate, setDailyTimeDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0); // Default 21:00
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // 2. Privacy (Mask on Lock Screen)
  const [privacyMode, setPrivacyMode] = useState<boolean>(initialPrivacyMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { requestPermission } = useNotifications();

  // Synchronize state when modal opens
  useEffect(() => {
    if (visible) {
      if (initialConfig) {
        if (initialConfig.scheduleType === 'specific_time') {
          setScheduleOption('specific_time');
        } else if (initialConfig.intervalHours === 6) {
          setScheduleOption('6h');
        } else if (initialConfig.intervalHours === 24) {
          setScheduleOption('24h');
        } else {
          setScheduleOption('12h');
        }

        if (initialConfig.customTime) {
          const [h, m] = initialConfig.customTime.split(':');
          const d = new Date();
          d.setHours(parseInt(h, 10) || 21, parseInt(m, 10) || 0, 0, 0);
          setDailyTimeDate(d);
        }
      }

      setPrivacyMode(initialPrivacyMode);
    }
  }, [visible, initialConfig, initialPrivacyMode]);

  const handleTimePickerChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setDailyTimeDate(selectedDate);
    }
  };

  const getEffectiveScheduleConfig = (): NotificationScheduleConfig => {
    const hours = dailyTimeDate.getHours().toString().padStart(2, '0');
    const minutes = dailyTimeDate.getMinutes().toString().padStart(2, '0');
    const customTime = `${hours}:${minutes}`;

    if (scheduleOption === 'specific_time') {
      return {
        scheduleType: 'specific_time',
        intervalHours: 24,
        customTime,
      };
    }

    const intervalMap: Record<'6h' | '12h' | '24h', NotificationIntervalHours> = {
      '6h': 6,
      '12h': 12,
      '24h': 24,
    };

    return {
      scheduleType: 'interval',
      intervalHours: intervalMap[scheduleOption],
      customTime,
    };
  };

  const handleSaveAndActivate = async () => {
    setIsSubmitting(true);
    const scheduleConfig = getEffectiveScheduleConfig();

    try {
      const granted = await requestPermission();

      onConfirmSchedule({
        scheduleConfig,
        privacyMode,
        permissionGranted: granted,
      });
    } catch (error) {
      console.warn('Error activating schedule:', error);
      onConfirmSchedule({
        scheduleConfig,
        privacyMode,
        permissionGranted: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedReminderTime = dailyTimeDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

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
            {/* Header Handle & Title */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>Reality Check Schedule</Text>
              <Text style={styles.subtitle}>
                Set how often you want to be reminded — this also determines when the vault unlocks.
              </Text>
            </View>

            {/* 1. NOTIFICATION SCHEDULE (6h | 12h | 24h | Specific Time) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NOTIFICATION SCHEDULE</Text>
              <View style={styles.segmentRow}>
                {(['6h', '12h', '24h', 'specific_time'] as ScheduleOption[]).map((opt) => {
                  const labelMap: Record<ScheduleOption, string> = {
                    '6h': '6h',
                    '12h': '12h',
                    '24h': '24h',
                    'specific_time': 'Specific Time',
                  };
                  const isSelected = scheduleOption === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.7}
                      onPress={() => setScheduleOption(opt)}
                      style={[
                        styles.reminderButton,
                        opt === 'specific_time' && styles.reminderButtonWide,
                        isSelected && styles.segmentButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          isSelected && styles.segmentTextActive,
                        ]}
                      >
                        {labelMap[opt]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Time Picker Row (when Specific Time selected) */}
              {scheduleOption === 'specific_time' && (
                <View style={styles.timePickerContainer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowTimePicker(true)}
                    style={styles.timeSelectRow}
                  >
                    <Text style={styles.timeSelectLabel}>Reminder Time</Text>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>{formattedReminderTime}</Text>
                    </View>
                  </TouchableOpacity>

                  {showTimePicker && (
                    <View style={styles.pickerWrapper}>
                      <DateTimePicker
                        value={dailyTimeDate}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        themeVariant="dark"
                        textColor={COLORS.textPrimary}
                        onChange={handleTimePickerChange}
                      />
                      {Platform.OS === 'ios' && (
                        <Button
                          variant="ghost"
                          title="Done"
                          onPress={() => setShowTimePicker(false)}
                        />
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 2. PRIVACY */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PRIVACY</Text>
              <View style={styles.privacyCard}>
                <Text style={styles.privacyText}>Mask on Lock Screen</Text>
                <Switch
                  value={privacyMode}
                  onValueChange={setPrivacyMode}
                  trackColor={{ false: COLORS.surfaceBorder, true: COLORS.accent }}
                  thumbColor={COLORS.textPrimary}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                variant="primary"
                title="Save & Activate"
                loading={isSubmitting}
                onPress={handleSaveAndActivate}
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
    paddingBottom: 32,
    gap: 18,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderButton: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderButtonWide: {
    flex: 1.4,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  timePickerContainer: {
    marginTop: 4,
  },
  timeSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  timeSelectLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  timeBadge: {
    backgroundColor: COLORS.surfaceHover,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  pickerWrapper: {
    marginTop: 6,
    alignItems: 'center',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  privacyText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  actions: {
    marginTop: 6,
    gap: 8,
  },
});
