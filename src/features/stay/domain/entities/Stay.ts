import { BedAllocation, type BedAllocationProps } from '../valueObjects/BedAllocation';
import { BusinessEvent, type BusinessEventProps } from '../valueObjects/BusinessEvent';
import { CommercialAgreement, type CommercialAgreementProps } from '../valueObjects/CommercialAgreement';
import { CurrentProjection } from '../valueObjects/CurrentProjection';
import { StayStatus } from '../valueObjects/StayStatus';
import type { StayType } from '../valueObjects/StayType';

export interface StayProps {
  id: string;
  residentId: string;
  stayType: StayType;
  status: StayStatus;
  checkInDate: string;
  expectedCheckoutDate?: string;
  actualCheckoutDate?: string;
  commercialAgreements?: (CommercialAgreement | CommercialAgreementProps)[] | readonly CommercialAgreement[];
  bedAllocations?: (BedAllocation | BedAllocationProps)[] | readonly BedAllocation[];
  businessEvents?: (BusinessEvent | BusinessEventProps)[] | readonly BusinessEvent[];
  doorId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;

  // Optional legacy fields for backward compatibility when instantiating from primitive data
  flatId?: string;
  allocatedBedIds?: string[];
  agreedRent?: number;
  agreedDeposit?: number;
}

