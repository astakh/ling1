import { useApp, TOPICS } from '../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export function TopicSelectPage() {
  const { startLesson, user } = useApp();
  const navigate = useNavigate();

  const handleSelectTopic = (topicId: string) => {
    startLesson(topicId);
    navigate('/lesson');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Выберите тему урока</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-gray-500 mb-6">
          Предложения будут подобраны по теме. Ваш уровень: <strong>{user?.cefrLevel}</strong>
        </p>

        <div className="grid grid-cols-2 gap-4">
          {TOPICS.map((topic, i) => (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelectTopic(topic.id)}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
            >
              <span className="text-4xl mb-4 block">{topic.icon}</span>
              <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                {topic.name}
              </h3>
              <p className="text-gray-500 mt-2">{topic.description}</p>
              <div className="mt-4 flex items-center gap-2 text-indigo-500 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Начать урок →
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-8 bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <h4 className="font-semibold text-indigo-800 mb-2">💡 Как это работает?</h4>
          <p className="text-indigo-600 text-sm">
            Система подберёт слова, которые нужно повторить сегодня, и покажет их в контексте предложений
            по выбранной теме. Вы переводите предложение целиком — нейросеть оценивает каждый перевод.
          </p>
        </div>
      </main>
    </div>
  );
}
