#!/usr/bin/env python3
"""
Скрипт установки и проверки Silero TTS модели
"""
import sys
import torch
from pathlib import Path


def install_tts_model():
    """Загрузка и проверка Silero TTS модели"""
    print("=" * 60)
    print("LinguaFlow TTS Model Setup")
    print("=" * 60)
    print()

    # Проверяем torch
    print("1. Checking PyTorch installation...")
    try:
        print(f"   PyTorch version: {torch.__version__}")
        print(f"   CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"   CUDA device: {torch.cuda.get_device_name(0)}")
        print("   ✓ PyTorch OK")
    except ImportError:
        print("   ✗ PyTorch not installed!")
        print("   Run: pip install torch torchaudio")
        sys.exit(1)

    print()

    # Проверяем soundfile
    print("2. Checking soundfile...")
    try:
        import soundfile
        print("   ✓ soundfile OK")
    except ImportError:
        print("   ✗ soundfile not installed!")
        print("   Run: pip install soundfile")
        sys.exit(1)

    print()

    # Загружаем модель
    print("3. Loading Silero TTS model (this may take a while on first run)...")
    try:
        device = torch.device('cpu')
        torch.set_num_threads(4)

        model, _ = torch.hub.load(
            repo_or_dir='snakers4/silero-models',
            model='silero_tts',
            language='multi',
            speaker='multi_v2',
            trust_repo=True,
        )
        model.to(device)
        print("   ✓ Model loaded successfully!")
    except Exception as e:
        print(f"   ✗ Failed to load model: {e}")
        sys.exit(1)

    print()

    # Тестовая генерация
    print("4. Testing TTS synthesis...")
    try:
        audio = model.apply_tts(
            text="Hello, this is a test of the text to speech system.",
            speaker="en_0",
            sample_rate=48000,
        )
        print(f"   ✓ Generated audio: {len(audio)} samples")
    except Exception as e:
        print(f"   ✗ TTS test failed: {e}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("✓ TTS setup complete!")
    print("=" * 60)
    print()
    print("Supported languages:")
    print("  - English (en_0)")
    print("  - German (de_0)")
    print("  - French (fr_0)")
    print("  - Spanish (es_0)")
    print("  - Russian (ru_0)")
    print()
    print("Audio will be cached in: ./audio_cache/")
    print()


if __name__ == "__main__":
    install_tts_model()
