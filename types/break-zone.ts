export type TriviaQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

export type BreakPresetMinutes = 2 | 5 | 10;

export type BreakZoneData = {
  reactionGame: {
    bestMs: number | null;
  };
  dailyFact: {
    date: string;
    factIndex: number;
  };
  breakTimer: {
    presetMinutes: BreakPresetMinutes;
  };
  trivia: TriviaSession;
};

export type TriviaSession = {
  score: number;
  questionsAnswered: number;
  questionIndex: number;
  questionOrder: number[];
  selectedIndex: number | null;
  answered: boolean;
  scoredQuestionIndices: number[];
};

export const BREAK_PRESETS: BreakPresetMinutes[] = [2, 5, 10];

export type ReactionGameStatus = "idle" | "waiting" | "ready" | "result";
