"""
Главный файл FastAPI приложения LinguaFlow
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db, init_db
from models import User
from routers import auth, lesson, words
from services.tts import tts_service

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting LinguaFlow backend...")

    # Инициализация БД
    await init_db()
    logger.info("Database initialized")

    # Инициализация TTS модели
    try:
        tts_service.initialize()
        logger.info("TTS model loaded")
    except Exception as e:
        logger.warning(f"Failed to load TTS model: {e}")
        logger.warning("TTS will be unavailable")

    yield

    # Shutdown
    logger.info("Shutting down LinguaFlow backend...")


# Создание приложения
app = FastAPI(
    title="LinguaFlow API",
    description="API для изучения иностранных слов методом интервального повторения",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы для аудио
audio_dir = Path(settings.TTS_AUDIO_DIR)
audio_dir.mkdir(parents=True, exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Безопасность
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Получить текущего пользователя из JWT токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    return user


# Подключаем роутеры
# Для роутеров, требующих авторизации, переопределяем зависимость
app.include_router(auth.router)
app.include_router(lesson.router, dependencies=[Depends(get_current_user)])
app.include_router(words.router, dependencies=[Depends(get_current_user)])


@app.get("/")
async def root():
    return {
        "message": "LinguaFlow API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Переопределяем зависимость для роутеров
from routers.lesson import get_current_user_from_token as lesson_get_user
from routers.words import get_current_user_from_token as words_get_user

# Инжектируем реальную функцию получения пользователя
import routers.lesson
import routers.words
routers.lesson.get_current_user_from_token = get_current_user
routers.words.get_current_user_from_token = get_current_user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
