export type QuestionType = 'single' | 'multiple' | 'blank' | 'custom';

export interface OptionInfo {
  id: string;
  value: string;
  isCorrect: boolean;
  label?: string;
}

export interface BlankInfo {
  id: string;
  answer: string | string[];
  caseSensitive?: boolean;
  trim?: boolean;
}

export interface QuestionData {
  id: string;
  title?: string;
  score: number;
  type: QuestionType;
  answerProp?: string | string[];
  options: Record<string, OptionInfo>;
  blanks: Record<string, BlankInfo>;
  userSelections: string[];
  userBlankAnswers: Record<string, string>;
  earnedScore: number;
  isCorrect: boolean;
  isAnswered: boolean;
  evaluated: boolean;
  expectedAnswerText?: string;
}

export interface ExamInstance {
  id: string;
  title?: string;
  questions: Record<string, QuestionData>;
  isSubmitted: boolean;
  submitTime?: number;
}
