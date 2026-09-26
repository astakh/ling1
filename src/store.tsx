import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api';

// Types
export interface User {
  id: string;
  email: string;
  nativeLanguage: string;
  learningLanguage: string;
  cefrLevel: string;
  intensityNewWords: number;
  intensityReviews: number;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  trialExpiresAt: string;
  streak: number;
  lastLessonDate: string | null;
  totalWordsLearned: number;
  createdAt: string;
}

export interface WordProgress {
  id: string;
  wordId: string;
  text: string;
  translation: string;
  isCustom: boolean;
  fsrsStability: number;
  fsrsDifficulty: number;
  lastReviewAt: string | null;
  nextReviewAt: string;
  reviewCount: number;
  lapses: number;
}

export interface LessonCard {
  id: string;
  sentence: string;
  translation: string;
  targetWords: string[];
  audioUrl?: string;
  wordEvaluations?: { word: string; correct: boolean }[];
}

export interface LessonSession {
  id: string;
  sessionId: number; // Backend session ID
  topic: string;
  cards: LessonCard[];
  currentIndex: number;
  startedAt: string;
  finishedAt: string | null;
  results: { correct: number; incorrect: number; newWordsAdded: number }[];
}

interface AppState {
  user: User | null;
  wordProgress: WordProgress[];
  currentLesson: LessonSession | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  useMockData: boolean; // Флаг для демо-режима
}

