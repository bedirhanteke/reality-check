import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { COLORS } from './src/constants/colors';
import { ProtocolAnswers, NotificationScheduleConfig } from './src/types/protocol';
import { useProtocolState } from './src/hooks/useProtocolState';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { EditingScreen } from './src/screens/EditingScreen';
import { LockedScreen } from './src/screens/LockedScreen';
import { UnveilScreen } from './src/screens/UnveilScreen';
import { ScheduleConfirmationPayload } from './src/screens/LockSetupModal';
import { setupNotificationChannel } from './src/utils/notificationHelper';

export default function App() {
  const {
    state,
    isLoading,
    setPhase,
    setCurrentStep,
    updateAnswer,
    activateSchedule,
    saveLockedAnswers,
    unlockProtocol,
    burnProtocol,
    relockProtocol,
  } = useProtocolState();

  // Local state for locked vault edit mode
  const [isEditingInVault, setIsEditingInVault] = useState<boolean>(false);
  const [vaultEditStep, setVaultEditStep] = useState<number>(1);
  const [pendingVaultAnswers, setPendingVaultAnswers] = useState<ProtocolAnswers | null>(null);

  const currentScheduleConfig: NotificationScheduleConfig = {
    scheduleType: state.scheduleType,
    intervalHours: state.notificationIntervalHours,
    customTime: state.customTime,
  };

  // Setup notification channel and deep linking on mount
  useEffect(() => {
    setupNotificationChannel();

    // 1. Check cold-start notification click (when app was killed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data?.targetScreen === 'vault') {
        setPhase('UNLOCKED');
      }
    });

    // 2. Listener for notification click while app is in background/foreground
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response?.notification?.request?.content?.data?.targetScreen === 'vault') {
        setPhase('UNLOCKED');
      }
    });

    return () => subscription.remove();
  }, [setPhase]);

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

  // --- Handlers for Initial Entry Flow ---
  const handleStartProtocol = () => {
    setCurrentStep(1);
    setPhase('EDITING');
  };

  const handleBackToOnboarding = () => {
    setPhase('ONBOARDING');
  };

  const handleActivateSchedule = (payload: ScheduleConfirmationPayload) => {
    activateSchedule(
      payload.scheduleConfig,
      payload.privacyMode,
      payload.permissionGranted,
      state.answers
    );
  };

  // --- Handlers for Editing Answers in Vault (LockedScreen Edit Mode) ---
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

  const handleSaveVaultEdits = (payload: ScheduleConfirmationPayload) => {
    const finalAnswers = pendingVaultAnswers || state.answers;
    saveLockedAnswers(
      finalAnswers,
      payload.scheduleConfig,
      payload.privacyMode,
      payload.permissionGranted
    );
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
            onActivateSchedule={handleActivateSchedule}
            onBackToOnboarding={handleBackToOnboarding}
            currentScheduleConfig={currentScheduleConfig}
            currentPrivacyMode={state.privacyMode}
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
              onActivateSchedule={() => {}}
              isLockedEditMode
              onSaveLockedChanges={handleSaveVaultEdits}
              onCancelLockedEdit={handleCancelVaultEdits}
              currentScheduleConfig={currentScheduleConfig}
              currentPrivacyMode={state.privacyMode}
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
            onViewIntro={() => setPhase('ONBOARDING')}
            onBurnData={burnProtocol}
            onLock={relockProtocol}
            currentScheduleConfig={currentScheduleConfig}
            currentPrivacyMode={state.privacyMode}
            onActivateSchedule={handleActivateSchedule}
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
