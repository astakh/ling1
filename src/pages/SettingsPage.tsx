import { useState } from 'react';
import { useApp, LANGUAGES, CEFR_LEVELS } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, CreditCard, Shield } from 'lucide-react';

const INTENSITY_PRESETS = [
  { label: 'Лёгкий', newWords: 3, reviews: 10 },
  { label: 'Стандартный', newWords: 5, reviews: 20 },
  { label: 'Интенсивный', newWords: 10, reviews: 40 },
];

export function SettingsPage() {
  const { user, updateSettings, logout } = useApp();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const [nativeLang, setNativeLang] = useState(user.nativeLanguage);
  const [learningLang, setLearningLang] = useState(user.learningLanguage);
  const [level, setLevel] = useState(user.cefrLevel);
  const [intensityIdx, setIntensityIdx] = useState(
    INTENSITY_PRESETS.findIndex(p => p.newWords === user.intensityNewWords)
  );

  const handleSave = () => {
    const preset = INTENSITY_PRESETS[intensityIdx >= 0 ? intensityIdx : 1];
    updateSettings({
      nativeLanguage: nativeLang,
      learningLanguage: learningLang,
      cefrLevel: level,
      intensityNewWords: preset.newWords,
      intensityReviews: preset.reviews,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const langName = (code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.name} (${lang.nativeName})` : code;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Настройки</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Language settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Языковая пара</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Родной язык</label>
              <select
                value={nativeLang}
                onChange={e => setNativeLang(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Изучаемый язык</label>
              <select
                value={learningLang}
                onChange={e => setLearningLang(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              >
                {LANGUAGES.filter(l => l.code !== nativeLang).map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Уровень (CEFR)</label>
            <div className="flex gap-2">
              {CEFR_LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                    level === l
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Intensity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Интенсивность обучения</h3>

          <div className="space-y-3">
            {INTENSITY_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => setIntensityIdx(i)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                  intensityIdx === i
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="font-semibold text-gray-800">{preset.label}</span>
                  <p className="text-sm text-gray-500">{preset.newWords} новых слов, ~{preset.reviews} повторений в день</p>
                </div>
                {intensityIdx === i && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Подписка
          </h3>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800">Пробный период</p>
                <p className="text-sm text-amber-600">
                  Истекает: {new Date(user.trialExpiresAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                Оформить подписку
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Платёжный процессинг будет настроен позже (Stripe / ЮKassa)</span>
          </div>
        </motion.div>

        {/* Save button */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Сохранено!' : 'Сохранить изменения'}
          </button>
          <button
            onClick={logout}
            className="py-3 px-6 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all"
          >
            Выйти
          </button>
        </div>

        {/* Current settings summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gray-50 rounded-xl p-4"
        >
          <h4 className="text-sm font-medium text-gray-600 mb-2">Текущие настройки:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
            <p>Родной язык: {langName(nativeLang)}</p>
            <p>Изучаемый: {langName(learningLang)}</p>
            <p>Уровень: {level}</p>
            <p>Интенсивность: {INTENSITY_PRESETS[intensityIdx >= 0 ? intensityIdx : 1].label}</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
