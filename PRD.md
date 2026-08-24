# Reality Check — Build Specification

You are an elite principal mobile engineer and UI/UX designer. Your task is to build a production-grade, 100% offline, zero-backend React Native (Expo) mobile application named **"Reality Check"** (also known as **"The De-Romanticization Protocol"**) using TypeScript.

The entire user interface, alerts, notifications, copy, code comments, and documentation must be strictly in **English**.

---

## 0. Target Environment (read this first)

- **Expo SDK:** target SDK 51 or newer (use the latest stable SDK available at build time; do not use deprecated APIs like the legacy `expo-permissions` package).
- **Navigation:** use a lightweight state-machine-driven root switch in `App.tsx` (as described in the architecture below) rather than a routing library, since the app has no deep linking needs and phases are strictly sequential.
- **Local persistence:** `@react-native-async-storage/async-storage`.
- **Notifications:** `expo-notifications`.
- **Date/time picker (Custom lock option):** `@react-native-community/datetimepicker`.
- **No cryptographic encryption is required.** See Section 1 for the exact meaning of "lock" in this app.

---

## 1. Philosophy & Mental Model

The app is a psychological intervention tool inspired by Dr. Arthur Aron's de-romanticization protocol. It breaks romantic obsessions and cognitive distortions through cold, objective reality checks across 6 structured questions.

**Core Rules:**

- **Zero Telemetry / Absolute Privacy:** No analytics, no accounts, no network calls. Everything stays strictly in device storage.
- **Static Scaffolding:** No external AI/LLM API calls. Every piece of guidance is deterministic and built into the client.
- **Soft Time-Lock (not encryption):** Once submitted, the user's answers are **not cryptographically encrypted**. "Locking" means a pure application-level gate: the UI simply refuses to render the answer-review screen until `Date.now() >= unlockTimestamp`, enforced by app state/navigation logic, not by encrypting the stored data. Data sits in plaintext in AsyncStorage the entire time. This must be reflected accurately in code comments — do not imply real encryption anywhere in naming, comments, or UI copy.
- **Editable during cool-down:** Unlike a fully sealed vault, the user **may edit their answers during the lock period** (see Section 5.4). Editing during lock does **not** reset or extend the countdown — it only updates the stored answer content. This is a deliberate design choice: the goal is emotional cool-down, not punitive irreversibility.

---

## 2. Architecture & File Structure

Generate the application with the following clean modular architecture:

```text
src/
├── constants/
│   ├── colors.ts            # Dark mode design tokens
│   ├── questions.ts         # Static array of the 6 protocol questions & hints
│   └── storageKeys.ts       # Enum for AsyncStorage keys
├── types/
│   └── protocol.ts          # State machine and data models
├── hooks/
│   ├── useProtocolState.ts  # State management & persistence controller
│   ├── useCountdown.ts      # Live tick math for the locked timer
│   └── useNotifications.ts  # Expo notifications scheduler, permission handler & daily reminder logic
├── components/
│   ├── common/
│   │   ├── Button.tsx       # Primary & destructive minimal buttons
│   │   ├── Card.tsx         # Dark container surfaces
│   │   └── StepProgress.tsx # Step counter / navigation bar (1/6 to 6/6)
│   └── locked/
│       ├── TimerDisplay.tsx        # Monospace countdown visualizer
│       ├── ReadinessBanner.tsx     # "You'll be ready to read at [time]" in-app banner
│       └── NotificationWarning.tsx # Persistent warning banner shown when permission is denied
├── screens/
│   ├── OnboardingScreen.tsx # Cold manifest & protocol disclaimer
│   ├── EditingScreen.tsx    # Multi-step focus question flow
│   ├── LockSetupModal.tsx   # Cooldown duration picker (24h, 48h, Custom) + daily reminder time picker
│   ├── LockedScreen.tsx     # The Vault screen with active countdown, readiness banner & edit entry point
│   └── UnveilScreen.tsx     # Read-only review with Burn / Archive actions
└── App.tsx                  # Root navigator / State Switcher
```

---

## 3. Data Model

```typescript
export type ProtocolPhase = 'ONBOARDING' | 'EDITING' | 'LOCKED' | 'UNLOCKED';

export interface QuestionItem {
  id: string;
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
  lockTimestamp: number | null;
  unlockTimestamp: number | null;

  // Notification-related state
  notificationPermissionGranted: boolean;
  dailyReminderHour: number | null;   // 0-23, user-selected hour for daily reminder
  dailyReminderMinute: number | null; // 0-59
  scheduledNotificationIds: string[]; // all pending notification IDs (daily reminders + final unlock alert)
}
```

---

## 4. Static Question Content

