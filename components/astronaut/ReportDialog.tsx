"use client";

import { useState, type MouseEvent, type Ref } from "react";
import { FOCUS } from "./StatusChip";

export interface Report { title: string; text: string }

export function ReportDialog({ ref, report }: { ref: Ref<HTMLDialogElement>; report: Report | null }) {
  const [copied, setCopied] = useState("");
  const copy = () => {
    if (!report) return;
    // The clipboard API is missing on plain http and in some browsers, so fall back to a hint.
    const fail = () => setCopied("Could not copy. Select the text and copy it by hand.");
    if (!navigator.clipboard) return fail();
    navigator.clipboard.writeText(report.text).then(() => setCopied("Copied."), fail);
  };
  const close = (e: MouseEvent<HTMLButtonElement>) => e.currentTarget.closest("dialog")?.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby="report-title"
      onClose={() => setCopied("")}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-border bg-card p-0 text-charcoal backdrop:bg-black/40"
    >
      <div className="p-4 sm:p-5">
        <h2 id="report-title" className="text-lg font-semibold">Report to flight surgeon</h2>
        {report && <p className="text-sm text-secondary">{report.title}. Draft only: nothing is sent from this page.</p>}
        <pre className="mt-3 max-h-[55vh] overflow-auto rounded-xl border border-border-soft bg-card-muted p-3 font-sans text-xs whitespace-pre-wrap [overflow-wrap:anywhere]">
          {report?.text}
        </pre>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={copy} className={`min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover ${FOCUS}`}>
            Copy report
          </button>
          <button type="button" onClick={close} className={`min-h-11 rounded-full border border-border bg-card px-4 text-sm font-medium ${FOCUS}`}>
            Close
          </button>
          <span role="status" className="text-sm text-secondary">{copied}</span>
        </div>
      </div>
    </dialog>
  );
}
