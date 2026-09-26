"""
Сервис для работы с GigaChat API (Сбер)
Документация: https://developers.sber.ru/docs/ru/gigachat/api/overview
"""
import json
import logging
from typing import Optional
import httpx
from config import settings

logger = logging.getLogger(__name__)


class GigaChatService:
    """
    Клиент для работы с GigaChat API
    
    Используется для:
    1. Генерации предложений с целевыми словами
    2. Оценки переводов пользователя
    """

    def __init__(self):
        self.base_url = settings.GIGACHAT_API_BASE
        self.auth_token = settings.GIGACHAT_AUTH_TOKEN
        self.scope = settings.GIGACHAT_SCOPE
        self.model = settings.GIGACHAT_MODEL
        self.verify_ssl = settings.GIGACHAT_VERIFY_SSL
        self._access_token: Optional[str] = None
        self._token_expires: Optional[float] = None

    async def _get_access_token(self) -> str:
        """Получить access token для API"""
        import time

        if self._access_token and self._token_expires and time.time() < self._token_expires:
            return self._access_token

        async with httpx.AsyncClient(verify=self.verify_ssl) as client:
            response = await client.post(
                f"{self.base_url}/oauth",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "RqUID": "*",
                    "Authorization": f"Bearer {self.auth_token}",
                },
                data={"scope": self.scope},
            )
            response.raise_for_status()
            data = response.json()
            self._access_token = data["access_token"]
            self._token_expires = data["expires_at"] / 1000 - 60  # за 60 сек до истечения
            return self._access_token

    async def _chat_completion(self, messages: list, temperature: float = 0.7) -> str:
        """Вызов чата GigaChat"""
        access_token = await self._get_access_token()

        async with httpx.AsyncClient(verify=self.verify_ssl, timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {access_token}",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": 1000,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def generate_sentence(
        self,
        target_words: list[str],
        learning_language: str,
        native_language: str,
        cefr_level: str,
        topic: str
    ) -> dict:
        """
        Генерация предложения с целевыми словами
        
        Args:
            target_words: список слов для включения в предложение
            learning_language: код изучаемого языка
            native_language: код родного языка
            cefr_level: уровень CEFR (A1-C2)
            topic: тематика предложения
            
        Returns:
            dict с полями: sentence, translation, target_words
        """
        lang_names = {
            "en": "английском", "de": "немецком", "fr": "французском",
            "es": "испанском", "it": "итальянском", "pt": "португальском",
            "ja": "японском", "zh": "китайском", "ko": "корейском",
            "ar": "арабском", "ru": "русском"
        }

        learning_lang_name = lang_names.get(learning_language, learning_language)
        native_lang_name = lang_names.get(native_language, native_language)

        words_str = ", ".join(target_words)

        prompt = f"""Создай одно предложение на {learning_lang_name} языке уровня {cefr_level} по теме "{topic}".

Требования:
1. Предложение должно содержать все следующие слова: {words_str}
2. Все остальные слова в предложении должны соответствовать уровню {cefr_level} (не сложнее)
3. Предложение должно быть естественным и осмысленным
4. Длина: 8-15 слов
5. Используй только базовую грамматику для уровня {cefr_level}

Ответь СТРОГО в формате JSON:
{{
    "sentence": "предложение на {learning_lang_name}",
    "translation": "перевод на {native_lang_name}",
    "target_words": {json.dumps(target_words)}
}}

НЕ добавляй никаких пояснений, только JSON."""

        messages = [
            {"role": "system", "content": "Ты — лингвист и преподаватель иностранных языков. Отвечай только валидным JSON."},
            {"role": "user", "content": prompt}
        ]

        try:
            response_text = await self._chat_completion(messages, temperature=0.8)
            # Извлекаем JSON из ответа
            result = json.loads(response_text)
            return {
                "sentence": result["sentence"],
                "translation": result["translation"],
                "target_words": result.get("target_words", target_words)
            }
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse GigaChat response: {e}")
            # Fallback: простое предложение
            return {
                "sentence": f"I like {target_words[0]} very much.",
                "translation": f"Мне очень нравится {target_words[0]}.",
                "target_words": target_words
            }

    async def evaluate_translation(
        self,
        original_sentence: str,
        user_translation: str,
        target_words: list[str],
        learning_language: str,
        native_language: str
    ) -> dict:
        """
        Оценка перевода пользователя
        
        Args:
            original_sentence: оригинальное предложение на изучаемом языке
            user_translation: перевод пользователя на родной язык
            target_words: целевые слова, которые нужно было перевести
            learning_language: код изучаемого языка
            native_language: код родного языка
            
        Returns:
            dict с оценкой каждого целевого слова
        """
        lang_names = {
            "en": "английском", "de": "немецком", "fr": "французском",
            "es": "испанском", "it": "итальянском", "pt": "португальском",
            "ja": "японском", "zh": "китайском", "ko": "корейском",
            "ar": "арабском", "ru": "русском"
        }

        learning_lang_name = lang_names.get(learning_language, learning_language)
        native_lang_name = lang_names.get(native_language, native_language)

        prompt = f"""Оцени перевод пользователя с {learning_lang_name} на {native_lang_name}.

Оригинальное предложение: "{original_sentence}"
Перевод пользователя: "{user_translation}"

Целевые слова для оценки: {', '.join(target_words)}

Для каждого целевого слова определи, правильно ли оно переведено в контексте предложения.
Учитывай:
- Правильность перевода конкретного слова
- Контекст предложения
- Допустимы небольшие грамматические неточности, если смысл передан верно

Ответь СТРОГО в формате JSON:
{{
    "evaluations": [
        {{"word": "слово1", "correct": true, "user_translation": "перевод пользователя"}},
        {{"word": "слово2", "correct": false, "user_translation": "перевод пользователя", "correct_translation": "правильный перевод"}}
    ],
    "overall_score": 0-100,
    "feedback": "краткий комментарий"
}}

НЕ добавляй никаких пояснений, только JSON."""

        messages = [
            {"role": "system", "content": "Ты — эксперт по оценке переводов. Отвечай только валидным JSON."},
            {"role": "user", "content": prompt}
        ]

        try:
            response_text = await self._chat_completion(messages, temperature=0.3)
            result = json.loads(response_text)
            return result
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse GigaChat evaluation: {e}")
            # Fallback: все слова правильные
            return {
                "evaluations": [
                    {"word": word, "correct": True, "user_translation": "unknown"}
                    for word in target_words
                ],
                "overall_score": 50,
                "feedback": "Ошибка оценки"
            }


# Singleton
gigachat_service = GigaChatService()