```typescript
export const PROTOCOL_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    stepNumber: 1,
    category: 'Concrete Reality',
    prompt: 'What does this person actually do for you on a day-to-day basis?',
    guidanceTip: 'Skip vague declarations like "they love me" or "they care." If you cannot list at least two tangible, observable actions from the past month, leave this blank.',
    placeholder: 'List specific, observable behaviors and deeds...'
  },
  {
    id: 'q2',
    stepNumber: 2,
    category: 'Re-Selection',
    prompt: 'Knowing everything you know today, would you choose them if you met for the first time right now?',
    guidanceTip: 'Strip away the sunk cost fallacy, shared history, and habit. Answer with a simple Yes or No, followed by a one-sentence reason.',
    placeholder: 'Yes / No — because...'
  },
  {
    id: 'q3',
    stepNumber: 3,
    category: 'Sacrifice Balance',
    prompt: 'What boundaries have you compromised for them versus what they have sacrificed for you?',
    guidanceTip: 'Be ruthlessly honest about the asymmetry. If your side is filled with unreciprocated compromises, confront that reality directly.',
    placeholder: 'Your compromises vs. their tangible sacrifices...'
  },
  {
    id: 'q4',
    stepNumber: 4,
    category: 'Uniqueness Test',
    prompt: 'What did you receive from this relationship that you cannot get from friends, family, or your own self-worth?',
    guidanceTip: 'Relieving loneliness or boredom is not a unique quality. Determine if there was genuine, irreplaceable value.',
    placeholder: 'Define what was truly unique (if anything)...'
  },
  {
    id: 'q5',
    stepNumber: 5,
    category: 'Character Evolution',
    prompt: 'Who did you become when you were around them?',
    guidanceTip: 'Did you grow more grounded, productive, and self-assured; or did you become anxious, walking on eggshells, and seeking constant validation?',
    placeholder: 'Describe your psychological state and personality shift...'
  },
  {
    id: 'q6',
    stepNumber: 6,
    category: 'Third-Person Perspective',
    prompt: 'If your closest friend were in this exact situation, what clear advice would you give them?',
    guidanceTip: 'Remove your ego and fear from the equation. Treat yourself with the same honest protection you would offer a loved one.',
    placeholder: 'Write the objective counsel you would give your best friend...'
  }
];
```

---

## 5. Detailed Screen Specifications

### 5.1 Onboarding Screen (`OnboardingScreen.tsx`)

- Headline: "The De-Romanticization Protocol"
- Sub-headline: "Emotional Clarity Through Cold Logic"
- Manifesto copy:
  > "Love is frequently an attachment to a mental construct rather than the person standing in front of you. This 6-step protocol dismantles emotional fog using grounded self-honesty.
  >
  > All answers are stored exclusively on this device. No accounts. No servers."
- CTA: Primary button "Enter Protocol"

### 5.2 Editing & Question Flow (`EditingScreen.tsx`)

**Header:**
- Displays "Step X of 6"
- Progress bar across the top
- Category badge (e.g., `[Sacrifice Balance]`)

**Body:**
- Distinct question prompt (high-contrast white, bold typography)
- Static guidance card with subtle border accent (`#23232F`) and muted helper text
- Multiline `TextInput`, auto-focused, auto-expanding, with dark focus ring

**Footer navigation:**
- Previous button (disabled on Step 1)
- Next button (Steps 1–5)
- Step 6 action: "Initiate Lock & Cool-Down" (opens `LockSetupModal`)

**Input persistence:** every character typed is saved instantly into local storage via debounced/direct hook writes.

This same screen (or a shared component) is reused as the **edit view during LOCKED phase** — see 5.4.

### 5.3 Lock Setup Modal (`LockSetupModal.tsx`)

- Title: "Select Cool-Down Interval"
- Explanation: "To break cognitive loops, your answers will be locked immediately. You'll still be able to revisit and edit what you wrote, but you won't be able to do a full objective review until the cool-down ends."

**Preset options:**
- 24 Hours (Standard Reset)
- 48 Hours (Deep Clarity)
- Custom Date / Time

**Daily reminder time picker:**
- A required step in this modal: "Choose a time you'd like a daily reminder, so you don't forget you're mid-protocol."
- Uses `@react-native-community/datetimepicker` in time-only mode.
- Defaults to the current time if the user does not change it.

**Notification permission flow (must happen inside this modal, before sealing):**
1. When the user taps "Confirm & Seal Vault", first request notification permission via `expo-notifications` (`requestPermissionsAsync`), with an explanatory pre-prompt so the OS dialog isn't a surprise: *"Reality Check would like to send you a daily reminder and a notification when your cool-down ends. This is optional — the app works fully without it."*
2. **If permission is granted:**
   - Schedule a repeating daily local notification at the chosen hour/minute, active only until `unlockTimestamp` (do not fire reminders after unlock).
   - Schedule one additional one-time notification exactly at `unlockTimestamp`: *"Your De-Romanticization review is ready. Open with an objective mind."*
   - Store all returned notification IDs in `scheduledNotificationIds`.
3. **If permission is denied:**
   - Do **not** block the flow. Proceed to seal the vault and transition to `LOCKED` regardless.
   - Set `notificationPermissionGranted: false` in state.
   - No notifications are scheduled.
   - The user will instead rely on the in-app readiness banner (5.4) every time they open the app.

**Confirmation action:** "Confirm & Seal Vault" → transitions state to `LOCKED`.

