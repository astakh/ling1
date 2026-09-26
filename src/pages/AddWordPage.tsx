import { useState } from 'react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Check } from 'lucide-react';

export function AddWordPage() {
  const { addCustomWord } = useApp();
  const navigate = useNavigate();
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;

    addCustomWord(word.trim(), translation.trim());
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setWord('');
      setTranslation('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Добавить своё слово</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
        >
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Пользовательское слово</h2>
            <p className="text-gray-500 mt-1">
              Добавьте слово, которое хотите выучить. Оно не привязано к тематическому списку
              и будет повторяться наравне с остальными.
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Слово на изучаемом языке
              </label>
              <input
                type="text"
                value={word}
                onChange={e => setWord(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                placeholder="Например: serendipity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Перевод на родной язык
              </label>
              <input
                type="text"
                value={translation}
                onChange={e => setTranslation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                placeholder="Например: счастливая случайность"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!word.trim() || !translation.trim()}
              className={`w-full py-3 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  Слово добавлено!
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Добавить в словарь
                </>
              )}
            </button>
          </form>

          <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">💡 Примечание</h4>
            <p className="text-sm text-indigo-600">
              Пользовательские слова не привязаны к CEFR-уровню. При генерации предложений
              для повторения система будет учитывать общий уровень пользователя, но само слово
              не проверяется на соответствие частотному списку.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
