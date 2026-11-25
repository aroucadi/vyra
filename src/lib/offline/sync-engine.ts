/**
 * @file sync-engine.ts
 * @description Underground Gym Basement Offline Synchronization Engine.
 * Guarantees zero-data-loss set logging in basement gyms without cellular signal
 * and transparently flushes unsynced flight events to Cloud Run upon reconnection.
 */

import { getStorageAdapter } from "@/lib/storage/adapter";
import type { EventEnvelope } from "@/lib/storage/events";

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  syncedIds: string[];
  error?: string;
}

class OfflineSyncEngine {
  private isSyncing: boolean = false;
  private listeners: Set<(status: { isOnline: boolean; unsyncedCount: number }) => void> = new Set();

  public subscribe(cb: (status: { isOnline: boolean; unsyncedCount: number }) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(isOnline: boolean, unsyncedCount: number) {
    this.listeners.forEach((cb) => {
      try {
        cb({ isOnline, unsyncedCount });
      } catch {
        // Safe notification
      }
    });
  }

  /**
   * Flushes all local unsynced events in IndexedDB to Cloud Run.
   */
  public async flushUnsyncedEvents(traineeId: string): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, syncedIds: [], error: "Sync already in progress" };
    }

    const adapter = getStorageAdapter();
    const unsynced: EventEnvelope[] = await adapter.getUnsyncedEvents(traineeId);

    if (!unsynced || unsynced.length === 0) {
      this.notify(typeof navigator !== "undefined" ? navigator.onLine : true, 0);
      return { success: true, syncedCount: 0, syncedIds: [] };
    }

    this.isSyncing = true;
    try {
      const response = await fetch("/api/sync/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: unsynced }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with HTTP ${response.status}`);
      }

      const result = await response.json();
      const syncedIds: string[] = result.syncedIds || unsynced.map((e) => e.id);

      // Mark locally synced in IndexedDB
      await adapter.markEventsSynced(syncedIds);

      this.notify(typeof navigator !== "undefined" ? navigator.onLine : true, 0);

      return {
        success: true,
        syncedCount: syncedIds.length,
        syncedIds,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      this.notify(typeof navigator !== "undefined" ? navigator.onLine : false, unsynced.length);
      return {
        success: false,
        syncedCount: 0,
        syncedIds: [],
        error: message,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Initializes automatic online reconnect listeners and service worker sync message handling.
   */
  public initializeAutoSync(traineeId: string): () => void {
    if (typeof window === "undefined") return () => {};

    const handleOnline = () => {
      void this.flushUnsyncedEvents(traineeId);
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_OFFLINE_SETS") {
        void this.flushUnsyncedEvents(traineeId);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleOnline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    // Initial check on mount
    void this.flushUnsyncedEvents(traineeId);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleOnline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
