"""
Pydantic схемы для API
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# Auth
class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    native_language: Optional[str] = None
    learning_language: Optional[str] = None
    cefr_level: Optional[str] = None
    intensity_new_words: int = 5
    intensity_reviews: int = 20
    subscription_status: str = "trial"
    trial_expires_at: Optional[datetime] = None
    streak: int = 0
    last_lesson_date: Optional[datetime] = None
    total_words_learned: int = 0

    class Config:
        from_attributes = True


# Onboarding
class OnboardingData(BaseModel):
    native_language: str
    learning_language: str
    cefr_level: str
    intensity_new_words: int = 5
    intensity_reviews: int = 20


# Topics
class TopicResponse(BaseModel):
    id: str
    name: str
    icon: str
    description: str


# Lesson
class LessonStartRequest(BaseModel):
    topic: str

class LessonCardResponse(BaseModel):
    id: int
    sentence: str
    translation: str
    target_words: list[str]
    audio_url: str

class LessonStartResponse(BaseModel):
    session_id: int
    topic: str
    cards: list[LessonCardResponse]
    total_cards: int

class LessonAnswerRequest(BaseModel):
    session_id: int
    card_index: int
    user_translation: str

class WordEvaluation(BaseModel):
    word: str
    correct: bool
    user_translation: Optional[str] = None
    correct_translation: Optional[str] = None

class LessonAnswerResponse(BaseModel):
    evaluations: list[WordEvaluation]
    overall_score: int
    feedback: str
    correct_translation: str

class LessonFinishResponse(BaseModel):
    session_id: int
    total_cards: int
    correct_answers: int
    incorrect_answers: int
    accuracy: float
    new_streak: int


# Words
class CustomWordRequest(BaseModel):
    text: str
    translation: str

class WordProgressResponse(BaseModel):
    id: int
    text: str
    translation: str
    is_custom: bool
    fsrs_state: int
    fsrs_stability: float
    fsrs_difficulty: float
    last_review_at: Optional[datetime] = None
    next_review_at: Optional[datetime] = None
    review_count: int
    lapses: int

    class Config:
        from_attributes = True


# Settings
class SettingsUpdate(BaseModel):
    native_language: Optional[str] = None
    learning_language: Optional[str] = None
    cefr_level: Optional[str] = None
    intensity_new_words: Optional[int] = None
    intensity_reviews: Optional[int] = None


# Stats
class StatsResponse(BaseModel):
    total_words: int
    words_due_today: int
    mastered_words: int
    learning_words: int
    new_words: int
    custom_words: int
    streak: int
    weekly_activity: list[dict]
    word_progress: list[WordProgressResponse]
