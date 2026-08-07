export interface MeterReadingProps {
  id: string;
  meterId: string;
  readingDate: string;
  readingPeriod: string; // YYYY-MM
  previousReading: number;
  currentReading: number;
  recordedBy?: string;
  remarks?: string;
  createdAt?: string;
}

export class MeterReading {
  public readonly id: string;
  public readonly meterId: string;
  public readonly readingDate: string;
  public readonly readingPeriod: string;
  public readonly previousReading: number;
  public readonly currentReading: number;
  public readonly unitsConsumed: number;
  public readonly recordedBy?: string;
  public readonly remarks?: string;
  public readonly createdAt: string;

  constructor(props: MeterReadingProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('MeterReading ID cannot be empty.');
    }
    if (!props.meterId || props.meterId.trim() === '') {
      throw new Error('MeterReading meterId cannot be empty.');
    }
    if (props.previousReading < 0) {
      throw new Error('Previous reading cannot be negative.');
    }
    if (props.currentReading < props.previousReading) {
      throw new Error(
        `Current reading (${props.currentReading}) cannot be less than previous reading (${props.previousReading}).`
      );
    }

    this.id = props.id;
    this.meterId = props.meterId;
    this.readingDate = props.readingDate;
    this.readingPeriod = props.readingPeriod;
    this.previousReading = props.previousReading;
    this.currentReading = props.currentReading;
    this.unitsConsumed = Number((props.currentReading - props.previousReading).toFixed(2));
    this.recordedBy = props.recordedBy;
    this.remarks = props.remarks;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
