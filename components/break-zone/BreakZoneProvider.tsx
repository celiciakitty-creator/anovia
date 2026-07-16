"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createDefaultTriviaSession,
  getTriviaQuestionAt,
} from "@/lib/break-zone-trivia-utils";
import {
  DEFAULT_BREAK_ZONE_DATA,
  readBreakZone,
  writeBreakZone,
} from "@/lib/break-zone-storage";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import type { BreakPresetMinutes, BreakZoneData } from "@/types/break-zone";

type BreakZoneContextValue = {
  data: BreakZoneData;
  setBreakPreset: (minutes: BreakPresetMinutes) => void;
  saveReactionBest: (ms: number) => void;
  setSessionFactIndex: (index: number) => void;
  sessionFactIndex: number;
  answerTrivia: (selectedIndex: number) => void;
  nextTriviaQuestion: () => void;
  resetTriviaSession: () => void;
};

const BreakZoneContext = createContext<BreakZoneContextValue | null>(null);

function persist(data: BreakZoneData) {
  writeBreakZone(data);
}

export function BreakZoneProvider({ children }: { children: React.ReactNode }) {
  const storageReady = useStorageHydration();
  const [data, setData] = useState<BreakZoneData>(DEFAULT_BREAK_ZONE_DATA);
  const [sessionFactIndex, setSessionFactIndexState] = useState(0);
  const breakZoneLoadedRef = useRef(false);

  useEffect(() => {
    if (!storageReady || breakZoneLoadedRef.current) return;
    breakZoneLoadedRef.current = true;
    const loaded = readBreakZone();
    setData(loaded);
    setSessionFactIndexState(loaded.dailyFact.factIndex);
  }, [storageReady]);

  const setBreakPreset = useCallback((minutes: BreakPresetMinutes) => {
    setData((current) => {
      const next = {
        ...current,
        breakTimer: { presetMinutes: minutes },
      };
      persist(next);
      return next;
    });
  }, []);

  const saveReactionBest = useCallback((ms: number) => {
    setData((current) => {
      const best =
        current.reactionGame.bestMs === null
          ? ms
          : Math.min(current.reactionGame.bestMs, ms);
      const next = {
        ...current,
        reactionGame: { bestMs: best },
      };
      persist(next);
      return next;
    });
  }, []);

  const setSessionFactIndex = useCallback((index: number) => {
    setSessionFactIndexState(index);
  }, []);

  const answerTrivia = useCallback((selectedIndex: number) => {
    setData((current) => {
      const trivia = current.trivia;
      if (trivia.answered) return current;

      const question = getTriviaQuestionAt(trivia, trivia.questionIndex);
      const alreadyScored = trivia.scoredQuestionIndices.includes(trivia.questionIndex);
      const isCorrect = selectedIndex === question.correctIndex;
      const scoredQuestionIndices =
        isCorrect && !alreadyScored
          ? [...trivia.scoredQuestionIndices, trivia.questionIndex]
          : trivia.scoredQuestionIndices;
      const score =
        isCorrect && !alreadyScored ? trivia.score + 1 : trivia.score;

      const next = {
        ...current,
        trivia: {
          ...trivia,
          selectedIndex,
          answered: true,
          score,
          questionsAnswered: Math.max(trivia.questionsAnswered, trivia.questionIndex + 1),
          scoredQuestionIndices,
        },
      };
      persist(next);
      return next;
    });
  }, []);

  const nextTriviaQuestion = useCallback(() => {
    setData((current) => {
      const next = {
        ...current,
        trivia: {
          ...current.trivia,
          questionIndex: current.trivia.questionIndex + 1,
          selectedIndex: null,
          answered: false,
        },
      };
      persist(next);
      return next;
    });
  }, []);

  const resetTriviaSession = useCallback(() => {
    setData((current) => {
      const next = {
        ...current,
        trivia: createDefaultTriviaSession(),
      };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo<BreakZoneContextValue>(
    () => ({
      data,
      setBreakPreset,
      saveReactionBest,
      setSessionFactIndex,
      sessionFactIndex,
      answerTrivia,
      nextTriviaQuestion,
      resetTriviaSession,
    }),
    [
      data,
      setBreakPreset,
      saveReactionBest,
      setSessionFactIndex,
      sessionFactIndex,
      answerTrivia,
      nextTriviaQuestion,
      resetTriviaSession,
    ]
  );

  return (
    <BreakZoneContext.Provider value={value}>{children}</BreakZoneContext.Provider>
  );
}

export function useBreakZone() {
  const context = useContext(BreakZoneContext);
  if (!context) {
    throw new Error("useBreakZone must be used within a BreakZoneProvider");
  }
  return context;
}
