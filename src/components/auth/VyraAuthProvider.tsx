"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { appStore } from "@/lib/store";
import { athleteModelStore } from "@/lib/ai/athlete-model";
import { visualProgressStore } from "@/lib/ai/visual-progress";
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

  const applyBootstrap = async (): Promise<boolean> => {
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
        const prevUid = appStore.getCurrentUser().id;
        appStore.hydrateFromBootstrap(boot);
        if (boot.athleteModel) {
          athleteModelStore.setAthleteModelFromBootstrap(boot.athleteModel);
        }
        if (prevUid !== boot.user.id) {
          visualProgressStore.clearForRealUser();
        }
        await anchorIdentityWithFirebase({
          uid: boot.user.id,
          email: boot.user.email,
          displayName: boot.user.name,
        });
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
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      setIsBootstrapping(true);
      await applyBootstrap();
      if (active) setIsBootstrapping(false);
    };
    init();

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
      unsub();
    };
  }, []);

  const signOutAll = async () => {
    await signOutFirebaseAndServer();
    clearAnchoredIdentity();
    visualProgressStore.clearForRealUser();
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
