import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface StepProgressProps {
  currentStep: number;
  totalSteps?: number;
  category: string;
  isLockedEditMode?: boolean;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps = 6,
  category,
}) => {
  const progressPercent = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <View style={styles.container}>
      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Meta Bar */}
      <View style={styles.metaRow}>
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 12,
  },
  track: {
    height: 3,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceHover,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  categoryText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
});