interface AppContextType extends AppState {
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (nativeLang: string, learningLang: string, level: string, newWords: number, reviews: number) => void;
  startLesson: (topic: string) => Promise<void>;
  submitAnswer: (cardIndex: number, translation: string, evaluations: { word: string; correct: boolean }[]) => Promise<void>;
  finishLesson: () => Promise<void>;
  addCustomWord: (text: string, translation: string) => Promise<void>;
  updateSettings: (settings: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Mock data for lessons (fallback)
const MOCK_SENTENCES: Record<string, { sentence: string; translation: string; targetWords: string[] }[]> = {
  'food': [
    { sentence: 'I would like to order a delicious meal at this restaurant.', translation: 'Я хотел бы заказать восхитительное блюдо в этом ресторанте.', targetWords: ['order', 'delicious', 'meal'] },
    { sentence: 'The chef prepared a traditional dish with fresh ingredients.', translation: 'Шеф-повар приготовил традиционное блюдо из свежих ингредиентов.', targetWords: ['chef', 'traditional', 'ingredients'] },
    { sentence: 'We need to buy some vegetables and fruit at the market.', translation: 'Нам нужно купить немного овощей и фруктов на рынке.', targetWords: ['vegetables', 'fruit', 'market'] },
    { sentence: 'She enjoys cooking breakfast every morning for her family.', translation: 'Она любит готовить завтрак каждое утро для своей семьи.', targetWords: ['cooking', 'breakfast', 'family'] },
    { sentence: 'The recipe requires a cup of sugar and two eggs.', translation: 'Рецепт требует чашку сахара и два яйца.', targetWords: ['recipe', 'sugar', 'eggs'] },
  ],
  'travel': [
    { sentence: 'We booked a flight to Paris for our summer vacation.', translation: 'Мы забронировали рейс в Париж на наш летний отпуск.', targetWords: ['booked', 'flight', 'vacation'] },
    { sentence: 'The hotel is located near the city center and the beach.', translation: 'Отель расположен рядом с центром города и пляжем.', targetWords: ['hotel', 'located', 'beach'] },
    { sentence: 'I need to pack my suitcase before the trip tomorrow.', translation: 'Мне нужно собрать чемодан перед поездкой завтра.', targetWords: ['pack', 'suitcase', 'trip'] },
    { sentence: 'The tour guide showed us the famous historical monuments.', translation: 'Гид показал нам знаменитые исторические памятники.', targetWords: ['tour', 'guide', 'monuments'] },
    { sentence: 'We took a train from London to Edinburgh last weekend.', translation: 'Мы ехали на поезде из Лондона в Эдинбург в прошлые выходные.', targetWords: ['train', 'weekend', 'Edinburgh'] },
  ],
  'work': [
    { sentence: 'The manager scheduled a meeting to discuss the project deadline.', translation: 'Менеджер запланировал встречу для обсуждения срока проекта.', targetWords: ['manager', 'scheduled', 'deadline'] },
    { sentence: 'She received a promotion after completing the important assignment.', translation: 'Она получила повышение после выполнения важного задания.', targetWords: ['promotion', 'completing', 'assignment'] },
    { sentence: 'We need to improve our communication with the client.', translation: 'Нам нужно улучшить нашу коммуникацию с клиентом.', targetWords: ['improve', 'communication', 'client'] },
    { sentence: 'The company offers a competitive salary and benefits package.', translation: 'Компания предлагает конкурентную зарплату и пакет льгот.', targetWords: ['company', 'competitive', 'benefits'] },
    { sentence: 'He presented his research findings at the annual conference.', translation: 'Он представил результаты своего исследования на ежегодной конференции.', targetWords: ['presented', 'research', 'conference'] },
  ],
  'family': [
    { sentence: 'My grandmother tells wonderful stories about her childhood.', translation: 'Моя бабушка рассказывает чудесные истории о своём детстве.', targetWords: ['grandmother', 'wonderful', 'childhood'] },
    { sentence: 'The children play in the garden every afternoon after school.', translation: 'Дети играют в саду каждый день после школы.', targetWords: ['children', 'garden', 'afternoon'] },
    { sentence: 'We celebrate holidays together with our extended family.', translation: 'Мы празднуем праздники вместе с нашей большой семьёй.', targetWords: ['celebrate', 'holidays', 'extended'] },
    { sentence: 'My brother graduated from university last spring.', translation: 'Мой брат окончил университет прошлой весной.', targetWords: ['brother', 'graduated', 'university'] },
    { sentence: 'Parents always worry about their children safety.', translation: 'Родители всегда беспокоятся о безопасности своих детей.', targetWords: ['parents', 'worry', 'safety'] },
  ],
};

const TOPICS = [
  { id: 'food', name: 'Еда и рестораны', icon: '🍽️', description: 'Рестораны, кулинария, продукты' },
  { id: 'travel', name: 'Путешествия', icon: '✈️', description: 'Отпуск, транспорт, достопримечательности' },
  { id: 'work', name: 'Работа и бизнес', icon: '💼', description: 'Офис, карьера, деловое общение' },
  { id: 'family', name: 'Семья и отношения', icon: '👨‍👩‍👧‍👦', description: 'Родственники, праздники, дом' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Helper to generate mock FSRS data
function generateMockWordProgress(): WordProgress[] {
  const words: WordProgress[] = [
    { id: '1', wordId: 'w1', text: 'delicious', translation: 'восхитительный', isCustom: false, fsrsStability: 5.2, fsrsDifficulty: 4.1, lastReviewAt: new Date(Date.now() - 86400000 * 3).toISOString(), nextReviewAt: new Date().toISOString(), reviewCount: 4, lapses: 1 },
    { id: '2', wordId: 'w2', text: 'booked', translation: 'забронировал', isCustom: false, fsrsStability: 3.1, fsrsDifficulty: 5.5, lastReviewAt: new Date(Date.now() - 86400000 * 2).toISOString(), nextReviewAt: new Date().toISOString(), reviewCount: 2, lapses: 0 },
    { id: '3', wordId: 'w3', text: 'manager', translation: 'менеджер', isCustom: false, fsrsStability: 8.0, fsrsDifficulty: 3.2, lastReviewAt: new Date(Date.now() - 86400000 * 5).toISOString(), nextReviewAt: new Date(Date.now() + 86400000).toISOString(), reviewCount: 6, lapses: 0 },
    { id: '4', wordId: 'w4', text: 'grandmother', translation: 'бабушка', isCustom: false, fsrsStability: 2.0, fsrsDifficulty: 6.0, lastReviewAt: new Date(Date.now() - 86400000).toISOString(), nextReviewAt: new Date().toISOString(), reviewCount: 1, lapses: 1 },
    { id: '5', wordId: 'w5', text: 'vacation', translation: 'отпуск', isCustom: false, fsrsStability: 4.5, fsrsDifficulty: 4.8, lastReviewAt: new Date(Date.now() - 86400000 * 4).toISOString(), nextReviewAt: new Date().toISOString(), reviewCount: 3, lapses: 0 },
    { id: '6', wordId: 'w6', text: 'recipe', translation: 'рецепт', isCustom: true, fsrsStability: 1.5, fsrsDifficulty: 7.0, lastReviewAt: new Date(Date.now() - 86400000 * 2).toISOString(), nextReviewAt: new Date().toISOString(), reviewCount: 1, lapses: 2 },
  ];
  return words;
}

// Load state from localStorage
function loadState(): AppState {
  try {
    const saved = localStorage.getItem('linguaflow_state');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }
  return {
    user: null,
    wordProgress: [],
    currentLesson: null,
    isAuthenticated: false,
    isOnboarded: false,
    useMockData: true, // По умолчанию демо-режим
  };
}

function saveState(state: AppState) {
  localStorage.setItem('linguaflow_state', JSON.stringify(state));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const login = async (email: string, password: string = 'demo') => {
    // Пытаемся войти через API
    try {
      await apiClient.login(email, password);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        useMockData: false,
        user: prev.user || {
          id: '1',
          email,
          nativeLanguage: 'ru',
          learningLanguage: 'en',
          cefrLevel: 'B1',
          intensityNewWords: 5,
          intensityReviews: 20,
          subscriptionStatus: 'trial',
          trialExpiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
          streak: 5,
          lastLessonDate: new Date(Date.now() - 86400000).toISOString(),
          totalWordsLearned: 47,
          createdAt: new Date().toISOString(),
        },
        wordProgress: prev.wordProgress.length ? prev.wordProgress : generateMockWordProgress(),
      }));
    } catch (error) {
      // Если API недоступен, используем демо-режим
      console.warn('API unavailable, using mock data:', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        useMockData: true,
        user: prev.user || {
          id: '1',
          email,
          nativeLanguage: 'ru',
          learningLanguage: 'en',
          cefrLevel: 'B1',
          intensityNewWords: 5,
          intensityReviews: 20,
          subscriptionStatus: 'trial',
          trialExpiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
          streak: 5,
          lastLessonDate: new Date(Date.now() - 86400000).toISOString(),
          totalWordsLearned: 47,
          createdAt: new Date().toISOString(),
        },
        wordProgress: prev.wordProgress.length ? prev.wordProgress : generateMockWordProgress(),
      }));
    }
  };

  const register = async (email: string, password: string = 'demo') => {
    try {
      await apiClient.register(email, password);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        useMockData: false,
        user: {
          id: '1',
          email,
          nativeLanguage: '',
          learningLanguage: '',
          cefrLevel: '',
          intensityNewWords: 5,
          intensityReviews: 20,
          subscriptionStatus: 'trial',
          trialExpiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
          streak: 0,
          lastLessonDate: null,
          totalWordsLearned: 0,
          createdAt: new Date().toISOString(),
        },
        isOnboarded: false,
      }));
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        useMockData: true,
        user: {
          id: '1',
          email,
          nativeLanguage: '',
          learningLanguage: '',
          cefrLevel: '',
          intensityNewWords: 5,
          intensityReviews: 20,
          subscriptionStatus: 'trial',
          trialExpiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
          streak: 0,
          lastLessonDate: null,
          totalWordsLearned: 0,
          createdAt: new Date().toISOString(),
        },
        isOnboarded: false,
      }));
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setState({
      user: null,
      wordProgress: [],
      currentLesson: null,
      isAuthenticated: false,
      isOnboarded: false,
      useMockData: true,
    });
  };

  const completeOnboarding = (nativeLang: string, learningLang: string, level: string, newWords: number, reviews: number) => {
    setState(prev => ({
      ...prev,
      isOnboarded: true,
      user: prev.user ? {
        ...prev.user,
        nativeLanguage: nativeLang,
        learningLanguage: learningLang,
        cefrLevel: level,
        intensityNewWords: newWords,
        intensityReviews: reviews,
      } : null,
      wordProgress: generateMockWordProgress(),
    }));
  };

  const startLesson = async (topic: string) => {
    if (!state.useMockData) {
      try {
        const response = await apiClient.startLesson(topic) as any;
        const cards: LessonCard[] = response.cards.map((c: any, i: number) => ({
          id: `card-${i}`,
          sentence: c.sentence,
          translation: c.translation,
          targetWords: c.target_words,
          audioUrl: c.audio_url,
        }));

        setState(prev => ({
          ...prev,
          currentLesson: {
            id: `lesson-${Date.now()}`,
            sessionId: response.session_id,
            topic,
            cards,
            currentIndex: 0,
            startedAt: new Date().toISOString(),
            finishedAt: null,
            results: [],
          },
        }));
        return;
      } catch (error) {
        console.warn('Failed to start lesson via API, using mock:', error);
      }
    }

    // Fallback to mock data
    const sentences = MOCK_SENTENCES[topic] || MOCK_SENTENCES['food'];
    const cards: LessonCard[] = sentences.map((s, i) => ({
      id: `card-${i}`,
      sentence: s.sentence,
      translation: s.translation,
      targetWords: s.targetWords,
    }));

    setState(prev => ({
      ...prev,
      currentLesson: {
        id: `lesson-${Date.now()}`,
        sessionId: Date.now(),
        topic,
        cards,
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        results: [],
      },
    }));
  };

  const submitAnswer = async (cardIndex: number, translation: string, evaluations: { word: string; correct: boolean }[]) => {
    if (!state.useMockData && state.currentLesson) {
      try {
        const response = await apiClient.submitAnswer(
          state.currentLesson.sessionId,
          cardIndex,
          translation
        ) as any;
        evaluations = response.evaluations.map((e: any) => ({
          word: e.word,
          correct: e.correct,
        }));
      } catch (error) {
        console.warn('Failed to submit answer via API, using local evaluation:', error);
      }
    }

    setState(prev => {
      if (!prev.currentLesson) return prev;
      const newResults = [...prev.currentLesson.results];
      const correctCount = evaluations.filter(e => e.correct).length;
      const incorrectCount = evaluations.filter(e => !e.correct).length;
      newResults[cardIndex] = { correct: correctCount, incorrect: incorrectCount, newWordsAdded: 0 };

      const updatedCards = [...prev.currentLesson.cards];
      updatedCards[cardIndex] = { ...updatedCards[cardIndex], wordEvaluations: evaluations };

      return {
        ...prev,
        currentLesson: {
          ...prev.currentLesson,
          cards: updatedCards,
          results: newResults,
        },
      };
    });
  };

  const finishLesson = async () => {
    if (!state.useMockData && state.currentLesson) {
      try {
        await apiClient.finishLesson(state.currentLesson.sessionId);
      } catch (error) {
        console.warn('Failed to finish lesson via API:', error);
      }
    }

    setState(prev => {
      if (!prev.currentLesson) return prev;
      const totalCorrect = prev.currentLesson.results.reduce((sum, r) => sum + r.correct, 0);

      return {
        ...prev,
        currentLesson: {
          ...prev.currentLesson,
          finishedAt: new Date().toISOString(),
        },
        user: prev.user ? {
          ...prev.user,
          streak: prev.user.streak + 1,
          lastLessonDate: new Date().toISOString(),
          totalWordsLearned: prev.user.totalWordsLearned + totalCorrect,
        } : null,
      };
    });
  };

  const addCustomWord = async (text: string, translation: string) => {
    if (!state.useMockData) {
      try {
        await apiClient.addCustomWord(text, translation);
      } catch (error) {
        console.warn('Failed to add word via API:', error);
      }
    }

    setState(prev => ({
      ...prev,
      wordProgress: [
        ...prev.wordProgress,
        {
          id: `custom-${Date.now()}`,
          wordId: `w-custom-${Date.now()}`,
          text,
          translation,
          isCustom: true,
          fsrsStability: 1.0,
          fsrsDifficulty: 5.0,
          lastReviewAt: null,
          nextReviewAt: new Date().toISOString(),
          reviewCount: 0,
          lapses: 0,
        },
      ],
    }));
  };

  const updateSettings = (settings: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...settings } : null,
    }));
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      completeOnboarding,
      startLesson,
      submitAnswer,
      finishLesson,
      addCustomWord,
      updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { LANGUAGES, CEFR_LEVELS, TOPICS };
