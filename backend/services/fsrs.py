"""
Реализация алгоритма FSRS (Free Spaced Repetition Scheduler)
https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
"""
import math
from datetime import datetime, timedelta
from typing import Optional
from config import settings


class FSRSState:
    """Состояние карточки по FSRS"""
    NEW = 0
    LEARNING = 1
    REVIEW = 2
    RELEARNING = 3


class FSRSGrade:
    """Оценка ответа пользователя"""
    AGAIN = 1   # Полный провал
    HARD = 2    # Правильно, но с трудом
    GOOD = 3    # Правильно с нормальной сложностью
    EASY = 4    # Очень легко


class FSRSScheduler:
    """
    Планировщик интервальных повторений FSRS-4.5
    
    Параметры:
    - stability: мера того, насколько долго память хранит информацию
    - difficulty: мера сложности материала для конкретного пользователя
    """

    def __init__(self):
        self.w = settings.FSRS_W
        self.request_retention = settings.FSRS_REQUEST_RETENTION
        self.maximum_interval = settings.FSRS_MAXIMUM_INTERVAL

    def _clamp(self, value: float, min_val: float, max_val: float) -> float:
        return min(max(value, min_val), max_val)

    def _power_forgetting_curve(self, t: float, s: float) -> float:
        """
        Кривая забывания: R(t, s) = (1 + t/(9*s))^(-1)
        t - время в днях, s - стабильность
        """
        return math.pow(1 + t / (9 * s), -1)

    def _initial_stability(self, grade: int) -> float:
        """Начальная стабильность в зависимости от оценки"""
        return self._clamp(self.w[grade - 1], 0.1, 100)

    def _initial_difficulty(self, grade: int) -> float:
        """Начальная сложность"""
        return self._clamp(
            self.w[4] - math.exp(self.w[5] * (grade - 1)) + 1,
            1, 10
        )

    def _next_difficulty(self, d: float, grade: int) -> float:
        """Обновление сложности после повторения"""
        # Mean reversion: сложность стремится к среднему
        delta_d = -self.w[6] * (grade - 3)
        new_d = d + delta_d
        # Mean reversion to initial difficulty
        new_d = self.w[7] * self._initial_difficulty(3) + (1 - self.w[7]) * new_d
        return self._clamp(new_d, 1, 10)

    def _next_stability(self, d: float, s: float, r: float, grade: int) -> float:
        """
        Обновление стабильности после повторения
        d - difficulty, s - current stability, r - retrievability, grade - оценка
        """
        if grade == FSRSGrade.AGAIN:
            # После провала стабильность сбрасывается
            new_s = self.w[11] * math.pow(d, -self.w[12]) * (
                math.pow(s + 1, self.w[13]) - 1
            ) * math.exp((1 - r) * self.w[14])
            new_s = self._clamp(new_s, 0.1, s)
        else:
            # Успешное повторение увеличивает стабильность
            hard_penalty = self.w[15] if grade == FSRSGrade.HARD else 1.0
            easy_bonus = self.w[16] if grade == FSRSGrade.EASY else 1.0
            new_s = s * (
                1 + math.exp(self.w[8]) *
                (11 - d) *
                math.pow(s, -self.w[9]) *
                (math.exp((1 - r) * self.w[10]) - 1) *
                hard_penalty * easy_bonus
            )
            new_s = self._clamp(new_s, 0.1, self.maximum_interval)

        return new_s

    def _next_interval(self, s: float) -> int:
        """Вычисление интервала до следующего повторения"""
        interval = (s / 9) * (math.pow(self.request_retention, -1) - 1)
        return max(1, min(int(round(interval)), self.maximum_interval))

    def calculate_next_review(
        self,
        current_state: int,
        stability: float,
        difficulty: float,
        last_review: Optional[datetime],
        grade: int
    ) -> dict:
        """
        Рассчитать следующее состояние карточки
        
        Returns:
            dict с полями: state, stability, difficulty, interval_days, next_review
        """
        now = datetime.utcnow()

        # Вычисляем retrievability (текущая запоминаемость)
        if last_review and stability > 0:
            elapsed_days = (now - last_review).total_seconds() / 86400
            r = self._power_forgetting_curve(elapsed_days, stability)
        else:
            r = 0.0
            elapsed_days = 0

        # Новый случай или повторение
        if current_state == FSRSState.NEW:
            # Первое предъявление
            new_s = self._initial_stability(grade)
            new_d = self._initial_difficulty(grade)

            if grade == FSRSGrade.AGAIN:
                new_state = FSRSState.LEARNING
            else:
                new_state = FSRSState.REVIEW
        else:
            # Повторение
            new_d = self._next_difficulty(difficulty, grade)
            new_s = self._next_stability(difficulty, stability, r, grade)

            if grade == FSRSGrade.AGAIN:
                new_state = FSRSState.RELEARNING
            else:
                new_state = FSRSState.REVIEW

        # Интервал
        interval_days = self._next_interval(new_s)

        # Дата следующего показа
        next_review = now + timedelta(days=interval_days)

        return {
            "state": new_state,
            "stability": round(new_s, 4),
            "difficulty": round(new_d, 4),
            "elapsed_days": round(elapsed_days, 2),
            "scheduled_days": interval_days,
            "interval_days": interval_days,
            "next_review": next_review,
            "retrievability": round(r, 4),
        }

    def get_due_words(self, words_progress: list, limit: int = 20) -> list:
        """
        Отфильтровать слова, которые нужно повторить сегодня
        """
        now = datetime.utcnow()
        due_words = [
            w for w in words_progress
            if w.next_review_at and w.next_review_at <= now
        ]
        # Сортируем по приоритету: сначала те, что давно просрочены
        due_words.sort(key=lambda w: w.next_review_at)
        return due_words[:limit]


# Singleton
fsrs_scheduler = FSRSScheduler()
