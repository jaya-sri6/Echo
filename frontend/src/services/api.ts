import { AgentEvent, PipelineResult } from '../types';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'http://localhost:8000';
};

const getWsBase = (): string => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/case`;
  }
  return 'ws://localhost:8000/ws/case';
};

export async function checkHealth(): Promise<{ status: string }> {
  const base = getApiBase();
  const response = await fetch(`${base}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}

export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  const base = getApiBase();
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail?.message || 'Login failed.');
  }
  return response.json();
}

export async function authSignup(email: string, password: string, name: string): Promise<AuthResponse> {
  const base = getApiBase();
  const response = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail?.message || 'Signup failed.');
  }
  return response.json();
}

export async function authMe(token: string): Promise<UserProfile> {
  const base = getApiBase();
  const response = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Unauthorized');
  }
  return response.json();
}

export async function fetchExperiences(): Promise<any> {
  const base = getApiBase();
  const response = await fetch(`${base}/api/experiences`);
  if (!response.ok) throw new Error('Failed to fetch experiences');
  return response.json();
}

export async function fetchExperienceGraph(): Promise<any> {
  const base = getApiBase();
  const response = await fetch(`${base}/api/graph`);
  if (!response.ok) throw new Error('Failed to fetch experience graph');
  return response.json();
}

export async function fetchInvestigations(): Promise<any[]> {
  const base = getApiBase();
  const response = await fetch(`${base}/api/investigations`);
  if (!response.ok) return [];
  return response.json();
}

export async function sendChatMessage(message: string, case_key?: string, token?: string): Promise<any> {
  const base = getApiBase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, case_key }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Chat request failed');
  }
  return response.json();
}

export async function runInvestigation(message: string): Promise<PipelineResult> {
  const base = getApiBase();
  const response = await fetch(`${base}/api/case`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || `Investigation failed with status ${response.status}`);
  }

  return response.json();
}

export function subscribeToCaseInvestigation(
  message: string,
  onEvent: (event: AgentEvent) => void,
  onComplete?: () => void,
  onError?: (error: Event) => void
): WebSocket {
  const socket = new WebSocket(getWsBase());

  socket.onopen = () => {
    socket.send(JSON.stringify({ message }));
  };

  socket.onmessage = (event) => {
    try {
      const data: AgentEvent = JSON.parse(event.data);
      onEvent(data);
    } catch {
      // Non-JSON message or raw text
    }
  };

  socket.onerror = (err) => {
    if (onError) onError(err);
  };

  socket.onclose = () => {
    if (onComplete) onComplete();
  };

  return socket;
}
