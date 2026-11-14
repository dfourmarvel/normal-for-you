"use client";

import { useEffect, useRef, useState } from "react";

const FRONT = "15deg 78deg 2.35m";
const BACK = "195deg 78deg 2.35m";
const TARGET = "0m 0.95m 0m";

type ModelViewerEl = HTMLElement & {
  cameraOrbit: string;
  cameraTarget: string;
  getCameraOrbit?: () => string;
  loaded?: boolean;
};

export function BodyMap3D({ activeLabel = "MSK legs" }: { activeLabel?: string }) {
  const viewerRef = useRef<ModelViewerEl | null>(null);
  const [failed, setFailed] = useState(false);
  const [calloutHidden, setCalloutHidden] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await import("@google/model-viewer");
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mv = viewerRef.current;
    if (!mv || !ready) return;
    const onError = () => setFailed(true);
    mv.addEventListener("error", onError);
    return () => mv.removeEventListener("error", onError);
  }, [ready]);

  function parseOrbit(s: string) {
    const p = String(s).trim().split(/\s+/);
    return { theta: p[0], phi: p[1], radius: p[2] };
  }

  function zoom(factor: number) {
    const mv = viewerRef.current;
    if (!mv) return;
    const raw = mv.getCameraOrbit ? String(mv.getCameraOrbit()) : mv.cameraOrbit || FRONT;
    const o = parseOrbit(raw);
    const m = String(o.radius).match(/([0-9.]+)/);
    if (!m) return;
    let r = parseFloat(m[1]) * factor;
    r = Math.min(4.2, Math.max(1.6, r));
    mv.cameraOrbit = `${o.theta} ${o.phi} ${r.toFixed(2)}m`;
  }

  function setView(orbit: string) {
    const mv = viewerRef.current;
    if (!mv) return;
    mv.cameraOrbit = orbit;
    mv.cameraTarget = TARGET;
  }

  return (
    <div className="bg-white rounded-[20px] border border-border shadow-card overflow-hidden flex flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
        <div>
          <div className="font-semibold text-[15px] text-charcoal">Physiological map</div>
          <div className="text-[11px] text-secondary uppercase tracking-wide mt-0.5">
            Interactive 3D · drag to rotate · scroll to zoom
          </div>
        </div>
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-primary-soft text-primary">
          Active: {activeLabel}
        </span>
      </div>

      <div className="relative mx-4 mb-2 rounded-[16px] bg-white border border-border-soft overflow-hidden" style={{ minHeight: 640 }}>
        {!failed && (
          // @ts-expect-error model-viewer custom element
          <model-viewer
            ref={viewerRef}
            src="/models/ecorche.glb"
            poster="/models/ecorche-preview.jpg"
            alt="Interactive 3D anatomical muscular system (Écorché). Drag to rotate."
            camera-controls
            touch-action="pan-y"
            camera-orbit={FRONT}
            camera-target={TARGET}
            field-of-view="22deg"
            min-camera-orbit="auto 55deg auto"
            max-camera-orbit="auto 105deg auto"
            min-field-of-view="18deg"
            max-field-of-view="40deg"
            shadow-intensity="0.35"
            exposure="1.05"
            environment-image="neutral"
            interaction-prompt="auto"
            tone-mapping="commerce"
            loading="eager"
            reveal="auto"
            style={{ width: "100%", height: "640px", background: "#fff" }}
          />
        )}

        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/models/ecorche-preview.jpg"
              alt="Static anatomical ecorché fallback (same CC BY-SA model)"
              className="max-h-[520px] object-contain"
            />
            <p className="text-sm text-secondary mt-3">3D viewer unavailable — showing still of the same model.</p>
          </div>
        )}

        {/* HTML hotspot overlays */}
        {!failed && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {!calloutHidden && (
              <div className="absolute left-[42%] top-[58%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <button
                  type="button"
                  className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-white border border-border text-secondary text-xs leading-none shadow-card"
                  aria-label="Dismiss callout"
                  onClick={() => setCalloutHidden(true)}
                >
                  ×
                </button>
                <div className="relative w-28 h-28">
                  <div className="absolute inset-0 rounded-full bg-yellow/25 border-2 border-yellow animate-pulse" />
                  <div className="absolute inset-3 rounded-full border border-yellow/60" />
                </div>
                <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap bg-white border border-border rounded-full px-2.5 py-1 text-[11px] font-semibold text-charcoal shadow-card">
                  MSK · lower limbs
                </div>
              </div>
            )}
            <span className="absolute left-1/2 top-[10%] w-2.5 h-2.5 -ml-1 rounded-full bg-primary border-2 border-white shadow" title="Sleep / circadian" />
            <span className="absolute left-1/2 top-[16%] w-2.5 h-2.5 -ml-1 rounded-full bg-teal border-2 border-white shadow" title="Vestibular" />
            <span className="absolute left-1/2 top-[30%] w-2.5 h-2.5 -ml-1 rounded-full bg-blue border-2 border-white shadow" title="Cardiovascular" />
            <span className="absolute left-[68%] top-[26%] w-2.5 h-2.5 rounded-full bg-purple border-2 border-white shadow" title="Radiation load" />
            <span className="absolute left-[48%] top-[68%] w-3 h-3 rounded-full bg-yellow border-2 border-white shadow ring-2 ring-yellow/40" title="Musculoskeletal (active)" />
          </div>
        )}

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-border shadow-card text-lg font-medium text-charcoal hover:bg-card-muted"
            aria-label="Zoom in"
            onClick={() => zoom(0.88)}
          >
            +
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-border shadow-card text-lg font-medium text-charcoal hover:bg-card-muted"
            aria-label="Zoom out"
            onClick={() => zoom(1.12)}
          >
            −
          </button>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10" aria-label="Front / back snap">
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-white border border-border shadow-card text-charcoal hover:bg-primary-soft"
            aria-label="Front view"
            onClick={() => setView(FRONT)}
          >
            ‹
          </button>
          <svg viewBox="0 0 160 36" className="w-28 h-6" aria-hidden>
            <path d="M20 28 Q80 4 140 28" fill="none" stroke="#EE6D52" strokeWidth="1.5" opacity="0.45" />
          </svg>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-white border border-border shadow-card text-charcoal hover:bg-primary-soft"
            aria-label="Back view"
            onClick={() => setView(BACK)}
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pb-4 text-[11px] text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-blue inline-block" />
          Cardiovascular
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-yellow inline-block" />
          Musculoskeletal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-teal inline-block" />
          Vestibular
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-primary inline-block" />
          Sleep / circadian
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-purple inline-block" />
          Radiation load
        </span>
        <span className="text-muted">Écorché · CC BY-SA 4.0</span>
      </div>
    </div>
  );
}
