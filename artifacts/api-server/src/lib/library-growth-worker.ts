/*
 * Library Growth Worker — hourly aggregation scheduler
 *
 * Registers a setInterval that calls aggregateLibraryGrowthCandidates()
 * every hour. Idempotent: calling start() twice does not create a second interval.
 * Follows the same pattern as healthMonitor.ts and cityRequestTracker.ts.
 *
 * The worker ONLY aggregates signals into pending_review candidates.
 * It does NOT create public Library nodes, does NOT send notifications,
 * and does NOT touch any community/business/map data.
 */

import { aggregateLibraryGrowthCandidates, getLibraryGrowthWorkerHealth } from "./library-growth-engine";

type Logger = (msg: string, data?: Record<string, unknown>) => void;

let _workerHandle: ReturnType<typeof setInterval> | null = null;
let _logger: Logger = (msg, data) => console.log("[library-growth-worker]", msg, data ?? "");

export function setGrowthWorkerLogger(fn: Logger): void {
  _logger = fn;
}

export function startLibraryGrowthWorker(intervalMs = 60 * 60 * 1000 /* 1 hour */): void {
  if (_workerHandle) return; // idempotent

  if (process.env.LIBRARY_GROWTH_ENABLED === "false") {
    _logger("Library Growth Engine is disabled via LIBRARY_GROWTH_ENABLED=false — worker not started");
    return;
  }

  async function runCycle(): Promise<void> {
    try {
      const count = await aggregateLibraryGrowthCandidates();
      _logger("Library growth aggregation complete", { candidatesUpserted: count });
    } catch (err: unknown) {
      // Log the sanitized error but do not crash the worker.
      // Per policy: do not retry by reprocessing raw queries.
      _logger("Library growth aggregation error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Run once immediately, then on the interval
  void runCycle();
  _workerHandle = setInterval(() => void runCycle(), intervalMs);
  _workerHandle.unref?.();

  _logger("Library growth worker started", { intervalMs });
}

export function stopLibraryGrowthWorker(): void {
  if (_workerHandle) {
    clearInterval(_workerHandle);
    _workerHandle = null;
    _logger("Library growth worker stopped");
  }
}

export function getLibraryGrowthWorkerStatus(): {
  running: boolean;
  health: ReturnType<typeof getLibraryGrowthWorkerHealth>;
} {
  return {
    running: _workerHandle !== null,
    health: getLibraryGrowthWorkerHealth(),
  };
}
