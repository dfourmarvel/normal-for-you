import type { DonkiEvent } from "./types";

export const MOCK_STORMS: DonkiEvent[] = [
  {
    id: "may-2024-sep",
    type: "SEP",
    title: "May 2024 Solar Radiation Storm",
    source: "DONKI",
    startTime: "2024-05-10T00:00:00Z",
  },
  {
    id: "may-2024-gst",
    type: "GST",
    title: "May 2024 Geomagnetic Storm",
    source: "DONKI",
    startTime: "2024-05-11T00:00:00Z",
  },
];