"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RoleId } from "./types";

const ROLES: { id: RoleId; label: string }[] = [
  { id: "astronaut", label: "Astronaut / Crew" },
  { id: "medical", label: "Medical Officer" },
  { id: "ops", label: "Mission Health Ops" },
];

type RoleContextValue = {
  role: RoleId;
  setRole: (r: RoleId) => void;
  roles: typeof ROLES;
  roleLabel: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("ops");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bt_role") as RoleId | null;
      if (saved && ROLES.some((r) => r.id === saved)) setRoleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setRole = useCallback((r: RoleId) => {
    setRoleState(r);
    try {
      localStorage.setItem("bt_role", r);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      roles: ROLES,
      roleLabel: ROLES.find((r) => r.id === role)?.label ?? "Mission Health Ops",
    }),
    [role, setRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