### 5.4 The Locked Vault (`LockedScreen.tsx`)

- Status badge: `● VAULT LOCKED`
- Headline: "Mind in Cool-Down"
- Body text: "Your answers have been sealed for review. The brain needs time to decouple dopamine from narrative. Step away from your phone and live your reality."
- Timer: high-contrast monospace countdown (`HH:MM:SS`)

**Readiness banner (`ReadinessBanner.tsx`) — always shown, regardless of notification permission:**
- On every app open (cold launch or foreground return) while in `LOCKED` phase, show a persistent card near the top of this screen stating the exact readiness moment, e.g.: *"You'll be ready to read this on [formatted date] at [formatted time]."*
- This is shown **unconditionally** — it is not just a fallback for denied permissions, it's the primary in-app source of truth, since notifications can fail, be dismissed, or be silently disabled by the OS.

**Notification warning (`NotificationWarning.tsx`) — shown only if `notificationPermissionGranted === false`:**
- A distinct, clearly-styled warning banner (not the same as the readiness banner) stating: *"Notifications are off, so you won't get a reminder or an alert when your cool-down ends. Check back here on [date/time], or enable notifications in system settings."*
- Include a small secondary action "Open Settings" (deep-links to the OS app settings page) alongside a "Got it" dismiss action. Dismissing should not permanently hide the banner — show it again on next app open, since the underlying problem (no notification) persists.

**Edit entry point:**
- Below the readiness banner, render a clearly visible secondary link/button: **"Edit what I wrote"**.
- Tapping it navigates into the same question-flow UI as `EditingScreen.tsx` (steps 1–6, prefilled with existing answers), but in this context:
  - There is no "Initiate Lock & Cool-Down" action at step 6 — instead a simple "Save Changes" action that returns to `LockedScreen`.
  - The countdown (`lockTimestamp` / `unlockTimestamp`) is **not** modified in any way by editing.
  - Any scheduled notifications are **not** cancelled or rescheduled by editing.

**Auto-check:** when the app returns to the foreground (`AppState` change) or the timer reaches zero, verify `Date.now() >= unlockTimestamp` and seamlessly transition state to `UNLOCKED`.

### 5.5 The Unveil Screen (`UnveilScreen.tsx`)

- Headline: "Objective Review"
- Sub-headline: "Read your own words as an external observer."
- Content: vertical scrollable list displaying all 6 questions with the user's answers rendered inside read-only, high-contrast cards.

**Bottom fixed action bar:**
- **"Clear Mind (Burn Data)"** (destructive style): prompts confirmation dialog ("Burn All Records? This action is permanent and clears all local data."). On confirmation: wipes storage, cancels all pending notifications (including any still-scheduled daily reminders), and resets app to `ONBOARDING`.
- **"Archive Session"** (secondary style): keeps the session safely accessible in read-only state for ongoing grounding. Also cancels any still-pending notifications tied to this session (they're no longer relevant once unlocked).

---

## 6. Design System & Tokens (`src/constants/colors.ts`)

```typescript
export const COLORS = {
  background: '#090A0F',
  surface: '#12131C',
  surfaceBorder: '#1E202E',
  surfaceHover: '#181A26',
  textPrimary: '#F4F4F6',
  textSecondary: '#8B8D9E',
  textTertiary: '#565869',
  accent: '#E0E1EC',
  accentMuted: 'rgba(224, 225, 236, 0.1)',
  danger: '#EF4444',
  dangerSurface: 'rgba(239, 68, 68, 0.12)',
  success: '#10B981'
};
```

---

## 7. Notification Logic Details (`useNotifications.ts`)

- Expose: `requestPermission()`, `scheduleLockNotifications(unlockTimestamp, dailyHour, dailyMinute)`, `cancelAllNotifications(ids: string[])`.
- Daily reminder notifications must be scheduled as repeating triggers (`hour`, `minute`, `repeats: true`) and must be explicitly cancelled once `unlockTimestamp` passes or the vault is burned/archived — do not let them keep firing after the protocol ends.
- The one-time unlock notification uses a `date` trigger set to `unlockTimestamp`.
- All scheduling/cancellation must be wrapped in try/catch; failures must never crash the app or block phase transitions — notification issues are always non-fatal, since the in-app readiness banner is the source of truth.

---

## 8. Implementation Checklist

- Write robust, clean, and fully typed TypeScript code for all screens, components, and custom hooks.
- Handle keyboard-avoiding behavior gracefully (`KeyboardAvoidingView` or `react-native-keyboard-controller`).
- Implement notification scheduling, daily repeating reminders, and cancellation logic using `expo-notifications`, including graceful handling of denied permissions as described in Section 5.3–5.4.
- Ensure flawless state restoration from local storage on app cold launch, including correctly resuming `LOCKED` phase with the right countdown and correctly restoring `notificationPermissionGranted`.
- Never use language, comments, or UI copy implying real cryptographic encryption — the lock is a state/UI gate only (see Section 1).
- Editing answers during `LOCKED` phase must never mutate `lockTimestamp` or `unlockTimestamp`.