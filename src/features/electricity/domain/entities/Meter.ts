export type MeterType = 'FLAT_SHARED' | 'BED_DEDICATED';
export type MeterStatus = 'ACTIVE' | 'INACTIVE';

export interface MeterProps {
  id: string;
  meterNumber: string;
  flatId: string;
  bedId?: string;
  meterType: MeterType;
  status: MeterStatus;
  lastReadingValue: number;
  lastReadingDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class Meter {
  public readonly id: string;
  public readonly meterNumber: string;
  public readonly flatId: string;
  public readonly bedId?: string;
  public readonly meterType: MeterType;
  public readonly status: MeterStatus;
  public readonly lastReadingValue: number;
  public readonly lastReadingDate?: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: MeterProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Meter ID cannot be empty.');
    }
    if (!props.meterNumber || props.meterNumber.trim() === '') {
      throw new Error('Meter number cannot be empty.');
    }
    if (!props.flatId || props.flatId.trim() === '') {
      throw new Error('Meter flatId cannot be empty.');
    }
    if (props.lastReadingValue < 0) {
      throw new Error('Meter lastReadingValue cannot be negative.');
    }

    this.id = props.id;
    this.meterNumber = props.meterNumber;
    this.flatId = props.flatId;
    this.bedId = props.bedId;
    this.meterType = props.meterType;
    this.status = props.status;
    this.lastReadingValue = props.lastReadingValue;
    this.lastReadingDate = props.lastReadingDate;
    const now = new Date().toISOString();
    this.createdAt = props.createdAt || now;
    this.updatedAt = props.updatedAt || now;
  }

  public updateLastReading(newReadingValue: number, readingDate: string): Meter {
    if (newReadingValue < this.lastReadingValue) {
      throw new Error(
        `Cannot update meter reading to ${newReadingValue}: value is less than current lastReadingValue ${this.lastReadingValue}.`
      );
    }

    return new Meter({
      ...this,
      lastReadingValue: newReadingValue,
      lastReadingDate: readingDate,
      updatedAt: new Date().toISOString(),
    });
  }
}
