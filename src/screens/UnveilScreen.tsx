import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { PROTOCOL_QUESTIONS } from '../constants/questions';
import { ProtocolAnswers } from '../types/protocol';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export interface UnveilScreenProps {
  answers: ProtocolAnswers;
  onViewIntro?: () => void;
  onBurnData: () => void;
  onArchiveSession: () => void;
}

export const UnveilScreen: React.FC<UnveilScreenProps> = ({
  answers,
  onViewIntro,
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
      'Your session remains safely stored on this device for ongoing grounding.',
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.topNavRow}>
              <Text style={styles.headline}>The Vault</Text>
              {onViewIntro && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onViewIntro}
                  style={styles.introLinkButton}
                >
                  <Text style={styles.introLinkText}>Overview / Context</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.subheadline}>
              Read your recorded answers as an external observer. Evaluate what you documented with cold clarity.
            </Text>
          </View>

          {/* Protocol Answers List */}
          <View style={styles.protocolList}>
            {PROTOCOL_QUESTIONS.map((q) => {
              const answerText = answers[q.id]?.trim();
              const hasAnswer = Boolean(answerText && answerText.length > 0);

              return (
                <Card key={q.id} style={styles.protocolCard}>
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

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <Button
            title="Archive Session"
            variant="secondary"
            onPress={handleArchivePress}
            style={styles.halfActionBtn}
          />
          <Button
            title="Clear Mind"
            variant="danger"
            onPress={handleBurnPress}
            style={styles.halfActionBtn}
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
    gap: 18,
  },
  headerSection: {
    gap: 6,
    marginTop: 4,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  introLinkButton: {
    backgroundColor: COLORS.surfaceHover,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  introLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
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
  protocolList: {
    gap: 14,
  },
  protocolCard: {
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.background,
    gap: 10,
  },
  halfActionBtn: {
    flex: 1,
  },
});
