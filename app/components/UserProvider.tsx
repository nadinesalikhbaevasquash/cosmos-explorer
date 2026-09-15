"use client";

/**
 * Who is signed in, available anywhere on the client.
 *
 * One fetch of /api/auth/me on mount, shared through context, so the nav, the
 * learning path and the quiz are never disagreeing about whether someone is signed
 * in. `loading` is exposed deliberately: the header must not flash "Sign in" for a
 * moment before resolving to "Hi, Nadine".
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  /** Null or absent until the address is confirmed. */
  emailVerifiedAt?: string | null;
  pathDone: string[];
  quiz: {
    streak: number;
    lastDate: string | null;
    lastScore: number;
    lastSquares: string;
  } | null;
};

type Ctx = {
  user: SessionUser | null;
  loading: boolean;
  setUser: (u: SessionUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<Ctx>({
  user: null,
  loading: true,
  setUser: () => {},
  refresh: async () => {},
  logout: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const d = await r.json();
      setUser(d.user ?? null);
    } catch {
      // Offline or the endpoint is down. Signed out is the safe assumption, and
      // the whole site works signed out anyway.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, refresh, logout }),
    [user, loading, refresh, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
