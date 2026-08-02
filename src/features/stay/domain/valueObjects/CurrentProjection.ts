import type { StayStatus } from './StayStatus';

export interface CurrentProjectionProps {
  stayId: string;
  residentId: string;
  status: StayStatus;
  checkInDate: string;
  expectedCheckoutDate?: string;
  actualCheckoutDate?: string;
  flatId: string;
  activeBedIds: string[];
  currentRent: number;
  currentDeposit: number;
  doorId?: string;
  noticeStatus: 'NONE' | 'ON_NOTICE';
  noticeDate?: string;
}

export class CurrentProjection {
  readonly stayId: string;
  readonly residentId: string;
  readonly status: StayStatus;
  readonly checkInDate: string;
  readonly expectedCheckoutDate?: string;
  readonly actualCheckoutDate?: string;
  readonly flatId: string;
  readonly activeBedIds: string[];
  readonly currentRent: number;
  readonly currentDeposit: number;
  readonly doorId?: string;
  readonly noticeStatus: 'NONE' | 'ON_NOTICE';
  readonly noticeDate?: string;

  constructor(props: CurrentProjectionProps) {
    this.stayId = props.stayId;
    this.residentId = props.residentId;
    this.status = props.status;
    this.checkInDate = props.checkInDate;
    this.expectedCheckoutDate = props.expectedCheckoutDate;
    this.actualCheckoutDate = props.actualCheckoutDate;
    this.flatId = props.flatId;
    this.activeBedIds = [...props.activeBedIds];
    this.currentRent = props.currentRent;
    this.currentDeposit = props.currentDeposit;
    this.doorId = props.doorId;
    this.noticeStatus = props.noticeStatus;
    this.noticeDate = props.noticeDate;
  }
}
