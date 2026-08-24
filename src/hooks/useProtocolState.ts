import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  ProtocolPhase,
  ProtocolAnswers,
  ProtocolStateData,
  VaultNote,
  NotificationScheduleConfig,
} from '../types/protocol';
import {
  getNotes,
  saveNotes,
  getScheduleConfig,
  saveScheduleConfig,
  getPrivacyMode,
  savePrivacyMode,
  getLastScheduledTimestamp,
  getStoredProtocolState,
  saveStoredProtocolState,
  clearAllAppData,
} from '../utils/storage';
import {
  scheduleRotatingRealityChecks,
  checkAndRefillQueue,
  getNextReminderTimestamp,
} from '../utils/notificationHelper';
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
  lastScheduledTimestamp: null,
  notificationPermissionGranted: false,
  scheduleType: 'interval',
  notificationIntervalHours: 12,
  customTime: '21:00',
  privacyMode: false,
  scheduledNotificationIds: [],
};

export function useProtocolState() {
  const [state, setState] = useState<ProtocolStateData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { cancelAllNotifications } = useNotifications();

  const stateRef = useRef<ProtocolStateData>(state);
  stateRef.current = state;

  /**
   * Helper to sync protocol answers into VaultNote[] if notes are empty.
   */
  const syncAnswersToNotesIfEmpty = useCallback(
    async (answers: ProtocolAnswers, existingNotes: VaultNote[]): Promise<VaultNote[]> => {
      if (existingNotes.length > 0) {
        return existingNotes;
      }
      const answerEntries = Object.values(answers).filter(
        (text) => Boolean(text && text.trim().length > 0)
      );
      if (answerEntries.length === 0) {
        return [];
      }
      const newNotes: VaultNote[] = answerEntries.map((text, idx) => ({
        id: `${Date.now().toString(36)}-${idx}`,
        text: text.trim(),
        createdAt: Date.now() - (answerEntries.length - idx) * 1000,
      }));
      await saveNotes(newNotes);
      return newNotes;
    },
    []
  );

  /**
   * Check if locked vault has reached unlockTimestamp.
   */
  const checkUnlockCondition = useCallback(
    (data: ProtocolStateData): ProtocolStateData => {
      if (data.phase === 'LOCKED' && data.unlockTimestamp && Date.now() >= data.unlockTimestamp) {
        return {
          ...data,
          phase: 'UNLOCKED',
          scheduledNotificationIds: [],
        };
      }
      return data;
    },
    []
  );

  /**
   * Safe state updater that persists to AsyncStorage.
   */
  const updateAndPersist = useCallback((updater: (prev: ProtocolStateData) => ProtocolStateData) => {
    setState((prev) => {
      const next = updater(prev);
      saveStoredProtocolState(next);
      return next;
    });
  }, []);

  /**
   * Initial load from AsyncStorage on app boot.
   */
  useEffect(() => {
    async function loadStoredState() {
      try {
        const storedState = await getStoredProtocolState();
        const storedNotes = await getNotes();
        const storedConfig = await getScheduleConfig();
        const storedPrivacy = await getPrivacyMode();
        const storedLastScheduled = await getLastScheduledTimestamp();

        let resolvedState: ProtocolStateData = storedState
          ? {
              ...INITIAL_STATE,
              ...storedState,
              scheduleType: storedConfig.scheduleType,
              notificationIntervalHours: storedConfig.intervalHours,
              customTime: storedConfig.customTime,
              privacyMode: storedPrivacy,
              lastScheduledTimestamp: storedLastScheduled,
            }
          : {
              ...INITIAL_STATE,
              scheduleType: storedConfig.scheduleType,
              notificationIntervalHours: storedConfig.intervalHours,
              customTime: storedConfig.customTime,
              privacyMode: storedPrivacy,
              lastScheduledTimestamp: storedLastScheduled,
            };

        resolvedState = checkUnlockCondition(resolvedState);

        // Sync answers into notes if notes are empty and answers exist
        const finalNotes = await syncAnswersToNotesIfEmpty(resolvedState.answers, storedNotes);

        setState(resolvedState);

        if (storedState && resolvedState.phase !== storedState.phase) {
          await saveStoredProtocolState(resolvedState);
        }

        // Check if queue needs refilling
        if (finalNotes.length > 0) {
          await checkAndRefillQueue();
        }
      } catch (error) {
        console.warn('Failed to load initial state from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredState();
  }, [checkUnlockCondition, syncAnswersToNotesIfEmpty]);

  /**
   * AppState listener: Check unlock expiration & refill rotating queue when active.
   */
  useEffect(() => {
    const handleAppStateChange = async (nextStatus: AppStateStatus) => {
      if (nextStatus === 'active') {
        const current = stateRef.current;
        if (current.phase === 'LOCKED' && current.unlockTimestamp && Date.now() >= current.unlockTimestamp) {
          updateAndPersist((prev) => ({
            ...prev,
            phase: 'UNLOCKED',
            scheduledNotificationIds: [],
          }));
        }

        await checkAndRefillQueue();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [updateAndPersist]);

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
   * Activate schedule and transition to The Vault (LOCKED).
   * Computes unlockTimestamp directly from the chosen Notification Schedule:
   * - 6h / 12h / 24h: unlockTimestamp = now + (intervalHours * 3600 * 1000)
   * - Specific Time: unlockTimestamp = next occurrence of chosen time (today or tomorrow)
   */
  const activateSchedule = useCallback(
    async (
      scheduleConfig: NotificationScheduleConfig,
      privacyMode: boolean,
      granted: boolean,
      answersOverride?: ProtocolAnswers
    ) => {
      await saveScheduleConfig(scheduleConfig);
      await savePrivacyMode(privacyMode);

      const effectiveAnswers = answersOverride || stateRef.current.answers;

      // Extract non-empty answer texts from 6 questions and sync to notes
      const answerEntries = Object.values(effectiveAnswers).filter(
        (text) => Boolean(text && text.trim().length > 0)
      );

      let updatedNotes: VaultNote[] = [];
      if (answerEntries.length > 0) {
        updatedNotes = answerEntries.map((text, idx) => ({
          id: `${Date.now().toString(36)}-${idx}`,
          text: text.trim(),
          createdAt: Date.now() - (answerEntries.length - idx) * 1000,
        }));
        await saveNotes(updatedNotes);
      }

      const now = Date.now();
      let unlockTime: number;

      if (scheduleConfig.scheduleType === 'specific_time') {
        unlockTime = getNextReminderTimestamp(scheduleConfig, now);
      } else {
        const intervalMs = (scheduleConfig.intervalHours || 12) * 60 * 60 * 1000;
        unlockTime = now + intervalMs;
      }

      let scheduledIds: string[] = [];
      if (granted && updatedNotes.length > 0) {
        scheduledIds = await scheduleRotatingRealityChecks(updatedNotes, scheduleConfig, privacyMode);
      }

      updateAndPersist((prev) => ({
        ...prev,
        phase: 'LOCKED',
        lockTimestamp: now,
        unlockTimestamp: unlockTime,
        answers: effectiveAnswers,
        notificationPermissionGranted: granted,
        scheduleType: scheduleConfig.scheduleType,
        notificationIntervalHours: scheduleConfig.intervalHours,
        customTime: scheduleConfig.customTime,
        privacyMode,
        lastScheduledTimestamp: now,
        scheduledNotificationIds: scheduledIds,
      }));
    },
    [updateAndPersist]
  );

  /**
   * Save edited answers and update schedule during LOCKED phase.
   * Immediately recalculates unlockTimestamp and reschedules notification queue
   * based on the newly saved Notification Schedule.
   */
  const saveLockedAnswers = useCallback(
    async (
      newAnswers: ProtocolAnswers,
      scheduleConfig?: NotificationScheduleConfig,
      privacyMode?: boolean,
      granted?: boolean
    ) => {
      const config = scheduleConfig || {
        scheduleType: stateRef.current.scheduleType,
        intervalHours: stateRef.current.notificationIntervalHours,
        customTime: stateRef.current.customTime,
      };
      const privacy = privacyMode !== undefined ? privacyMode : stateRef.current.privacyMode;

      await saveScheduleConfig(config);
      await savePrivacyMode(privacy);

      // Sync updated answers into notes
      const answerEntries = Object.values(newAnswers).filter(
        (text) => Boolean(text && text.trim().length > 0)
      );

      let updatedNotes: VaultNote[] = [];
      if (answerEntries.length > 0) {
        updatedNotes = answerEntries.map((text, idx) => ({
          id: `${Date.now().toString(36)}-${idx}`,
          text: text.trim(),
          createdAt: Date.now() - (answerEntries.length - idx) * 1000,
        }));
        await saveNotes(updatedNotes);
      }

      const now = Date.now();
      let unlockTime: number;

      if (config.scheduleType === 'specific_time') {
        unlockTime = getNextReminderTimestamp(config, now);
      } else {
        const intervalMs = (config.intervalHours || 12) * 60 * 60 * 1000;
        unlockTime = now + intervalMs;
      }

      const hasPermission = granted !== undefined ? granted : stateRef.current.notificationPermissionGranted;
      let scheduledIds: string[] = [];
      if (hasPermission && updatedNotes.length > 0) {
        scheduledIds = await scheduleRotatingRealityChecks(updatedNotes, config, privacy);
      }

      updateAndPersist((prev) => ({
        ...prev,
        answers: newAnswers,
        lockTimestamp: now,
        unlockTimestamp: unlockTime,
        scheduleType: config.scheduleType,
        notificationIntervalHours: config.intervalHours,
        customTime: config.customTime,
        privacyMode: privacy,
        lastScheduledTimestamp: now,
        scheduledNotificationIds: scheduledIds,
      }));
    },
    [updateAndPersist]
  );

  /**
   * Clear mind / Burn data: wipes all records, cancels notifications, resets to ONBOARDING.
   */
  const burnProtocol = useCallback(async () => {
    await cancelAllNotifications();
    await clearAllAppData();
    setState(INITIAL_STATE);
  }, [cancelAllNotifications]);

  /**
   * Archive session: retains data as locked/unlocked review.
   */
  const archiveProtocol = useCallback(async () => {
    updateAndPersist((prev) => ({
      ...prev,
      phase: 'UNLOCKED',
      scheduledNotificationIds: [],
    }));
  }, [updateAndPersist]);

  /**
   * Unlock protocol to transition from LOCKED to UNLOCKED.
   */
  const unlockProtocol = useCallback(async () => {
    updateAndPersist((prev) => ({
      ...prev,
      phase: 'UNLOCKED',
      scheduledNotificationIds: [],
    }));
  }, [updateAndPersist]);

  return {
    state,
    isLoading,
    setPhase,
    setCurrentStep,
    updateAnswer,
    activateSchedule,
    saveLockedAnswers,
    unlockProtocol,
    burnProtocol,
    archiveProtocol,
  };
}