export class Stay {
  readonly id: string;
  readonly residentId: string;
  readonly stayType: StayType;
  private _status: StayStatus;
  readonly checkInDate: string;
  readonly expectedCheckoutDate?: string;
  readonly actualCheckoutDate?: string;
  private _commercialAgreements: CommercialAgreement[];
  private _bedAllocations: BedAllocation[];
  private _businessEvents: BusinessEvent[];
  readonly doorId?: string;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: StayProps) {
    this.id = props.id;
    this.residentId = props.residentId;
    this.stayType = props.stayType;
    this._status = props.status || (props as any)._status;
    this.checkInDate = props.checkInDate;
    this.expectedCheckoutDate = props.expectedCheckoutDate;
    this.actualCheckoutDate = props.actualCheckoutDate;
    this.doorId = props.doorId;
    this.notes = props.notes;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();

    // Initialize Commercial Agreements
    if (props.agreedRent !== undefined || props.agreedDeposit !== undefined) {
      const defaultRent = props.commercialAgreements && props.commercialAgreements.length > 0 ? props.commercialAgreements[0].rent : 0;
      const defaultDeposit = props.commercialAgreements && props.commercialAgreements.length > 0 ? props.commercialAgreements[0].securityDeposit : 0;
      this._commercialAgreements = [
        new CommercialAgreement({
          id: `CA-${props.id}-1`,
          stayId: props.id,
          rent: props.agreedRent ?? defaultRent,
          securityDeposit: props.agreedDeposit ?? defaultDeposit,
          effectiveFrom: props.checkInDate,
          amendmentReason: 'Admission Initial Agreement',
          status: 'ACTIVE',
        }),
      ];
    } else if (props.commercialAgreements && props.commercialAgreements.length > 0) {
      this._commercialAgreements = props.commercialAgreements.map((ca) =>
        ca instanceof CommercialAgreement ? ca : new CommercialAgreement(ca)
      );
    } else {
      this._commercialAgreements = [
        new CommercialAgreement({
          id: `CA-${props.id}-1`,
          stayId: props.id,
          rent: 0,
          securityDeposit: 0,
          effectiveFrom: props.checkInDate,
          amendmentReason: 'Admission Initial Agreement',
          status: 'ACTIVE',
        }),
      ];
    }

    // Initialize Bed Allocations
    if (props.allocatedBedIds !== undefined) {
      const flatId = props.flatId || (props.bedAllocations && props.bedAllocations.length > 0 ? props.bedAllocations[0].flatId : 'Unassigned');
      const bedIds = props.allocatedBedIds;
      this._bedAllocations = bedIds.map(
        (bedId, index) =>
          new BedAllocation({
            id: `BA-${props.id}-${index + 1}`,
            stayId: props.id,
            flatId,
            bedId,
            allocatedFrom: props.checkInDate,
            status: 'ACTIVE',
          })
      );
      if (this._bedAllocations.length === 0 && flatId !== 'Unassigned') {
        this._bedAllocations = [
          new BedAllocation({
            id: `BA-${props.id}-1`,
            stayId: props.id,
            flatId,
            bedId: 'UNASSIGNED',
            allocatedFrom: props.checkInDate,
            status: 'ACTIVE',
          }),
        ];
      }
    } else if (props.bedAllocations && props.bedAllocations.length > 0) {
      this._bedAllocations = props.bedAllocations.map((ba) =>
        ba instanceof BedAllocation ? ba : new BedAllocation(ba)
      );
    } else {
      const flatId = props.flatId || 'Unassigned';
      this._bedAllocations = [
        new BedAllocation({
          id: `BA-${props.id}-1`,
          stayId: props.id,
          flatId,
          bedId: 'UNASSIGNED',
          allocatedFrom: props.checkInDate,
          status: 'ACTIVE',
        }),
      ];
    }

    // Initialize Business Events
    if (props.businessEvents && props.businessEvents.length > 0) {
      this._businessEvents = props.businessEvents.map((be) =>
        be instanceof BusinessEvent ? be : new BusinessEvent(be)
      );
    } else {
      this._businessEvents = [
        new BusinessEvent({
          id: `BE-${props.id}-1`,
          stayId: props.id,
          eventType: 'ADMISSION',
          timestamp: props.checkInDate,
          description: `Stay started on ${props.checkInDate}`,
        }),
      ];
    }
  }

  // Aggregate Getters
  get status(): StayStatus {
    return this._status;
  }

  get commercialAgreements(): readonly CommercialAgreement[] {
    return [...this._commercialAgreements];
  }

  get bedAllocations(): readonly BedAllocation[] {
    return [...this._bedAllocations];
  }

  get businessEvents(): readonly BusinessEvent[] {
    return [...this._businessEvents];
  }

  get activeCommercialAgreement(): CommercialAgreement | undefined {
    return (
      this._commercialAgreements.find((ca) => ca.status === 'ACTIVE') ||
      this._commercialAgreements[this._commercialAgreements.length - 1]
    );
  }

  get activeBedAllocations(): BedAllocation[] {
    return this._bedAllocations.filter((ba) => ba.status === 'ACTIVE');
  }

  // Backward-compatibility getters for flat properties
  get flatId(): string {
    const activeAllocations = this.activeBedAllocations;
    if (activeAllocations.length > 0) {
      return activeAllocations[0].flatId;
    }
    return this._bedAllocations.length > 0 ? this._bedAllocations[0].flatId : 'Unassigned';
  }

  get allocatedBedIds(): string[] {
    return this.activeBedAllocations
      .map((ba) => ba.bedId)
      .filter((b) => b !== 'UNASSIGNED');
  }

  get agreedRent(): number {
    return this.activeCommercialAgreement?.rent ?? 0;
  }

  get agreedDeposit(): number {
    return this.activeCommercialAgreement?.securityDeposit ?? 0;
  }

  // Aggregate API: Accommodation Domain Operations (CR-3.3)

  /**
   * Allocates an additional bed to an active Stay within the same flat boundary.
   */
  public allocateAdditionalBed(props: {
    flatId: string;
    bedId: string;
    effectiveFrom: string;
    reason?: string;
  }): CurrentProjection {
    if (this._status !== StayStatus.ACTIVE && this._status !== StayStatus.ON_NOTICE) {
      throw new Error(`Cannot allocate bed for a Stay that is not ACTIVE or ON_NOTICE (current status: ${this._status}).`);
    }

    const activeAllocs = this.activeBedAllocations;
    if (activeAllocs.length > 0) {
      const currentFlatId = activeAllocs[0].flatId;
      if (currentFlatId !== 'Unassigned' && currentFlatId !== props.flatId) {
        throw new Error(
          `Cannot allocate additional bed in Flat ${props.flatId}. All active bed allocations for a Stay must belong to the same Flat (${currentFlatId}).`
        );
      }
    }

    if (activeAllocs.some((ba) => ba.bedId === props.bedId)) {
      throw new Error(`Bed ${props.bedId} is already actively allocated to this Stay.`);
    }

    const newAllocation = new BedAllocation({
      id: `BA-${this.id}-${this._bedAllocations.length + 1}`,
      stayId: this.id,
      flatId: props.flatId,
      bedId: props.bedId,
      allocatedFrom: props.effectiveFrom,
      status: 'ACTIVE',
    });

    this._bedAllocations = this._bedAllocations.map((ba) => {
      if (ba.status === 'ACTIVE' && ba.bedId === 'UNASSIGNED') {
        return new BedAllocation({
          ...ba,
          status: 'RELEASED',
          allocatedUntil: props.effectiveFrom,
        });
      }
      return ba;
    });

    this._bedAllocations.push(newAllocation);

    const eventDesc = props.reason || `Additional Bed ${props.bedId} allocated in Flat ${props.flatId}`;
    this._businessEvents.push(
      new BusinessEvent({
        id: `BE-${this.id}-${this._businessEvents.length + 1}`,
        stayId: this.id,
        eventType: 'ADDITIONAL_BED_ALLOCATED',
        timestamp: props.effectiveFrom,
        description: eventDesc,
        metadata: { flatId: props.flatId, bedId: props.bedId },
      })
    );

    return this.getCurrentProjection();
  }

  /**
   * Releases an active bed allocation from the Stay while preserving allocation history.
   */
  public releaseBed(props: {
    bedId: string;
    effectiveUntil: string;
    reason?: string;
  }): CurrentProjection {
    if (this._status !== StayStatus.ACTIVE && this._status !== StayStatus.ON_NOTICE) {
      throw new Error(`Cannot release bed for a Stay that is not ACTIVE or ON_NOTICE (current status: ${this._status}).`);
    }

    const targetAllocIndex = this._bedAllocations.findIndex(
      (ba) => ba.status === 'ACTIVE' && ba.bedId === props.bedId
    );
    if (targetAllocIndex === -1) {
      throw new Error(`Active bed allocation for bed ${props.bedId} not found on Stay ${this.id}.`);
    }

    const activeCount = this.activeBedAllocations.length;
    if (activeCount <= 1) {
      throw new Error(
        `Cannot release bed ${props.bedId}. A Stay must retain at least 1 active Bed Allocation while active. Releasing all beds requires Operational Checkout.`
      );
    }

    const targetAlloc = this._bedAllocations[targetAllocIndex];
    const releasedAlloc = new BedAllocation({
      id: targetAlloc.id,
      stayId: targetAlloc.stayId,
      flatId: targetAlloc.flatId,
      bedId: targetAlloc.bedId,
      allocatedFrom: targetAlloc.allocatedFrom,
      allocatedUntil: props.effectiveUntil,
      status: 'RELEASED',
      createdAt: targetAlloc.createdAt,
    });

    this._bedAllocations[targetAllocIndex] = releasedAlloc;

    const eventDesc = props.reason || `Bed ${props.bedId} released from Flat ${targetAlloc.flatId}`;
    this._businessEvents.push(
      new BusinessEvent({
        id: `BE-${this.id}-${this._businessEvents.length + 1}`,
        stayId: this.id,
        eventType: 'BED_RELEASED',
        timestamp: props.effectiveUntil,
        description: eventDesc,
        metadata: { flatId: targetAlloc.flatId, releasedBedId: props.bedId },
      })
    );

    return this.getCurrentProjection();
  }

  /**
   * Transfers residency from one bed to another within the same flat in a single atomic domain action.
   */
  public transferBed(props: {
    fromBedId: string;
    toBedId: string;
    effectiveDate: string;
    reason?: string;
  }): CurrentProjection {
    if (this._status !== StayStatus.ACTIVE && this._status !== StayStatus.ON_NOTICE) {
      throw new Error(`Cannot transfer bed for a Stay that is not ACTIVE or ON_NOTICE.`);
    }

    const fromIndex = this._bedAllocations.findIndex(
      (ba) => ba.status === 'ACTIVE' && ba.bedId === props.fromBedId
    );
    if (fromIndex === -1) {
      throw new Error(`Active bed allocation for bed ${props.fromBedId} not found on Stay ${this.id}.`);
    }

    const fromAlloc = this._bedAllocations[fromIndex];
    const releasedFromAlloc = new BedAllocation({
      id: fromAlloc.id,
      stayId: fromAlloc.stayId,
      flatId: fromAlloc.flatId,
      bedId: fromAlloc.bedId,
      allocatedFrom: fromAlloc.allocatedFrom,
      allocatedUntil: props.effectiveDate,
      status: 'RELEASED',
      createdAt: fromAlloc.createdAt,
    });

    const newBedAlloc = new BedAllocation({
      id: `BA-${this.id}-${this._bedAllocations.length + 1}`,
      stayId: this.id,
      flatId: fromAlloc.flatId,
      bedId: props.toBedId,
      allocatedFrom: props.effectiveDate,
      status: 'ACTIVE',
    });

    this._bedAllocations[fromIndex] = releasedFromAlloc;
    this._bedAllocations.push(newBedAlloc);

    const eventDesc =
      props.reason || `Transferred from Bed ${props.fromBedId} to Bed ${props.toBedId} in Flat ${fromAlloc.flatId}`;
    this._businessEvents.push(
      new BusinessEvent({
        id: `BE-${this.id}-${this._businessEvents.length + 1}`,
        stayId: this.id,
        eventType: 'BED_TRANSFER',
        timestamp: props.effectiveDate,
        description: eventDesc,
        metadata: { flatId: fromAlloc.flatId, fromBedId: props.fromBedId, toBedId: props.toBedId },
      })
    );

    return this.getCurrentProjection();
  }

  /**
   * Transfers residency from one flat to another flat in a single atomic domain action.
   */
  public transferFlat(props: {
    newFlatId: string;
    newBedIds: string[];
    effectiveDate: string;
    reason?: string;
  }): CurrentProjection {
    if (this._status !== StayStatus.ACTIVE && this._status !== StayStatus.ON_NOTICE) {
      throw new Error(`Cannot transfer flat for a Stay that is not ACTIVE or ON_NOTICE.`);
    }

    if (!props.newBedIds || props.newBedIds.length === 0) {
      throw new Error(`Flat Transfer requires at least 1 destination bed ID.`);
    }

    const previousFlatId = this.flatId;

    // Close all currently active allocations
    this._bedAllocations = this._bedAllocations.map((ba) => {
      if (ba.status === 'ACTIVE') {
        return new BedAllocation({
          id: ba.id,
          stayId: ba.stayId,
          flatId: ba.flatId,
          bedId: ba.bedId,
          allocatedFrom: ba.allocatedFrom,
          allocatedUntil: props.effectiveDate,
          status: 'RELEASED',
          createdAt: ba.createdAt,
        });
      }
      return ba;
    });

    // Create new active allocations for each destination bed
    props.newBedIds.forEach((bedId) => {
      const newAlloc = new BedAllocation({
        id: `BA-${this.id}-${this._bedAllocations.length + 1}`,
        stayId: this.id,
        flatId: props.newFlatId,
        bedId,
        allocatedFrom: props.effectiveDate,
        status: 'ACTIVE',
      });
      this._bedAllocations.push(newAlloc);
    });

    const eventDesc =
      props.reason ||
      `Transferred from Flat ${previousFlatId} to Flat ${props.newFlatId} with Bed(s) ${props.newBedIds.join(', ')}`;
    this._businessEvents.push(
      new BusinessEvent({
        id: `BE-${this.id}-${this._businessEvents.length + 1}`,
        stayId: this.id,
        eventType: 'FLAT_TRANSFER',
        timestamp: props.effectiveDate,
        description: eventDesc,
        metadata: {
          previousFlatId,
          newFlatId: props.newFlatId,
          newBedIds: props.newBedIds,
        },
      })
    );

    return this.getCurrentProjection();
  }

  // Aggregate API: Current Projection
  getCurrentProjection(): CurrentProjection {
    const activeAgreement = this.activeCommercialAgreement;
    const activeAllocations = this.activeBedAllocations;
    const activeBedIds = activeAllocations
      .map((ba) => ba.bedId)
      .filter((b) => b !== 'UNASSIGNED');
    const flatId = activeAllocations.length > 0 ? activeAllocations[0].flatId : 'Unassigned';

    return new CurrentProjection({
      stayId: this.id,
      residentId: this.residentId,
      status: this._status,
      checkInDate: this.checkInDate,
      expectedCheckoutDate: this.expectedCheckoutDate,
      actualCheckoutDate: this.actualCheckoutDate,
      flatId,
      activeBedIds,
      currentRent: activeAgreement?.rent ?? 0,
      currentDeposit: activeAgreement?.securityDeposit ?? 0,
      doorId: this.doorId,
      noticeStatus: this._status === StayStatus.ON_NOTICE ? 'ON_NOTICE' : 'NONE',
    });
  }
}
