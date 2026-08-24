import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { PROTOCOL_QUESTIONS } from '../constants/questions';
import { ProtocolAnswers } from '../types/protocol';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export interface UnveilScreenProps {
  answers: ProtocolAnswers;
  onBurnData: () => void;
  onArchiveSession: () => void;
}

export const UnveilScreen: React.FC<UnveilScreenProps> = ({
  answers,
  onBurnData,
  onArchiveSession,
}) => {
  const handleBurnPress = () => {
    Alert.alert(
      'Delete All Records?',
      'This will permanently remove your recorded answers from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: onBurnData,
        },
      ]
    );
  };

  const handleArchivePress = () => {
    Alert.alert(
      'Saved to Archive',
      'Your session will remain accessible here whenever you need a reality check.',
      [
        {
          text: 'OK',
          onPress: onArchiveSession,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.headline}>Objective Review</Text>
            <Text style={styles.subheadline}>
              Read your own words as an external observer. Evaluate what you documented with clarity.
            </Text>
          </View>

          {/* Question & Answer Cards */}
          <View style={styles.cardsList}>
            {PROTOCOL_QUESTIONS.map((q) => {
              const answerText = answers[q.id]?.trim();
              const hasAnswer = Boolean(answerText && answerText.length > 0);

              return (
                <Card key={q.id} style={styles.answerCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.stepNum}>0{q.stepNumber}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{q.category}</Text>
                    </View>
                  </View>

                  <Text style={styles.questionPrompt}>{q.prompt}</Text>

                  <View style={styles.answerBox}>
                    {hasAnswer ? (
                      <Text style={styles.answerText}>{answerText}</Text>
                    ) : (
                      <Text style={styles.blankAnswerText}>
                        [Left blank — no specific behaviors recorded]
                      </Text>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <Button
            title="Archive Session"
            variant="secondary"
            onPress={handleArchivePress}
            style={styles.archiveButton}
          />
          <Button
            title="Clear Mind (Delete Data)"
            variant="danger"
            onPress={handleBurnPress}
            style={styles.burnButton}
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
    justifyContent: 'space-between',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
    gap: 20,
  },
  headerSection: {
    gap: 6,
    marginTop: 4,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  subheadline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  cardsList: {
    gap: 16,
    marginTop: 4,
  },
  answerCard: {
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceHover,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  questionPrompt: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  answerBox: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 12,
  },
  answerText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  blankAnswerText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.background,
    gap: 10,
  },
  archiveButton: {
    width: '100%',
  },
  burnButton: {
    width: '100%',
  },
});
