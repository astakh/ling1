import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, LANGUAGES, CEFR_LEVELS } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Globe, BookOpen, Target, Zap } from 'lucide-react';

const INTENSITY_PRESETS = [
  { label: 'Лёгкий', newWords: 3, reviews: 10, desc: '3 новых слова, ~10 повторений' },
  { label: 'Стандартный', newWords: 5, reviews: 20, desc: '5 новых слов, ~20 повторений' },
  { label: 'Интенсивный', newWords: 10, reviews: 40, desc: '10 новых слов, ~40 повторений' },
];

export function OnboardingPage() {
  const { completeOnboarding } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [nativeLang, setNativeLang] = useState('ru');
  const [learningLang, setLearningLang] = useState('en');
  const [level, setLevel] = useState('B1');
  const [intensityIdx, setIntensityIdx] = useState(1);

  const steps = [
    { icon: Globe, title: 'Ваш родной язык', subtitle: 'На каком языке вы думаете?' },
    { icon: BookOpen, title: 'Какой язык учим?', subtitle: 'Выберите изучаемый язык' },
    { icon: Target, title: 'Ваш уровень', subtitle: 'Оцените свой текущий уровень (CEFR)' },
    { icon: Zap, title: 'Интенсивность', subtitle: 'Сколько слов в день?' },
  ];

  const handleComplete = () => {
    const preset = INTENSITY_PRESETS[intensityIdx];
    completeOnboarding(nativeLang, learningLang, level, preset.newWords, preset.reviews);
    navigate('/dashboard');
  };

  const canProceed = () => {
    if (step === 0) return nativeLang !== '';
    if (step === 1) return learningLang !== '' && learningLang !== nativeLang;
    if (step === 2) return level !== '';
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-100 mb-4">
                {(() => {
                  const Icon = steps[step].icon;
                  return <Icon className="w-7 h-7 text-indigo-600" />;
                })()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{steps[step].title}</h2>
              <p className="text-gray-500 mt-1">{steps[step].subtitle}</p>
            </div>

            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setNativeLang(lang.code)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      nativeLang === lang.code
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{lang.name}</div>
                    <div className="text-sm text-gray-500">{lang.nativeName}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.filter(l => l.code !== nativeLang).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLearningLang(lang.code)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      learningLang === lang.code
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{lang.name}</div>
                    <div className="text-sm text-gray-500">{lang.nativeName}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {CEFR_LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                      level === l
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-2xl font-bold ${level === l ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {l}
                    </span>
                    <span className="text-gray-700">
                      {l === 'A1' && 'Начальный — базовые фразы'}
                      {l === 'A2' && 'Элементарный — простые темы'}
                      {l === 'B1' && 'Средний — повседневные ситуации'}
                      {l === 'B2' && 'Выше среднего — сложные темы'}
                      {l === 'C1' && 'Продвинутый — свободное общение'}
                      {l === 'C2' && 'Владение языком — как носитель'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {INTENSITY_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setIntensityIdx(i)}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                      intensityIdx === i
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-lg">{preset.label}</span>
                      {intensityIdx === i && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{preset.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-0 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Далее
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
                >
                  Начать обучение
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
