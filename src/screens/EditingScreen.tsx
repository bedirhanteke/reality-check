import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { PROTOCOL_QUESTIONS } from '../constants/questions';
import { ProtocolAnswers } from '../types/protocol';
import { StepProgress } from '../components/common/StepProgress';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LockSetupModal, LockConfirmationPayload } from './LockSetupModal';

export interface EditingScreenProps {
  currentStep: number;
  answers: ProtocolAnswers;
  onUpdateAnswer: (questionId: keyof ProtocolAnswers, text: string) => void;
  onStepChange: (step: number) => void;
  onInitiateLock: (payload: LockConfirmationPayload) => void;
  isLockedEditMode?: boolean;
  onSaveLockedChanges?: () => void;
  onCancelLockedEdit?: () => void;
}

export const EditingScreen: React.FC<EditingScreenProps> = ({
  currentStep,
  answers,
  onUpdateAnswer,
  onStepChange,
  onInitiateLock,
  isLockedEditMode = false,
  onSaveLockedChanges,
  onCancelLockedEdit,
}) => {
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const question = PROTOCOL_QUESTIONS[currentStep - 1] || PROTOCOL_QUESTIONS[0];
  const currentAnswer = answers[question.id] || '';

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === PROTOCOL_QUESTIONS.length;

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(currentStep + 1);
    } else {
      if (isLockedEditMode) {
        onSaveLockedChanges?.();
      } else {
        setShowLockModal(true);
      }
    }
  };

  const handleConfirmLock = (payload: LockConfirmationPayload) => {
    setShowLockModal(false);
    onInitiateLock(payload);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Top Bar for Locked Edit Mode */}
          {isLockedEditMode && (
            <View style={styles.topEditBar}>
              <TouchableOpacity
                onPress={onCancelLockedEdit}
                activeOpacity={0.7}
                style={styles.cancelEditBtn}
              >
                <Text style={styles.cancelEditText}>← Back to Timer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSaveLockedChanges}
                activeOpacity={0.7}
                style={styles.saveHeaderBtn}
              >
                <Text style={styles.saveHeaderText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Progress Header */}
          <StepProgress
            currentStep={currentStep}
            totalSteps={PROTOCOL_QUESTIONS.length}
            category={question.category}
            isLockedEditMode={isLockedEditMode}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Question Prompt */}
            <View style={styles.promptContainer}>
              <Text style={styles.promptText}>{question.prompt}</Text>
            </View>

            {/* Guidance Tip Card */}
            <Card style={styles.guidanceCard}>
              <Text style={styles.guidanceLabel}>GUIDANCE</Text>
              <Text style={styles.guidanceText}>{question.guidanceTip}</Text>
            </Card>

            {/* Answer Input */}
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
              <TextInput
                multiline
                textAlignVertical="top"
                placeholder={question.placeholder}
                placeholderTextColor={COLORS.textTertiary}
                value={currentAnswer}
                onChangeText={(text) => onUpdateAnswer(question.id, text)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={styles.textInput}
              />
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footer}>
            <Button
              title="Previous"
              variant="outline"
              disabled={isFirstStep}
              onPress={handlePrevious}
              style={styles.navButton}
            />

            {isLastStep ? (
              <Button
                title={isLockedEditMode ? 'Save & Return' : 'Proceed to Cool-Down'}
                variant="primary"
                onPress={handleNext}
                style={styles.primaryActionButton}
              />
            ) : (
              <Button
                title="Next"
                variant="primary"
                onPress={handleNext}
                style={styles.navButton}
              />
            )}
          </View>
        </View>

        {/* Lock Modal */}
        {!isLockedEditMode && (
          <LockSetupModal
            visible={showLockModal}
            onClose={() => setShowLockModal(false)}
            onConfirmLock={handleConfirmLock}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  topEditBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    marginBottom: 4,
  },
  cancelEditBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelEditText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  saveHeaderBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveHeaderText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 18,
  },
  promptContainer: {
    marginTop: 4,
  },
  promptText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  guidanceCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    padding: 14,
    gap: 6,
  },
  guidanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
  },
  guidanceText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    minHeight: 180,
    padding: 14,
  },
  inputContainerFocused: {
    borderColor: COLORS.accent,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  primaryActionButton: {
    flex: 1.6,
  },
});
