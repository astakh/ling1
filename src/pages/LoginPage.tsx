import { useState } from 'react';
import { useApp } from '../store';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      register(email);
    } else {
      login(email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">LinguaFlow</h1>
          <p className="text-gray-500 mt-2">Учите слова в контексте предложений</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {isRegister ? 'Создать аккаунт' : 'Войти в аккаунт'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              {isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => login('demo@linguaflow.app')}
              className="w-full py-3 px-4 border-2 border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Демо-вход
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          14 дней бесплатного пробного периода
        </p>
      </motion.div>
    </div>
  );
}
