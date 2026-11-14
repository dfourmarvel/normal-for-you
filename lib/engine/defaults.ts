import type { Tables } from "@/lib/data/tables";
import type { RangeRow } from "@/lib/data/tables";
import { variation } from "@/lib/data/variation";
import { ranges } from "@/lib/data/ranges";
import { limits } from "@/lib/data/limits";
import { phases } from "@/lib/data/phases";

export const defaultTables: Tables = { variation, ranges, limits, phases };

// Blood-count lab ranges come from the OSD-569 file itself, so they are added at load time.
export function withLabRanges(tables: Tables, labRanges: readonly RangeRow[]): Tables {
  return { ...tables, ranges: [...tables.ranges, ...labRanges] };
}
