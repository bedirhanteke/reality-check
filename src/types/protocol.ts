export type ProtocolPhase = 'ONBOARDING' | 'EDITING' | 'LOCKED' | 'UNLOCKED';

export interface QuestionItem {
  id: keyof ProtocolAnswers;
  stepNumber: number;
  category: string;
  prompt: string;
  guidanceTip: string;
  placeholder: string;
}

export interface ProtocolAnswers {
  q1: string; // Concrete Reality
  q2: string; // Re-Selection
  q3: string; // Sacrifice Balance
  q4: string; // Uniqueness Test
  q5: string; // Character Evolution
  q6: string; // Third-Person Perspective
}

export interface ProtocolStateData {
  phase: ProtocolPhase;
  currentStep: number;
  answers: ProtocolAnswers;
  /**
   * Application-level lock timestamp (milliseconds since epoch).
   * Note: The vault uses a state/UI access gate rather than cryptographic encryption.
   */
  lockTimestamp: number | null;
  /**
   * Target timestamp when UI gate opens to allow objective review.
   */
  unlockTimestamp: number | null;

  // Notification-related state
  notificationPermissionGranted: boolean;
  dailyReminderHour: number | null;   // 0-23, user-selected hour for daily reminder
  dailyReminderMinute: number | null; // 0-59
  scheduledNotificationIds: string[]; // all pending notification IDs (daily reminders + final unlock alert)
}
