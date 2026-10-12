// types.ts or inside your provider file
export interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  emit: (type: string, payload?: Record<string, unknown>) => void;
  emitRaw: (payload: unknown) => void;
  send: (type: string, payload?: Record<string, unknown>) => void;
  sendRaw: (payload: unknown) => void;
  on: <T = unknown>(
    type: string,
    handler: (message: T, raw: string) => void
  ) => () => void;
  listen: <T = unknown>(
    type: string,
    handler: (message: T, raw: string) => void
  ) => () => void;
  once: <T = unknown>(type: string, timeoutMs?: number) => Promise<T>; // Ensure this line is included
  onAny: (handler: (message: unknown, raw: string) => void) => () => void;
}

export interface WebSocketProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
}
