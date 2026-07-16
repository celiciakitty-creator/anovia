import { TRIVIA_QUESTIONS } from "@/data/break-zone-trivia";
import type { TriviaSession } from "@/types/break-zone";

export const TRIVIA_QUESTION_COUNT = TRIVIA_QUESTIONS.length;

export function shuffleQuestionOrder(length = TRIVIA_QUESTION_COUNT): number[] {
  const order = Array.from({ length }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function createDefaultTriviaSession(): TriviaSession {
  return {
    score: 0,
    questionsAnswered: 0,
    questionIndex: 0,
    questionOrder: shuffleQuestionOrder(),
    selectedIndex: null,
    answered: false,
    scoredQuestionIndices: [],
  };
}

export function normalizeTriviaSession(raw: unknown): TriviaSession {
  const fallback = createDefaultTriviaSession();
  if (!raw || typeof raw !== "object") return fallback;

  const data = raw as Partial<TriviaSession>;
  const questionOrder = normalizeQuestionOrder(data.questionOrder);
  const questionIndex = normalizeQuestionIndex(data.questionIndex, questionOrder.length);
  const scoredQuestionIndices = normalizeScoredIndices(
    data.scoredQuestionIndices,
    questionIndex
  );
  const score = scoredQuestionIndices.length;
  const questionsAnswered = normalizeQuestionsAnswered(
    data.questionsAnswered,
    questionIndex,
    Boolean(data.answered)
  );
  const selectedIndex = normalizeSelectedIndex(data.selectedIndex);
  const answered = Boolean(data.answered);

  return {
    score,
    questionsAnswered,
    questionIndex,
    questionOrder,
    selectedIndex: answered ? selectedIndex : null,
    answered,
    scoredQuestionIndices,
  };
}

function normalizeQuestionOrder(order: unknown): number[] {
  if (!Array.isArray(order) || order.length !== TRIVIA_QUESTION_COUNT) {
    return shuffleQuestionOrder();
  }

  const valid = order.every(
    (value) =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value < TRIVIA_QUESTION_COUNT
  );
  const unique = new Set(order).size === TRIVIA_QUESTION_COUNT;

  return valid && unique ? order : shuffleQuestionOrder();
}

function normalizeQuestionIndex(value: unknown, orderLength: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return 0;
  return Math.min(value, Math.max(orderLength - 1, 0));
}

function normalizeScoredIndices(value: unknown, maxIndex: number): number[] {
  if (!Array.isArray(value)) return [];
  const indices = value.filter(
    (item): item is number =>
      typeof item === "number" &&
      Number.isInteger(item) &&
      item >= 0 &&
      item <= maxIndex
  );
  return [...new Set(indices)];
}


function normalizeQuestionsAnswered(
  value: unknown,
  questionIndex: number,
  answered: boolean
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return answered ? questionIndex + 1 : questionIndex;
  }
  return Math.min(value, TRIVIA_QUESTION_COUNT);
}

function normalizeSelectedIndex(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value > 3) return null;
  return value;
}

export function getTriviaQuestionAt(session: TriviaSession, index: number) {
  const orderIndex = session.questionOrder[index % session.questionOrder.length];
  return TRIVIA_QUESTIONS[orderIndex];
}
