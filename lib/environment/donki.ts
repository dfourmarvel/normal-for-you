import type { DonkiEvent } from "./types";
import { MOCK_STORMS } from "./mock-storm";

const DONKI_BASE =
  "https://ccmc.gsfc.nasa.gov/DONKIAPI";

type DonkiNotificationResponse = {
  messageID?: string;
  messageBody?: string;
  messageIssueTime?: string;
};

export async function fetchDonkiEvents(): Promise<
  DonkiEvent[]
> {
  try {
    const response = await fetch(
      `${DONKI_BASE}/get/notifications`
    );

    if (!response.ok) {
      throw new Error(
        `DONKI error ${response.status}`
      );
    }

    const data =
      (await response.json()) as DonkiNotificationResponse[];

    return data.map((event, index) => ({
      id:
        event.messageID ??
        `event-${index}`,

      type: "SEP",

      title:
        event.messageBody ??
        "Space Weather Event",

      startTime:
        event.messageIssueTime ??
        new Date().toISOString(),

      source: "DONKI",
    }));
  } catch (error) {
    console.warn(
      "DONKI unavailable. Using mock data.",
      error
    );

    return MOCK_STORMS;
  }
}