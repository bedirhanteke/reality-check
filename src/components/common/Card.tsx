import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../constants/colors';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'accent' | 'danger';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'accent':
        return styles.accentCard;
      case 'danger':
        return styles.dangerCard;
      default:
        return styles.defaultCard;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.baseCard, getVariantStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.baseCard, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 16,
  },
  defaultCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
  },
  accentCard: {
    backgroundColor: COLORS.surfaceHover,
    borderColor: 'rgba(224, 225, 236, 0.25)',
  },
  dangerCard: {
    backgroundColor: COLORS.dangerSurface,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
