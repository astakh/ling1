import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, BookOpen, TrendingUp, Plus, BarChart3, Settings, LogOut, Clock } from 'lucide-react';

export function DashboardPage() {
  const { user, wordProgress, logout } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const wordsDueToday = wordProgress.filter(w => new Date(w.nextReviewAt) <= new Date()).length;
  const totalWords = wordProgress.length;
  const masteredWords = wordProgress.filter(w => w.reviewCount >= 5).length;

  const langName = (code: string) => {
    const langs: Record<string, string> = { en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', it: 'Italiano', pt: 'Português', ja: '日本語', zh: '中文', ko: '한국어', ar: 'العربية', ru: 'Русский' };
    return langs[code] || code;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">LinguaFlow</h1>
              <p className="text-xs text-gray-500">{langName(user.nativeLanguage)} → {langName(user.learningLanguage)} • {user.cefrLevel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/add-word')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Добавить слово">
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => navigate('/stats')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Статистика">
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Настройки">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Выйти">
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Streak & Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{user.streak} дней подряд</span>
          </div>
          <p className="text-gray-500">Продолжайте в том же духе! Вы на правильном пути.</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">К повторению</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{wordsDueToday}</div>
            <p className="text-sm text-gray-400 mt-1">слов сегодня</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Всего слов</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalWords}</div>
            <p className="text-sm text-gray-400 mt-1">в вашем словаре</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Выучено</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{masteredWords}</div>
            <p className="text-sm text-gray-400 mt-1">слов закреплено</p>
          </motion.div>
        </div>

        {/* Start Lesson CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Готовы к уроку?</h2>
              <p className="text-indigo-100">
                {wordsDueToday > 0
                  ? `У вас ${wordsDueToday} слов на повторение. Выберите тему и начните!`
                  : 'Нет слов на повторение. Добавьте новые или повторите пройденные.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/topics')}
              className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl"
            >
              Начать урок
            </button>
          </div>
        </motion.div>

        {/* Subscription status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-medium text-amber-800">Пробный период</p>
              <p className="text-sm text-amber-600">
                Осталось {Math.max(0, Math.ceil((new Date(user.trialExpiresAt).getTime() - Date.now()) / 86400000))} дней
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
            Оформить подписку
          </button>
        </motion.div>

        {/* Word list preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ваши слова</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {wordProgress.slice(0, 5).map((word, i) => (
              <div key={word.id} className={`px-6 py-4 flex items-center justify-between ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium text-gray-800">{word.text}</span>
                  {word.isCustom && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">своё</span>}
                  <span className="text-gray-400">—</span>
                  <span className="text-gray-500">{word.translation}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {new Date(word.nextReviewAt) <= new Date() ? (
                      <span className="text-amber-500 font-medium">сегодня</span>
                    ) : (
                      `через ${Math.ceil((new Date(word.nextReviewAt).getTime() - Date.now()) / 86400000)} дн.`
                    )}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-2 h-2 rounded-full ${j < word.reviewCount ? 'bg-indigo-400' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
