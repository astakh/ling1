import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Flame, Target, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const WEEKLY_DATA = [
  { day: 'Пн', words: 8, minutes: 12 },
  { day: 'Вт', words: 12, minutes: 18 },
  { day: 'Ср', words: 5, minutes: 8 },
  { day: 'Чт', words: 15, minutes: 22 },
  { day: 'Пт', words: 10, minutes: 15 },
  { day: 'Сб', words: 20, minutes: 28 },
  { day: 'Вс', words: 7, minutes: 10 },
];

const MONTHLY_PROGRESS = [
  { week: 'Нед 1', words: 25 },
  { week: 'Нед 2', words: 42 },
  { week: 'Нед 3', words: 58 },
  { week: 'Нед 4', words: 47 },
];

export function StatsPage() {
  const { user, wordProgress } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const totalWords = wordProgress.length;
  const customWords = wordProgress.filter(w => w.isCustom).length;
  const masteredWords = wordProgress.filter(w => w.reviewCount >= 5).length;
  const learningWords = wordProgress.filter(w => w.reviewCount > 0 && w.reviewCount < 5).length;
  const newWords = wordProgress.filter(w => w.reviewCount === 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Статистика и прогресс</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Overview stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Всего слов', value: totalWords, color: 'indigo' },
            { icon: Target, label: 'Закреплено', value: masteredWords, color: 'green' },
            { icon: TrendingUp, label: 'В процессе', value: learningWords, color: 'amber' },
            { icon: Flame, label: 'Streak', value: `${user.streak} дн.`, color: 'orange' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <stat.icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Активность за неделю
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={WEEKLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Bar dataKey="words" fill="#6366f1" radius={[4, 4, 0, 0]} name="Слов" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Прогресс по неделям
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MONTHLY_PROGRESS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="words" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Новых слов" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Word distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Распределение слов</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Новые</span>
                <span className="text-sm font-medium text-gray-800">{newWords}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(newWords / totalWords) * 100}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">В процессе</span>
                <span className="text-sm font-medium text-gray-800">{learningWords}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(learningWords / totalWords) * 100}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Закреплено</span>
                <span className="text-sm font-medium text-gray-800">{masteredWords}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: `${(masteredWords / totalWords) * 100}%` }} />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Пользовательских слов: {customWords}
          </p>
        </motion.div>

        {/* FSRS details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Детали FSRS</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Слово</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Стабильность</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Сложность</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Повторений</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Ошибок</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">След. показ</th>
                </tr>
              </thead>
              <tbody>
                {wordProgress.map(word => (
                  <tr key={word.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{word.text}</td>
                    <td className="py-3 px-4 text-gray-600">{word.fsrsStability.toFixed(1)}</td>
                    <td className="py-3 px-4 text-gray-600">{word.fsrsDifficulty.toFixed(1)}</td>
                    <td className="py-3 px-4 text-gray-600">{word.reviewCount}</td>
                    <td className="py-3 px-4 text-gray-600">{word.lapses}</td>
                    <td className="py-3 px-4">
                      {new Date(word.nextReviewAt) <= new Date() ? (
                        <span className="text-amber-600 font-medium">Сегодня</span>
                      ) : (
                        <span className="text-gray-600">
                          {new Date(word.nextReviewAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
