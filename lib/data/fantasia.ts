export const FANTASIA_URL = "/data/fantasia-nn.json";

export type FantasiaGroup = "young" | "elderly";

export interface FantasiaRecord {
  id: string;
  group: FantasiaGroup;
  age: number | null;
  sex: "M" | "F" | null;
  /** Beats in the annotation file. */
  beats: number;
  /** Intervals left out (not normal-to-normal, or outside 300–2000 ms). */
  dropped: number;
  /** Normal-to-normal intervals, ms. */
  nn: number[];
}

export interface Fantasia { source: string; licence: string; cite: string; method: string; records: FantasiaRecord[] }

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// The file is ours, but it is fetched at run time, so a broken copy fails loudly instead of plotting nonsense.
export function parseFantasia(raw: unknown): Fantasia {
  const d = raw as Partial<Fantasia> | null;
  if (!d || typeof d !== "object" || !Array.isArray(d.records)) throw new Error("Fantasia: no records list in the file");
  for (const k of ["source", "licence", "cite", "method"] as const) {
    if (typeof d[k] !== "string") throw new Error(`Fantasia: missing "${k}"`);
  }
  const records = d.records.map((r, i): FantasiaRecord => {
    const id = typeof r?.id === "string" ? r.id : `record ${i + 1}`;
    if (r?.group !== "young" && r?.group !== "elderly") throw new Error(`Fantasia: ${id} has no young/elderly group`);
    if (!Array.isArray(r.nn) || !r.nn.every(isNum)) throw new Error(`Fantasia: ${id} has a bad interval list`);
    return {
      id,
      group: r.group,
      age: isNum(r.age) ? r.age : null,
      sex: r.sex === "M" || r.sex === "F" ? r.sex : null,
      beats: isNum(r.beats) ? r.beats : r.nn.length,
      dropped: isNum(r.dropped) ? r.dropped : 0,
      nn: r.nn,
    };
  });
  return { source: d.source!, licence: d.licence!, cite: d.cite!, method: d.method!, records };
}

export async function loadFantasia(): Promise<Fantasia> {
  const res = await fetch(FANTASIA_URL);
  if (!res.ok) throw new Error(`Fantasia: could not load ${FANTASIA_URL} (${res.status})`);
  return parseFantasia(await res.json());
}
