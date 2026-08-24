import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { Button } from '../components/common/Button';

export interface OnboardingScreenProps {
  onStartProtocol: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStartProtocol }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.headline}>The De-Romanticization Protocol</Text>
          <Text style={styles.subheadline}>Emotional clarity through cold logic</Text>
        </View>

        {/* The Origin & Rationale Card */}
        <View style={styles.manifestoCard}>
          <Text style={styles.manifestoTitle}>THE ORIGIN & RATIONALE</Text>

          <Text style={styles.manifestoText}>
            Love is a neurochemical reaction sustained by idealization rather than reality. We
            rarely love who someone actually is; we love the mental construct we created.
          </Text>

          <Text style={styles.manifestoText}>
            Inspired by reversing Dr. Arthur Aron&apos;s pioneering psychological studies on intimacy
            and bonding, the{' '}
            <Text style={styles.boldText}>De-Romanticization Protocol</Text> applies 6 targeted
            diagnostic questions to dismantle attachment.
          </Text>

          <Text style={styles.manifestoHighlight}>
            When the brain is forced to confront observable facts instead of nostalgia and
            unreciprocated sacrifice, the romantic fog collapses and clarity takes over within
            minutes.
          </Text>
        </View>

        {/* Protocol Principles */}
        <View style={styles.principlesSection}>
          <Text style={styles.sectionHeader}>CORE DIRECTIVES</Text>

          <View style={styles.directiveItem}>
            <Text style={styles.directiveNumber}>01</Text>
            <View style={styles.directiveBody}>
              <Text style={styles.directiveTitle}>Observed Facts Over Feelings</Text>
              <Text style={styles.directiveDesc}>
                Document tangible behaviors and observable deeds, not intentions or imagined potential.
              </Text>
            </View>
          </View>

          <View style={styles.directiveItem}>
            <Text style={styles.directiveNumber}>02</Text>
            <View style={styles.directiveBody}>
              <Text style={styles.directiveTitle}>Time to Decouple</Text>
              <Text style={styles.directiveDesc}>
                Step away while the timer runs so emotional dopamine spikes settle before review.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button & Subtle Footer */}
        <View style={styles.actionContainer}>
          <Button
            title="Enter Protocol"
            variant="primary"
            onPress={onStartProtocol}
          />
          <Text style={styles.footerNote}>Private & confidential on your device</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 36,
    gap: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  titleSection: {
    gap: 8,
    marginTop: 8,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subheadline: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  manifestoCard: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: 12,
  },
  manifestoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  manifestoText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  boldText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  manifestoHighlight: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  principlesSection: {
    gap: 18,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  directiveItem: {
    flexDirection: 'row',
    gap: 14,
  },
  directiveNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  directiveBody: {
    flex: 1,
    gap: 3,
  },
  directiveTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  directiveDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  actionContainer: {
    gap: 12,
    marginTop: 8,
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
