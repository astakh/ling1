# Интеграция с GigaChat API

## Получение credentials

### 1. Регистрация на платформе Сбер

1. Перейдите на https://developers.sber.ru
2. Зарегистрируйтесь или войдите в аккаунт
3. Подтвердите email

### 2. Создание проекта

1. В личном кабинете перейдите в "Мои проекты"
2. Нажмите "Создать проект"
3. Заполните:
   - Название: LinguaFlow
   - Описание: Приложение для изучения иностранных слов
   - Тип: API
4. Подключите сервис "GigaChat"

### 3. Получение токена авторизации

1. В настройках проекта перейдите в раздел "Авторизация"
2. Создайте новый токен:
   - Тип: "Для физического лица" (GIGACHAT_API_PERS) или "Для юридического лица" (GIGACHAT_API_CORP)
   - Скопируйте токен
3. Сохраните токен в безопасном месте

### 4. Настройка в проекте

Создайте файл `backend/.env`:

```env
GIGACHAT_AUTH_TOKEN=ваш_токен_авторизации
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat
GIGACHAT_VERIFY_SSL=true
```

## Модели GigaChat

| Модель | Описание | Стоимость |
|--------|----------|-----------|
| GigaChat | Базовая модель | ~0.6 руб/1000 токенов |
| GigaChat Plus | Улучшенная модель | ~1.5 руб/1000 токенов |
| GigaChat Pro | Максимальное качество | ~3 руб/1000 токенов |

**Рекомендация**: Для MVP используйте базовую модель `GigaChat`.

## Использование в коде

### Генерация предложений

```python
from services.gigachat import gigachat_service

result = await gigachat_service.generate_sentence(
    target_words=["delicious", "meal"],
    learning_language="en",
    native_language="ru",
    cefr_level="B1",
    topic="food"
)

# result = {
#     "sentence": "I would like to order a delicious meal.",
#     "translation": "Я хотел бы заказать восхитительное блюдо.",
#     "target_words": ["delicious", "meal"]
# }
```

### Оценка перевода

```python
evaluation = await gigachat_service.evaluate_translation(
    original_sentence="I would like to order a delicious meal.",
    user_translation="Я хотел бы заказать вкусное блюдо.",
    target_words=["delicious", "meal"],
    learning_language="en",
    native_language="ru"
)

# evaluation = {
#     "evaluations": [
#         {"word": "delicious", "correct": True, "user_translation": "вкусное"},
#         {"word": "meal", "correct": True, "user_translation": "блюдо"}
#     ],
#     "overall_score": 95,
#     "feedback": "Отличный перевод!"
# }
```

## Оптимизация затрат

### 1. Кэширование предложений

Система автоматически кэширует сгенерированные предложения в БД.
Повторные запросы с теми же параметрами не требуют вызова API.

Ключ кэша: `(язык, уровень, тема, целевые слова)`

### 2. Группировка слов

Старайтесь группировать несколько целевых слов в одно предложение:
- 1 вызов LLM на предложение с 2-3 словами дешевле, чем 2-3 вызова на 1 слово

### 3. Оценка перевода

Каждый ответ пользователя — это 1 вызов LLM.
Для снижения затрат можно:
- Уменьшить `max_tokens` в запросе
- Использовать более простую модель для оценки
- Кэшировать частые ответы

### Примерный расчёт стоимости

Для 1000 активных пользователей:
- ~5000 генераций предложений/день (с кэшем ~500 новых)
- ~50000 оценок переводов/день (5 предложений × 10 слов × 100 пользователей)

**Стоимость:**
- Генерация: 500 × ~0.01 руб = ~5 руб/день
- Оценка: 50000 × ~0.005 руб = ~250 руб/день
- **Итого: ~255 руб/день ≈ ~7650 руб/месяц**

## Troubleshooting

### Ошибка SSL

Если получаете ошибку SSL сертификата:
```python
GIGACHAT_VERIFY_SSL=false  # Только для тестирования!
```

### Ошибка авторизации

Проверьте:
1. Токен не истёк
2. Scope соответствует типу аккаунта
3. IP-адрес сервера не заблокирован

### Таймауты

GigaChat может отвечать медленно. Увеличьте таймаут:
```python
# В services/gigachat.py
async with httpx.AsyncClient(verify=self.verify_ssl, timeout=120.0) as client:
```

## Ссылки

- [Документация GigaChat API](https://developers.sber.ru/docs/ru/gigachat/api/overview)
- [Примеры запросов](https://developers.sber.ru/docs/ru/gigachat/api/response-examples)
- [Лимиты и квоты](https://developers.sber.ru/docs/ru/gigachat/api/restrictions)
