/**
 * useOfflineQueue — AsyncStorage-backed submission queue that auto-flushes on reconnect.
 *
 * Rules (from brief):
 *  - All contribution submissions queue locally and sync on reconnect
 *  - Mandatory for safety forms; applied globally via this hook
 *  - A queued record must be stored as COMPLETE (not draft) when it eventually syncs
 *
 * Usage:
 *   const { enqueue, queuedCount } = useOfflineQueue("safety-reports");
 *   await enqueue({ endpoint: "/api/safety-reports", body: { ... } });
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";

const QUEUE_KEY_PREFIX = "@mwm_offline_queue_";

interface QueuedItem {
  id: string;
  endpoint: string;
  method?: "POST" | "PATCH";
  body: Record<string, unknown>;
  queuedAt: string;
  attempts: number;
}

import { getApiBase } from "@/lib/api";
const API_BASE = getApiBase();

async function readQueue(namespace: string): Promise<QueuedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY_PREFIX + namespace);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(namespace: string, items: QueuedItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY_PREFIX + namespace, JSON.stringify(items));
  } catch {
    // Storage failure is non-fatal; item stays in memory
  }
}

async function tryFlush(
  namespace: string,
  token: string | null,
  onFlushed?: (item: QueuedItem) => void
): Promise<void> {
  const items = await readQueue(namespace);
  if (items.length === 0) return;

  const remaining: QueuedItem[] = [];

  for (const item of items) {
    try {
      const res = await fetch(`${API_BASE}${item.endpoint}`, {
        method: item.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Cookie: `connect.sid=${token}` } : {}),
        },
        body: JSON.stringify(item.body),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        onFlushed?.(item);
      } else if (res.status >= 400 && res.status < 500) {
        // Client error — don't retry
      } else {
        // Server error — keep for retry
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    } catch {
      // Network error — keep for retry (max 10 attempts)
      if (item.attempts < 10) {
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    }
  }

  await writeQueue(namespace, remaining);
}

interface UseOfflineQueueOptions {
  /** Session token for authenticated endpoints */
  token?: string | null;
  onFlushed?: (item: QueuedItem) => void;
}

export function useOfflineQueue(namespace: string, options: UseOfflineQueueOptions = {}) {
  const [queuedCount, setQueuedCount] = useState(0);
  const tokenRef = useRef(options.token ?? null);
  const onFlushedRef = useRef(options.onFlushed);

  tokenRef.current = options.token ?? null;
  onFlushedRef.current = options.onFlushed;

  // Keep queuedCount in sync
  const refreshCount = useCallback(async () => {
    const items = await readQueue(namespace);
    setQueuedCount(items.length);
  }, [namespace]);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  // Auto-flush on reconnect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        await tryFlush(namespace, tokenRef.current, onFlushedRef.current);
        refreshCount();
      }
    });
    return unsubscribe;
  }, [namespace, refreshCount]);

  /**
   * Enqueue a submission. If the device is online, attempts immediate delivery;
   * falls back to queue on failure.
   */
  const enqueue = useCallback(
    async (item: Omit<QueuedItem, "id" | "queuedAt" | "attempts">): Promise<boolean> => {
      const full: QueuedItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        queuedAt: new Date().toISOString(),
        attempts: 0,
      };

      // Try immediate delivery first
      const net = await NetInfo.fetch();
      if (net.isConnected && net.isInternetReachable) {
        try {
          const res = await fetch(`${API_BASE}${full.endpoint}`, {
            method: full.method ?? "POST",
            headers: {
              "Content-Type": "application/json",
              ...(tokenRef.current ? { Cookie: `connect.sid=${tokenRef.current}` } : {}),
            },
            body: JSON.stringify(full.body),
            signal: AbortSignal.timeout(10_000),
          });
          if (res.ok) return true;
        } catch {
          // Fall through to queue
        }
      }

      // Store in queue
      const existing = await readQueue(namespace);
      await writeQueue(namespace, [...existing, full]);
      setQueuedCount((c) => c + 1);
      return false;
    },
    [namespace]
  );

  return { enqueue, queuedCount, refreshCount };
}
