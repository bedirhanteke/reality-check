import { QuestionItem } from '../types/protocol';

export const PROTOCOL_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    stepNumber: 1,
    category: 'Concrete Reality',
    prompt: 'What does this person actually do for you on a day-to-day basis?',
    guidanceTip:
      'Skip vague declarations like "they love me" or "they care." If you cannot list at least two tangible, observable actions from the past month, leave this blank.',
    placeholder: 'List specific, observable behaviors and deeds...',
  },
  {
    id: 'q2',
    stepNumber: 2,
    category: 'Re-Selection',
    prompt: 'Knowing everything you know today, would you choose them if you met for the first time right now?',
    guidanceTip:
      'Strip away the sunk cost fallacy, shared history, and habit. Answer with a simple Yes or No, followed by a one-sentence reason.',
    placeholder: 'Yes / No — because...',
  },
  {
    id: 'q3',
    stepNumber: 3,
    category: 'Sacrifice Balance',
    prompt: 'What boundaries have you compromised for them versus what they have sacrificed for you?',
    guidanceTip:
      'Be ruthlessly honest about the asymmetry. If your side is filled with unreciprocated compromises, confront that reality directly.',
    placeholder: 'Your compromises vs. their tangible sacrifices...',
  },
  {
    id: 'q4',
    stepNumber: 4,
    category: 'Uniqueness Test',
    prompt: 'What did you receive from this relationship that you cannot get from friends, family, or your own self-worth?',
    guidanceTip:
      'Relieving loneliness or boredom is not a unique quality. Determine if there was genuine, irreplaceable value.',
    placeholder: 'Define what was truly unique (if anything)...',
  },
  {
    id: 'q5',
    stepNumber: 5,
    category: 'Character Evolution',
    prompt: 'Who did you become when you were around them?',
    guidanceTip:
      'Did you grow more grounded, productive, and self-assured; or did you become anxious, walking on eggshells, and seeking constant validation?',
    placeholder: 'Describe your psychological state and personality shift...',
  },
  {
    id: 'q6',
    stepNumber: 6,
    category: 'Third-Person Perspective',
    prompt: 'If your closest friend were in this exact situation, what clear advice would you give them?',
    guidanceTip:
      'Remove your ego and fear from the equation. Treat yourself with the same honest protection you would offer a loved one.',
    placeholder: 'Write the objective counsel you would give your best friend...',
  },
];
