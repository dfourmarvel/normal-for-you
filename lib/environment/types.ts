export type DonkiEventType =
  | "SEP"
  | "GST"
  | "RBE"
  | "IPS"
  | "MPC"
  | "FLR";

export type DonkiEvent = {
  id: string;
  type: DonkiEventType;
  startTime: string;
  endTime?: string;
  source: "DONKI";
  title: string;
};

export type GoesRadiationLevel =
  | "NORMAL"
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5";

export type StormStatus = {
  level: GoesRadiationLevel;
  shelterRequired: boolean;
};

export type ShelterWindow = {
  day: number;
  slots: number[];
};