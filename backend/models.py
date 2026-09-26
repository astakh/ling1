"""
SQLAlchemy модели данных
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey,
    ARRAY, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    native_language = Column(String(10), nullable=True)
    learning_language = Column(String(10), nullable=True)
    cefr_level = Column(String(2), nullable=True)
    intensity_new_words = Column(Integer, default=5)
    intensity_reviews = Column(Integer, default=20)
    subscription_status = Column(String(20), default="trial")  # trial, active, expired
    trial_expires_at = Column(DateTime, nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)
    streak = Column(Integer, default=0)
    last_lesson_date = Column(DateTime, nullable=True)
    total_words_learned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    word_progress = relationship("UserWordProgress", back_populates="user", cascade="all, delete-orphan")
    lesson_sessions = relationship("LessonSession", back_populates="user", cascade="all, delete-orphan")


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    native_name = Column(String(100), nullable=False)


class WordList(Base):
    __tablename__ = "word_lists"

    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    cefr_level = Column(String(2), nullable=False)
    topic = Column(String(100), nullable=False)
    name = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    words = relationship("Word", back_populates="word_list")
    language = relationship("Language")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    word_list_id = Column(Integer, ForeignKey("word_lists.id"), nullable=True)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    text = Column(String(200), nullable=False)
    translation_hint = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    word_list = relationship("WordList", back_populates="words")
    language = relationship("Language")

    __table_args__ = (
        UniqueConstraint('word_list_id', 'text', name='uq_word_list_text'),
    )


class UserWordProgress(Base):
    """Карточка слова в FSRS для конкретного пользователя"""
    __tablename__ = "user_word_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=True)  # null для пользовательских слов
    custom_text = Column(String(200), nullable=True)  # для пользовательских слов
    custom_translation = Column(String(500), nullable=True)
    is_custom = Column(Boolean, default=False)

    # FSRS parameters
    fsrs_state = Column(Integer, default=0)  # 0=new, 1=learning, 2=review, 3=relearning
    fsrs_stability = Column(Float, default=0.0)
    fsrs_difficulty = Column(Float, default=0.0)
    fsrs_elapsed_days = Column(Float, default=0.0)
    fsrs_scheduled_days = Column(Float, default=0.0)

    last_review_at = Column(DateTime, nullable=True)
    next_review_at = Column(DateTime, nullable=True)
    review_count = Column(Integer, default=0)
    lapses = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="word_progress")
    word = relationship("Word")

    __table_args__ = (
        Index('idx_user_next_review', 'user_id', 'next_review_at'),
        UniqueConstraint('user_id', 'word_id', name='uq_user_word'),
    )


class Sentence(Base):
    """Кэш сгенерированных предложений"""
    __tablename__ = "sentences"

    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=False)
    cefr_level = Column(String(2), nullable=False)
    topic = Column(String(100), nullable=False)
    text = Column(Text, nullable=False)
    translation = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    target_word_ids = Column(ARRAY(Integer), nullable=True)
    source = Column(String(50), default="cached_generated")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    language = relationship("Language")

    __table_args__ = (
        Index('idx_sentence_lookup', 'language_id', 'cefr_level', 'topic'),
    )


class LessonSession(Base):
    __tablename__ = "lesson_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(100), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    plan_snapshot = Column(JSON, nullable=True)
    total_cards = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    incorrect_answers = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="lesson_sessions")
    answers = relationship("LessonAnswer", back_populates="session", cascade="all, delete-orphan")


class LessonAnswer(Base):
    __tablename__ = "lesson_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("lesson_sessions.id"), nullable=False)
    sentence_id = Column(Integer, ForeignKey("sentences.id"), nullable=False)
    user_translation_text = Column(Text, nullable=False)
    llm_word_evaluation = Column(JSON, nullable=True)  # {word: {correct: bool, translation: str}}
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("LessonSession", back_populates="answers")
    sentence = relationship("Sentence")
