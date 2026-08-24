import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export interface ReadinessBannerProps {
  unlockTimestamp: number;
}

export const ReadinessBanner: React.FC<ReadinessBannerProps> = ({ unlockTimestamp }) => {
  const dateObj = new Date(unlockTimestamp);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.accentBar} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>PRIMARY TARGET</Text>
        <Text style={styles.text}>
          You will be ready to review your answers on{' '}
          <Text style={styles.highlight}>{formattedDate}</Text> at{' '}
          <Text style={styles.highlight}>{formattedTime}</Text>.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 225, 236, 0.2)',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: COLORS.accent,
  },
  content: {
    padding: 14,
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.8,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  highlight: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
