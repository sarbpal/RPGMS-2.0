export interface FlatDraftArea {
  name: string;
  bedPrefix: string;
  beds: string[];
  defaultRent: number;
  defaultDeposit: number;
}

export interface FlatDraft {
  flatNumber: string;
  floor: string;
  description: string;
  capacity: number;
  areas: FlatDraftArea[];
}
