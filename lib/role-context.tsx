"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { storedSetting, useStoredSetting } from "./stored-setting";
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
const roleSetting = storedSetting<RoleId>("bt_role", "ops", (v): v is RoleId => ROLES.some((r) => r.id === v));

export function RoleProvider({ children }: { children: ReactNode }) {
  const role = useStoredSetting(roleSetting);
  const setRole = roleSetting.set;

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
