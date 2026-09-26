import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, Flame, Trophy } from 'lucide-react';

export function LessonSummaryPage() {
  const { currentLesson, user } = useApp();
  const navigate = useNavigate();

  if (!currentLesson || !user) {
    navigate('/dashboard');
    return null;
  }

  const totalCorrect = currentLesson.results.reduce((sum, r) => sum + r.correct, 0);
  const totalIncorrect = currentLesson.results.reduce((sum, r) => sum + r.incorrect, 0);
  const totalWords = totalCorrect + totalIncorrect;
  const accuracy = totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Celebration header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-4 shadow-lg"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">Урок завершён!</h1>
          <p className="text-gray-500 mt-2">Отличная работа! Вот ваши результаты:</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">{accuracy}%</div>
              <p className="text-sm text-gray-500 mt-1">Точность</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{totalCorrect}</div>
              <p className="text-sm text-gray-500 mt-1">Верных переводов</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500">{totalIncorrect}</div>
              <p className="text-sm text-gray-500 mt-1">Ошибок</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-8 h-8 text-orange-500" />
                <span className="text-4xl font-bold text-gray-900">{user.streak}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Дней подряд</p>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="mt-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Card details */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Детализация по предложениям:</h3>
          <div className="space-y-3">
            {currentLesson.cards.map((card, i) => {
              const result = currentLesson.results[i];
              const allCorrect = result && result.correct > 0 && result.incorrect === 0;
              return (
                <div key={card.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  {allCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <p className="text-sm text-gray-700 truncate flex-1">{card.sentence}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {card.targetWords.join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            На главную
          </button>
          <button
            onClick={() => navigate('/topics')}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            Ещё урок
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
