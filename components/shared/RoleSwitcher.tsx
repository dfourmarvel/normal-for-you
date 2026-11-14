"use client";

import { useRole } from "@/lib/role-context";
import type { RoleId } from "@/lib/types";

export function RoleSwitcher() {
  const { role, setRole, roles } = useRole();
  return (
    <div className="flex items-center gap-2 bg-white rounded-full pl-3 pr-1.5 py-1 shadow-card border border-border/60" title="Role view (no auth)">
      <select
        aria-label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value as RoleId)}
        className="bg-transparent text-[12px] font-medium text-charcoal outline-none max-w-[150px] cursor-pointer"
      >
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      <span className="w-8 h-8 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center" aria-hidden>
        BT
      </span>
    </div>
  );
}
