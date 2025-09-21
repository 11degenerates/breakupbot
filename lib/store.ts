// lib/store.ts
export type MessageRow = {
  code: string;                // e.g., "3742"
  breakerName?: string | null;
  recipientName: string;
  durationText?: string | null;
  tone: string;
  messageText: string;
  createdAt: number;           // Date.now()
};

export interface Store {
  put(msg: MessageRow): Promise<void>;
  get(code: string): Promise<MessageRow | null>;
}

// In-memory store (for local dev and quick tests)
const mem: Map<string, MessageRow> =
  (globalThis as any).__BB_MEM__ || new Map<string, MessageRow>();
(globalThis as any).__BB_MEM__ = mem;

export const InMemoryStore: Store = {
  async put(msg) { mem.set(msg.code, msg); },
  async get(code) { return mem.get(code) ?? null; },
};

// Choose the active store here.
// Later you can swap this to a KV/Redis adapter without changing any API/UI code.
export const store: Store = InMemoryStore;
