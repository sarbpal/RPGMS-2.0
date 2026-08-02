export interface CommercialAgreementProps {
  id: string;
  stayId: string;
  rent: number;
  securityDeposit: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  amendmentReason: string;
  status: 'ACTIVE' | 'HISTORICAL';
  createdAt?: string;
}

export class CommercialAgreement {
  readonly id: string;
  readonly stayId: string;
  readonly rent: number;
  readonly securityDeposit: number;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string;
  readonly amendmentReason: string;
  readonly status: 'ACTIVE' | 'HISTORICAL';
  readonly createdAt: string;

  constructor(props: CommercialAgreementProps) {
    this.id = props.id;
    this.stayId = props.stayId;
    this.rent = props.rent;
    this.securityDeposit = props.securityDeposit;
    this.effectiveFrom = props.effectiveFrom;
    this.effectiveUntil = props.effectiveUntil;
    this.amendmentReason = props.amendmentReason;
    this.status = props.status;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
