"use client";

import type { DocumentLink } from "@/lib/types";

export function DocLink({ doc }: { doc: DocumentLink }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="flex items-center gap-2.5 py-2.5 px-2 rounded-[10px] hover:bg-card-muted text-sm text-charcoal"
    >
      <span className="shrink-0 w-9 h-7 rounded-md bg-primary-soft text-primary text-[10px] font-bold flex items-center justify-center">
        {doc.type === "JSON" ? "{ }" : doc.type}
      </span>
      <span className="flex-1 truncate">{doc.title}</span>
      <span className="text-muted text-xs shrink-0">{doc.size}</span>
    </a>
  );
}
