import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProtocolPhase, ProtocolAnswers, ProtocolStateData } from '../types/protocol';
import { StorageKeys } from '../constants/storageKeys';
import { useNotifications } from './useNotifications';

const INITIAL_ANSWERS: ProtocolAnswers = {
  q1: '',
  q2: '',
  q3: '',
  q4: '',
  q5: '',
  q6: '',
};

const INITIAL_STATE: ProtocolStateData = {
  phase: 'ONBOARDING',
  currentStep: 1,
  answers: INITIAL_ANSWERS,
  lockTimestamp: null,
  unlockTimestamp: null,
  notificationPermissionGranted: false,
  dailyReminderHour: null,
  dailyReminderMinute: null,
  scheduledNotificationIds: [],
};

export function useProtocolState() {
  const [state, setState] = useState<ProtocolStateData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { cancelAllNotifications } = useNotifications();

  // Keep a reference to latest state for async event handlers (e.g. AppState change)
  const stateRef = useRef<ProtocolStateData>(state);
  stateRef.current = state;

  /**
   * Persist state helper to AsyncStorage.
   */
  const persistState = useCallback(async (data: ProtocolStateData) => {
    try {
      await AsyncStorage.setItem(StorageKeys.PROTOCOL_STATE, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist protocol state to AsyncStorage:', error);
    }
  }, []);

  /**
   * Safe state updater that both updates React state and saves to storage.
   */
  const updateAndPersist = useCallback(
    (updater: (prev: ProtocolStateData) => ProtocolStateData) => {
      setState((prev) => {
        const next = updater(prev);
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  /**
   * Check if locked vault has reached unlockTimestamp and should transition to UNLOCKED.
   */
  const checkUnlockCondition = useCallback(
    (data: ProtocolStateData): ProtocolStateData => {
      if (data.phase === 'LOCKED' && data.unlockTimestamp && Date.now() >= data.unlockTimestamp) {
        // Cancel pending notifications since cool-down interval is complete
        cancelAllNotifications(data.scheduledNotificationIds);
        return {
          ...data,
          phase: 'UNLOCKED',
          scheduledNotificationIds: [],
        };
      }
      return data;
    },
    [cancelAllNotifications]
  );

  /**
   * Initial load from AsyncStorage on app boot.
   */
  useEffect(() => {
    async function loadStoredState() {
      try {
        const raw = await AsyncStorage.getItem(StorageKeys.PROTOCOL_STATE);
        if (raw) {
          const parsed: ProtocolStateData = JSON.parse(raw);
          const resolved = checkUnlockCondition(parsed);
          setState(resolved);
          if (resolved.phase !== parsed.phase) {
            await persistState(resolved);
          }
        }
      } catch (error) {
        console.warn('Failed to load protocol state from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredState();
  }, [checkUnlockCondition, persistState]);

  /**
   * AppState listener to automatically unlock if timer expired while app was in background.
   */
  useEffect(() => {
    const handleAppStateChange = (nextStatus: AppStateStatus) => {
      if (nextStatus === 'active') {
        const current = stateRef.current;
        if (current.phase === 'LOCKED' && current.unlockTimestamp && Date.now() >= current.unlockTimestamp) {
          updateAndPersist((prev) => ({
            ...prev,
            phase: 'UNLOCKED',
            scheduledNotificationIds: [],
          }));
          cancelAllNotifications(current.scheduledNotificationIds);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [updateAndPersist, cancelAllNotifications]);

  /**
   * Set current protocol phase.
   */
  const setPhase = useCallback(
    (phase: ProtocolPhase) => {
      updateAndPersist((prev) => ({ ...prev, phase }));
    },
    [updateAndPersist]
  );

  /**
   * Set current step number (1 to 6).
   */
  const setCurrentStep = useCallback(
    (step: number) => {
      updateAndPersist((prev) => ({ ...prev, currentStep: step }));
    },
    [updateAndPersist]
  );

  /**
   * Update a specific answer by question ID.
   */
  const updateAnswer = useCallback(
    (questionId: keyof ProtocolAnswers, text: string) => {
      updateAndPersist((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: text,
        },
      }));
    },
    [updateAndPersist]
  );

  /**
   * Initiate lock & cool-down phase with chosen duration and notification preferences.
   */
  const initiateLock = useCallback(
    (
      durationMs: number,
      notificationSettings: {
        granted: boolean;
        dailyHour: number | null;
        dailyMinute: number | null;
        scheduledIds: string[];
      }
    ) => {
      const now = Date.now();
      const unlockTime = now + durationMs;

      updateAndPersist((prev) => ({
        ...prev,
        phase: 'LOCKED',
        lockTimestamp: now,
        unlockTimestamp: unlockTime,
        notificationPermissionGranted: notificationSettings.granted,
        dailyReminderHour: notificationSettings.dailyHour,
        dailyReminderMinute: notificationSettings.dailyMinute,
        scheduledNotificationIds: notificationSettings.scheduledIds,
      }));
    },
    [updateAndPersist]
  );

  /**
   * Save edited answers during LOCKED phase without altering lockTimestamp or unlockTimestamp.
   */
  const saveLockedAnswers = useCallback(
    (newAnswers: ProtocolAnswers) => {
      updateAndPersist((prev) => ({
        ...prev,
        answers: newAnswers,
      }));
    },
    [updateAndPersist]
  );

  /**
   * Explicitly transition from LOCKED to UNLOCKED once countdown finishes.
   */
  const unlockProtocol = useCallback(() => {
    cancelAllNotifications(stateRef.current.scheduledNotificationIds);
    updateAndPersist((prev) => ({
      ...prev,
      phase: 'UNLOCKED',
      scheduledNotificationIds: [],
    }));
  }, [cancelAllNotifications, updateAndPersist]);

  /**
   * Clear mind / Burn data: wipes all local records, cancels notifications, resets to ONBOARDING.
   */
  const burnProtocol = useCallback(async () => {
    await cancelAllNotifications(stateRef.current.scheduledNotificationIds);
    try {
      await AsyncStorage.removeItem(StorageKeys.PROTOCOL_STATE);
    } catch (error) {
      console.warn('Failed to wipe protocol state from AsyncStorage:', error);
    }
    setState(INITIAL_STATE);
  }, [cancelAllNotifications]);

  /**
   * Archive session: keeps session readable in UNLOCKED phase and cancels pending notifications.
   */
  const archiveProtocol = useCallback(async () => {
    await cancelAllNotifications(stateRef.current.scheduledNotificationIds);
    updateAndPersist((prev) => ({
      ...prev,
      phase: 'UNLOCKED',
      scheduledNotificationIds: [],
    }));
  }, [cancelAllNotifications, updateAndPersist]);

  /**
   * Reset back to ONBOARDING phase.
   */
  const resetToOnboarding = useCallback(() => {
    updateAndPersist((prev) => ({
      ...prev,
      phase: 'ONBOARDING',
      currentStep: 1,
    }));
  }, [updateAndPersist]);

  return {
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
    resetToOnboarding,
  };
}
