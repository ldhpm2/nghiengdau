import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuestionType = 'text' | 'image' | 'image_question' | 'audio_question';
export type AnswerType = 'text' | 'image';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  A: string;
  A_type?: AnswerType;
  B: string;
  B_type?: AnswerType;
  correct: 'A' | 'B';
}

export interface GameSettings {
  questionsPerRound: number;
  randomize: boolean;
  totalRounds: number;
  customSounds?: {
    bgm?: string;
  };
}

export interface LeaderboardEntry {
  id: string;
  teamName: string;
  score: number;
  date: string;
}

export interface GameState {
  teamName: string;
  score: number;
  correctAnswers: number;
  currentRound: number;
}

interface StoreState {
  questions: Question[];
  settings: GameSettings;
  gameState: GameState;
  leaderboard: LeaderboardEntry[];
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  updateSettings: (s: Partial<GameSettings>) => void;
  setGameState: (s: Partial<GameState>) => void;
  resetGameState: () => void;
  loadInitialQuestions: (qs: Question[]) => void;
  addLeaderboardEntry: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  clearLeaderboard: () => void;
}

const defaultQuestions: Question[] = [
  {
    id: '1',
    question: 'Con mèo kêu thế nào?',
    type: 'text',
    A: 'Meo meo',
    B: 'Ò ó o',
    correct: 'A',
  },
  {
    id: '2',
    question: '2 + 1 bằng mấy?',
    type: 'text',
    A: '3',
    B: '4',
    correct: 'A',
  },
  {
    id: '3',
    question: 'Đâu là quả táo?',
    type: 'image',
    A: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=400&h=400&fit=crop',
    B: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
    correct: 'A',
  }
];

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      questions: defaultQuestions,
      settings: {
        questionsPerRound: 5,
        randomize: true,
        totalRounds: 1,
      },
      gameState: {
        teamName: '',
        score: 0,
        correctAnswers: 0,
        currentRound: 1,
      },
      leaderboard: [],
      addQuestion: (q) =>
        set((state) => ({
          questions: [...state.questions, { ...q, id: Date.now().toString() }],
        })),
      updateQuestion: (id, q) =>
        set((state) => ({
          questions: state.questions.map((question) =>
            question.id === id ? { ...question, ...q } : question
          ),
        })),
      removeQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      setGameState: (s) =>
        set((state) => ({ gameState: { ...state.gameState, ...s } })),
      resetGameState: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            score: 0,
            correctAnswers: 0,
            currentRound: 1,
          },
        })),
      loadInitialQuestions: (qs) => set({ questions: qs }),
      addLeaderboardEntry: (entry) =>
        set((state) => {
          const newEntry: LeaderboardEntry = {
            ...entry,
            id: Date.now().toString(),
            date: new Date().toISOString(),
          };
          const newLeaderboard = [...state.leaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
          return { leaderboard: newLeaderboard };
        }),
      clearLeaderboard: () => set({ leaderboard: [] }),
    }),
    {
      name: 'edu-game-storage',
    }
  )
);
