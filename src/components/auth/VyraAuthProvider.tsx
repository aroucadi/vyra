"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { appStore } from "@/lib/store";
import { athleteModelStore } from "@/lib/ai/athlete-model";
import { visualProgressStore } from "@/lib/ai/visual-progress";
import { sensoryMemoryStore } from "@/lib/ai/sensory-memory";
import { gymVisionInventoryStore } from "@/lib/ai/gym-vision-inventory";
import { clearClientStorage } from "@/lib/storage";
import { offlineSyncEngine } from "@/lib/offline/sync-engine";
import { anchorIdentityWithFirebase, clearAnchoredIdentity } from "@/lib/auth/identity";
import {
  exchangeFirebaseIdTokenForSession,
  signOutFirebaseAndServer,
  subscribeFirebaseAuthState,
} from "@/lib/firebase/client";
import type { UserBootstrapPayload } from "@/lib/firebase/firestore-repository";

export interface VyraAuthContextValue {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  isAlaa: boolean;
  authEmail: string | null;
  authError: string | null;
  refreshBootstrap: () => Promise<boolean>;
  signOutAll: () => Promise<void>;
}

const VyraAuthContext = createContext<VyraAuthContextValue>({
  isBootstrapping: true,
  isAuthenticated: false,
  isAlaa: false,
  authEmail: null,
  authError: null,
  refreshBootstrap: async () => false,
  signOutAll: async () => {},
});

export function useVyraAuth(): VyraAuthContextValue {
  return useContext(VyraAuthContext);
}

const noopSubscribe = () => () => {};

/**
 * Returns `false` on SSR and during React's initial client hydration pass, then
 * flips cleanly to `true` immediately after hydration commits (0 `#418` mismatches).
 */
export function useIsClientHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * Subscribes a Client Component cleanly to `appStore` mutations (bootstrap hydration,
 * workout saves, bodyweight metrics, supplements, hydration, sign-out).
 */
export function useVyraStoreVersion(): number {
  return useSyncExternalStore(
    appStore.subscribe,
    appStore.getVersion,
    appStore.getVersion
  );
}

export function VyraAuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAlaa, setIsAlaa] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const inFlightBootstrapRef = useRef<Promise<boolean> | null>(null);

  const runBootstrapFetch = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/me/bootstrap", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        ok?: boolean;
        authenticated?: boolean;
        isAlaa?: boolean;
        bootstrap?: UserBootstrapPayload | null;
      };

      if (data.authenticated && data.bootstrap) {
        const boot = data.bootstrap;
        await anchorIdentityWithFirebase({
          uid: boot.user.id,
          email: boot.user.email,
          displayName: boot.user.name,
        });
        appStore.hydrateFromBootstrap(boot);
        if (boot.athleteModel) {
          athleteModelStore.setAthleteModelFromBootstrap(boot.athleteModel);
        }
        visualProgressStore.claimAnonymousSnapshots(boot.user.id);
        sensoryMemoryStore.ingestFromSessionHistory(appStore.getSessions(boot.user.id));
        if (boot.sensoryMemories && boot.sensoryMemories.length > 0) {
          sensoryMemoryStore.hydrateFromCloudEntries(boot.sensoryMemories);
        }
        if (boot.gymInventories && boot.gymInventories.length > 0) {
          gymVisionInventoryStore.hydrateFromCloudInventories(boot.gymInventories);
        }
        setIsAuthenticated(true);
        setIsAlaa(Boolean(data.isAlaa));
        setAuthEmail(boot.user.email || null);
        setAuthError(null);
        return true;
      }

      setIsAuthenticated(false);
      setIsAlaa(false);
      setAuthEmail(null);
      return false;
    } catch (err) {
      console.warn("[VyraAuthProvider] Bootstrap error:", err);
      return false;
    }
  }, []);

  const applyBootstrap = useCallback(async (): Promise<boolean> => {
    if (inFlightBootstrapRef.current) {
      return inFlightBootstrapRef.current;
    }
    const p = runBootstrapFetch().finally(() => {
      inFlightBootstrapRef.current = null;
    });
    inFlightBootstrapRef.current = p;
    return p;
  }, [runBootstrapFetch]);

  useEffect(() => {
    let active = true;

    let stopSync: (() => void) | undefined;

    const init = async () => {
      appStore.hydrateFromClientStorage(true);
      await appStore.hydrateFromIndexedDbAsync();
      await applyBootstrap();
      if (active) {
        setIsBootstrapping(false);
        const traineeId = appStore.getCurrentUser()?.id || "trainee_alaa";
        stopSync = offlineSyncEngine.initializeAutoSync(traineeId);
      }
    };

    const hydrateTimer = setTimeout(() => {
      if (!active) return;
      void init();
    }, 0);

    const unsub = subscribeFirebaseAuthState(async (fbUser) => {
      if (!active) return;
      if (fbUser) {
        try {
          const exchanged = await exchangeFirebaseIdTokenForSession(fbUser);
          if (exchanged.ok) {
            await applyBootstrap();
          } else if (exchanged.error) {
            setAuthError(exchanged.error);
          }
        } catch {
          // Non-fatal
        }
      }
    });

    return () => {
      active = false;
      clearTimeout(hydrateTimer);
      unsub();
      if (stopSync) stopSync();
    };
  }, [applyBootstrap]);

  const signOutAll = async () => {
    await signOutFirebaseAndServer();
    clearAnchoredIdentity();
    clearClientStorage();
    visualProgressStore.clearInMemoryCache();
    sensoryMemoryStore.clearForTesting();
    athleteModelStore.clearSessionCache();
    appStore.signOutToEmpty();
    setIsAuthenticated(false);
    setIsAlaa(false);
    setAuthEmail(null);
    setAuthError(null);
  };

  return (
    <VyraAuthContext.Provider
      value={{
        isBootstrapping,
        isAuthenticated,
        isAlaa,
        authEmail,
        authError,
        refreshBootstrap: applyBootstrap,
        signOutAll,
      }}
    >
      {children}
    </VyraAuthContext.Provider>
  );
}
