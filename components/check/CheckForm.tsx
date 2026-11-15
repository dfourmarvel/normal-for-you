"use client";

import { FOCUS } from "@/components/astronaut/StatusChip";
import {
  FIELDS, FIRST_DAY, GROUPS, LAST_DAY, phaseLabel, type Field, type FormErrors, type FormValues,
} from "@/lib/check/check";
import type { Indicator } from "@/lib/types";

export const fieldId = (i: Indicator): string => `f-${i}`;

interface Props {
  day: number;
  dayDraft: string;
  onDay: (draft: string) => void;
  onDayCommit: () => void;
  values: FormValues;
  errors: FormErrors;
  formError: string;
  onChange: (i: Indicator, raw: string) => void;
  onSample: () => void;
  onCheck: () => void;
}

const SECONDARY_BTN = `min-h-[44px] rounded-full border border-border bg-card px-4 text-sm font-semibold text-charcoal hover:border-primary ${FOCUS}`;

export function CheckForm({ day, dayDraft, onDay, onDayCommit, values, errors, formError, onChange, onSample, onCheck }: Props) {
  const draft = dayDraft.trim();
  const dayBad = draft !== "" && !(/^\d+$/.test(draft) && +draft >= FIRST_DAY && +draft <= LAST_DAY);
  return (
    <form
      noValidate
      aria-labelledby="form-title"
      onSubmit={(e) => {
        e.preventDefault();
        onCheck();
      }}
      className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(44,44,44,0.04)]"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="form-title" className="text-lg font-semibold">Today&apos;s readings</h2>
          <p className="text-sm text-secondary">Every field is optional.</p>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Mission day</legend>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              type="range" min={FIRST_DAY} max={LAST_DAY} value={day} aria-label="Mission day slider"
              onChange={(e) => onDay(e.target.value)}
              className={`min-h-[44px] min-w-0 flex-1 basis-48 accent-[var(--primary)] ${FOCUS}`}
            />
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              Day
              <input
                type="number" inputMode="numeric" min={FIRST_DAY} max={LAST_DAY} value={dayDraft}
                onChange={(e) => onDay(e.target.value)} onBlur={onDayCommit}
                aria-invalid={dayBad || undefined} aria-describedby={dayBad ? "day-err" : undefined}
                className={`min-h-[44px] w-20 rounded-lg border border-border bg-card px-2 text-[16px] ${FOCUS}`}
              />
            </label>
          </div>
          <p className="mt-1 text-sm">
            <span className="font-semibold">Day {day} of {LAST_DAY}</span>
            <span className="text-secondary"> · {phaseLabel(day)}</span>
          </p>
          {dayBad && (
            <p id="day-err" className="mt-1 text-sm font-medium text-chip-act">
              Mission day must be a whole number from {FIRST_DAY} to {LAST_DAY}.
            </p>
          )}
        </fieldset>

        {GROUPS.map((g) => (
          <fieldset key={g.id} className="mt-5 border-t border-border-soft pt-4">
            <legend className="float-left w-full text-sm font-semibold">{g.label}</legend>
            {g.hint && <p className="clear-left pt-0.5 text-sm text-secondary">{g.hint}</p>}
            <div className="clear-left grid grid-cols-1 items-start gap-x-4 gap-y-3 pt-2 sm:grid-cols-2">
              {FIELDS.filter((f) => f.group === g.id).map((f) => (
                <NumberField key={f.indicator} field={f} value={values[f.indicator] ?? ""} error={errors[f.indicator]} onChange={onChange} />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-0 z-10 rounded-b-2xl border-t border-border bg-card px-4 py-3 sm:px-5">
        {formError && <p role="alert" className="mb-2 text-sm font-medium text-chip-act">{formError}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className={`min-h-[44px] flex-1 rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover sm:flex-none ${FOCUS}`}>
            Check
          </button>
          <button type="button" onClick={onSample} className={`${SECONDARY_BTN} flex-1 sm:flex-none`}>
            Use sample values
          </button>
        </div>
      </div>
    </form>
  );
}

function NumberField({ field: f, value, error, onChange }: { field: Field; value: string; error?: string; onChange: Props["onChange"] }) {
  const id = fieldId(f.indicator);
  const described = [f.hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {f.label}
        <span className="sr-only"> ({f.suffix})</span>
      </label>
      <div
        className={`mt-1.5 flex min-h-[48px] items-center rounded-xl border bg-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${
          error ? "border-chip-act" : "border-border"
        }`}
      >
        <input
          id={id} type="text" inputMode={f.whole ? "numeric" : "decimal"} autoComplete="off" enterKeyHint="next"
          value={value} onChange={(e) => onChange(f.indicator, e.target.value)}
          aria-invalid={error ? true : undefined} aria-describedby={described}
          className="min-h-[46px] min-w-0 flex-1 self-stretch bg-transparent px-3 text-[16px] outline-none"
        />
        <span aria-hidden="true" className="shrink-0 pr-3 text-sm text-secondary">{f.suffix}</span>
      </div>
      {f.hint && <p id={`${id}-hint`} className="mt-1 text-xs text-secondary">{f.hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-sm font-medium text-chip-act">{error}</p>}
    </div>
  );
}
