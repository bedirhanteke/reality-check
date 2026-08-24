import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useCountdown } from '../hooks/useCountdown';

export interface LockedScreenProps {
  unlockTimestamp: number | null;
  notificationPermissionGranted?: boolean;
  onUnlock: () => void;
  onEnterEditMode: () => void;
}

export const LockedScreen: React.FC<LockedScreenProps> = ({
  unlockTimestamp,
  onUnlock,
  onEnterEditMode,
}) => {
  // Live countdown ticker in "11h 59m 16s" format
  const { formattedTime } = useCountdown(unlockTimestamp, onUnlock);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 1. Header Section (Fixed at Top) */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>The Vault</Text>
          <Text style={styles.subtitle}>
            Your objective answers are sealed while the timer runs. Take this time to step back and decouple.
          </Text>
        </View>

        {/* 2. Timer Section (Exact Vertical & Horizontal Center, Boxless) */}
        <View style={styles.centerSection}>
          <Text style={styles.timerDigits}>{formattedTime}</Text>
        </View>

        {/* 3. Bottom Section: Grounding Text -> Edit Button (Fixed at Bottom) */}
        <View style={styles.bottomSection}>
          <Text style={styles.groundingText}>
            You don't get to read this when you want to. You read it when you're ready to.
          </Text>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onEnterEditMode}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerSection: {
    gap: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigits: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 12,
  },
  groundingText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  editButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
});
