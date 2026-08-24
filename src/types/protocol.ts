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
  q2: string; // Objective Choice
  q3: string; // Reciprocity Audit
  q4: string; // Sovereignty & Need
  q5: string; // Identity Shift
  q6: string; // External Perspective
}

export interface VaultNote {
  id: string;        // unique id
  text: string;
  createdAt: number; // epoch ms
}

export type ScheduleType = 'interval' | 'specific_time';
export type NotificationIntervalHours = 6 | 12 | 24;

export interface NotificationScheduleConfig {
  scheduleType: ScheduleType;
  intervalHours: NotificationIntervalHours;
  customTime: string; // 'HH:mm', e.g. '21:00'
}

export interface NotificationPayloadData {
  targetScreen: 'vault';
  noteId?: string;
}

export interface ProtocolStateData {
  phase: ProtocolPhase;
  currentStep: number;
  answers: ProtocolAnswers;
  lockTimestamp: number | null;
  unlockTimestamp: number | null;
  lastScheduledTimestamp: number | null;

  // Notification & lock duration config (unified single source of truth)
  notificationPermissionGranted: boolean;
  scheduleType: ScheduleType;
  notificationIntervalHours: NotificationIntervalHours;
  customTime: string; // e.g. '21:00'
  privacyMode: boolean;
  scheduledNotificationIds: string[];
}
