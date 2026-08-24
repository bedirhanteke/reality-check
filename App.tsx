import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/constants/colors';
import { ProtocolAnswers } from './src/types/protocol';
import { useProtocolState } from './src/hooks/useProtocolState';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { EditingScreen } from './src/screens/EditingScreen';
import { LockedScreen } from './src/screens/LockedScreen';
import { UnveilScreen } from './src/screens/UnveilScreen';
import { LockConfirmationPayload } from './src/screens/LockSetupModal';

export default function App() {
  const {
    state,
    isLoading,
    setPhase,
    setCurrentStep,
    updateAnswer,
    initiateLock,
    saveLockedAnswers,
    unlockProtocol,
    burnProtocol,
    archiveProtocol,
  } = useProtocolState();

  // Local state for locked-vault editing mode
  const [isEditingInVault, setIsEditingInVault] = useState<boolean>(false);
  const [vaultEditStep, setVaultEditStep] = useState<number>(1);
  const [pendingVaultAnswers, setPendingVaultAnswers] = useState<ProtocolAnswers | null>(null);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  // --- Handlers for Transitions ---
  const handleStartProtocol = () => {
    setCurrentStep(1);
    setPhase('EDITING');
  };

  const handleInitiateLock = (payload: LockConfirmationPayload) => {
    initiateLock(payload.durationMs, payload.notificationSettings);
  };

  // --- Handlers for Editing Answers in Vault ---
  const handleEnterVaultEdit = () => {
    setPendingVaultAnswers({ ...state.answers });
    setVaultEditStep(1);
    setIsEditingInVault(true);
  };

  const handleVaultAnswerChange = (questionId: keyof ProtocolAnswers, text: string) => {
    setPendingVaultAnswers((prev) => ({
      ...(prev || state.answers),
      [questionId]: text,
    }));
  };

  const handleSaveVaultEdits = () => {
    if (pendingVaultAnswers) {
      saveLockedAnswers(pendingVaultAnswers);
    }
    setIsEditingInVault(false);
    setPendingVaultAnswers(null);
  };

  const handleCancelVaultEdits = () => {
    setIsEditingInVault(false);
    setPendingVaultAnswers(null);
  };

  // --- State Machine Screen Switcher ---
  const renderCurrentPhase = () => {
    switch (state.phase) {
      case 'ONBOARDING':
        return <OnboardingScreen onStartProtocol={handleStartProtocol} />;

      case 'EDITING':
        return (
          <EditingScreen
            currentStep={state.currentStep}
            answers={state.answers}
            onUpdateAnswer={updateAnswer}
            onStepChange={setCurrentStep}
            onInitiateLock={handleInitiateLock}
          />
        );

      case 'LOCKED':
        if (isEditingInVault) {
          return (
            <EditingScreen
              currentStep={vaultEditStep}
              answers={pendingVaultAnswers || state.answers}
              onUpdateAnswer={handleVaultAnswerChange}
              onStepChange={setVaultEditStep}
              onInitiateLock={() => {}}
              isLockedEditMode
              onSaveLockedChanges={handleSaveVaultEdits}
              onCancelLockedEdit={handleCancelVaultEdits}
            />
          );
        }
        return (
          <LockedScreen
            unlockTimestamp={state.unlockTimestamp}
            notificationPermissionGranted={state.notificationPermissionGranted}
            onUnlock={unlockProtocol}
            onEnterEditMode={handleEnterVaultEdit}
          />
        );

      case 'UNLOCKED':
        return (
          <UnveilScreen
            answers={state.answers}
            onBurnData={burnProtocol}
            onArchiveSession={archiveProtocol}
          />
        );

      default:
        return <OnboardingScreen onStartProtocol={handleStartProtocol} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.appContainer}>{renderCurrentPhase()}</View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
