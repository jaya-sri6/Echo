import { AgentEvent, PipelineResult } from '../types';

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    // If running on Vite dev port 5173, Vite proxy handles /api and /health
    // If running on backend unified port 8000 or production domain, relative path works directly
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
