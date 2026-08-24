import { QuestionItem } from '../types/protocol';

export const PROTOCOL_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    stepNumber: 1,
    category: 'Concrete Reality',
    prompt: 'What does this person actually do for you on a day-to-day basis?',
    guidanceTip:
      'Skip vague declarations like "they love me" or "they care." If you cannot list at least two tangible, observable actions from the past month, leave this blank. You love the memory, not the present.',
    placeholder:
      'e.g., Regularly checks in on my wellbeing, actively helps during difficult days, keeps scheduled plans without cancelling...',
  },
  {
    id: 'q2',
    stepNumber: 2,
    category: 'Objective Choice',
    prompt: 'If you met this person today for the first time, would you choose them again?',
    guidanceTip:
      'Knowing everything you know now—their conflict patterns, how they treat you on bad days, and whether they keep promises—would you actively pursue them today?',
    placeholder:
      'e.g., Seeing how they dismiss my feelings during arguments and avoid accountability, I would not choose to get involved today...',
  },
  {
    id: 'q3',
    stepNumber: 3,
    category: 'Reciprocity Audit',
    prompt: 'How many times have you compromised your boundaries for them vs. them for you?',
    guidanceTip:
      'Compare what you consistently sacrifice against what they reciprocate. If your list is vastly longer, you do not love the person; you are addicted to sacrificing.',
    placeholder:
      'e.g., My compromises: Cancelled personal routines, tolerated silence, changed boundaries. Their compromises: Minimal to none...',
  },
  {
    id: 'q4',
    stepNumber: 4,
    category: 'Sovereignty & Need',
    prompt: 'What do you get from this dynamic that you cannot get from others or yourself?',
    guidanceTip:
      'Isolate genuine, irreplaceable connection from simple fear of loneliness. Most emotional needs can be fulfilled through close friendships, community, and personal growth.',
    placeholder:
      'e.g., I realized the validation and comfort I seek can be fulfilled by my friends, personal goals, and building my own routine...',
  },
  {
    id: 'q5',
    stepNumber: 5,
    category: 'Identity Shift',
    prompt: 'Who have you become next to this person—calmer and stronger, or anxious and diminished?',
    guidanceTip:
      'Compare your mental state before this dynamic to today. Have you grown more grounded, or have you become hypervigilant, insecure, and less alive?',
    placeholder:
      'e.g., I have become constantly on edge, overanalyzing every response, doubting my worth, and neglecting my personal ambitions...',
  },
  {
    id: 'q6',
    stepNumber: 6,
    category: 'External Perspective',
    prompt: 'If your best friend were in this exact situation, what advice would you give them?',
    guidanceTip:
      'Detach emotionally and view the dynamic as an outside observer. Looking from the outside activates cold logic rather than attachment chemistry.',
    placeholder:
      'e.g., I would tell them to walk away immediately, recognize that their energy is being drained, and stop waiting for potential...',
  },
];
