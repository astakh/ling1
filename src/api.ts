/**
 * API клиент для LinguaFlow Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Загружаем токен из localStorage
    this.token = localStorage.getItem('linguaflow_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('linguaflow_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('linguaflow_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  // Lesson
  async startLesson(topic: string) {
    return this.request('/lesson/start', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    });
  }

  async submitAnswer(sessionId: number, cardIndex: number, userTranslation: string) {
    return this.request('/lesson/answer', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        card_index: cardIndex,
        user_translation: userTranslation,
      }),
    });
  }

  async finishLesson(sessionId: number) {
    return this.request('/lesson/finish', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  // Words
  async addCustomWord(text: string, translation: string) {
    return this.request('/words/custom', {
      method: 'POST',
      body: JSON.stringify({ text, translation }),
    });
  }

  async getWordProgress() {
    return this.request('/words/progress');
  }

  async getStats() {
    return this.request('/words/stats');
  }

  // Settings
  async updateSettings(settings: any) {
    return this.request('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient();
