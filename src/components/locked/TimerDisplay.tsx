import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface TimerDisplayProps {
  formattedTime: string; // e.g. "48:00:00" or "23:45:12"
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ formattedTime }) => {
  const parts = formattedTime.split(':');
  const hours = parts[0] || '00';
  const minutes = parts[1] || '00';
  const seconds = parts[2] || '00';

  return (
    <View style={styles.container}>
      <View style={styles.clockRow}>
        <View style={styles.unitBlock}>
          <Text style={styles.digits}>{hours}</Text>
          <Text style={styles.unitLabel}>HRS</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.unitBlock}>
          <Text style={styles.digits}>{minutes}</Text>
          <Text style={styles.unitLabel}>MIN</Text>
        </View>

        <Text style={styles.separator}>:</Text>

        <View style={styles.unitBlock}>
          <Text style={styles.digits}>{seconds}</Text>
          <Text style={styles.unitLabel}>SEC</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBlock: {
    alignItems: 'center',
    minWidth: 58,
  },
  digits: {
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  unitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  separator: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.textTertiary,
    marginHorizontal: 4,
    marginBottom: 16,
  },
});
