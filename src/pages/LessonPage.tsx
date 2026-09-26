import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

export function LessonPage() {
  const { currentLesson, submitAnswer, finishLesson } = useApp();
  const navigate = useNavigate();
  const [localIndex, setLocalIndex] = useState(0);
  const [userTranslation, setUserTranslation] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState<{ word: string; correct: boolean }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [localIndex]);

  if (!currentLesson) {
    navigate('/topics');
    return null;
  }

  const card = currentLesson.cards[localIndex];
  const isLast = localIndex >= currentLesson.cards.length - 1;
  const progress = ((localIndex + 1) / currentLesson.cards.length) * 100;

  // Simulate LLM evaluation
  const simulateEvaluation = (userText: string) => {
    const targetWords = card.targetWords;
    const correctTranslation = card.translation.toLowerCase();
    const userLower = userText.toLowerCase();

    const evals = targetWords.map(word => {
      const wordLower = word.toLowerCase();
      // Simulate: if user text is reasonably close to correct translation, mark as correct
      const isCorrect = userLower.includes(wordLower) ||
        (correctTranslation.length > 10 && userLower.length > correctTranslation.length * 0.4);
      return { word, correct: isCorrect };
    });

    return evals;
  };

  const handleSubmit = async () => {
    if (!userTranslation.trim()) return;

    setIsEvaluating(true);

    // Simulate LLM API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const evals = simulateEvaluation(userTranslation);
    setEvaluations(evals);
    submitAnswer(localIndex, userTranslation, evals);
    setShowResult(true);
    setIsEvaluating(false);
  };

  const handleNext = () => {
    if (isLast) {
      finishLesson();
      navigate('/lesson/summary');
    } else {
      setShowResult(false);
      setUserTranslation('');
      setEvaluations([]);
      setLocalIndex(prev => prev + 1);
    }
  };

  const playAudio = () => {
    // Use browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.sentence);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">
              Карточка {localIndex + 1} из {currentLesson.cards.length}
            </span>
            <span className="text-sm text-gray-400">
              Целевые слова: {card.targetWords.join(', ')}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          key={localIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Sentence card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Audio section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
              <button
                onClick={playAudio}
                className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all"
              >
                <Volume2 className="w-6 h-6" />
                <span className="font-medium">Прослушать предложение</span>
              </button>
            </div>

            {/* Sentence text */}
            <div className="p-8">
              <p className="text-2xl font-medium text-gray-800 text-center leading-relaxed">
                {card.sentence.split(' ').map((word, i) => {
                  const cleanWord = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
                  const isTarget = card.targetWords.some(tw =>
                    cleanWord === tw.toLowerCase()
                  );
                  return (
                    <span
                      key={i}
                      className={isTarget ? 'text-indigo-600 font-bold underline decoration-indigo-300 decoration-2 underline-offset-4' : ''}
                    >
                      {word}{' '}
                    </span>
                  );
                })}
              </p>

              <div className="mt-4 flex justify-center gap-2">
                {card.targetWords.map(word => (
                  <span key={word} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Translation input */}
            <div className="px-8 pb-8">
              {!showResult ? (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Введите перевод предложения:
                  </label>
                  <textarea
                    ref={inputRef}
                    value={userTranslation}
                    onChange={e => setUserTranslation(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none h-24"
                    placeholder="Ваш перевод на русский язык..."
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!userTranslation.trim() || isEvaluating}
                    className="mt-4 w-full py-3 px-4 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Оцениваем перевод...
                      </>
                    ) : (
                      <>
                        Проверить
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Evaluation results */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Оценка перевода целевых слов:</h4>
                      <div className="flex flex-wrap gap-2">
                        {evaluations.map((ev, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                              ev.correct
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {ev.correct ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {ev.word}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Correct translation */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-green-700 mb-1">Правильный перевод:</h4>
                      <p className="text-green-800 font-medium">{card.translation}</p>
                    </div>

                    {/* Your translation */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Ваш перевод:</h4>
                      <p className="text-gray-700">{userTranslation}</p>
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isLast ? 'Завершить урок' : 'Следующее предложение'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
