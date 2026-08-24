import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { TimerDisplay } from '../components/locked/TimerDisplay';
import { Button } from '../components/common/Button';
import { useCountdown } from '../hooks/useCountdown';

export interface LockedScreenProps {
  unlockTimestamp: number | null;
  notificationPermissionGranted: boolean;
  onUnlock: () => void;
  onEnterEditMode: () => void;
}

export const LockedScreen: React.FC<LockedScreenProps> = ({
  unlockTimestamp,
  onUnlock,
  onEnterEditMode,
}) => {
  // Live countdown ticker
  const { formattedTime } = useCountdown(unlockTimestamp, onUnlock);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Mind in Cool-Down</Text>

          <View style={styles.timerWrapper}>
            <TimerDisplay formattedTime={formattedTime} />
          </View>

          <Text style={styles.subtitle}>
            Take time away. Your answers will unlock when the timer runs out.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            title="Edit what I wrote"
            variant="ghost"
            onPress={onEnterEditMode}
            textStyle={styles.editButtonText}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  timerWrapper: {
    width: '100%',
    maxWidth: 320,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  footer: {
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
});
