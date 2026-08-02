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
  private _expectedCheckoutDate?: string;
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
    this._status = props.status;
    this.checkInDate = props.checkInDate;
    this._expectedCheckoutDate = props.expectedCheckoutDate;
    this.actualCheckoutDate = props.actualCheckoutDate;
    this.doorId = props.doorId;
    this.notes = props.notes;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();

    // Initialize Commercial Agreements
    if (props.commercialAgreements && props.commercialAgreements.length > 0) {
      this._commercialAgreements = props.commercialAgreements.map((ca) =>
        ca instanceof CommercialAgreement ? ca : new CommercialAgreement(ca)
      );
    } else if (props.agreedRent !== undefined || props.agreedDeposit !== undefined) {
      this._commercialAgreements = [
        new CommercialAgreement({
          id: `CA-${props.id}-1`,
          stayId: props.id,
          rent: props.agreedRent ?? 0,
          securityDeposit: props.agreedDeposit ?? 0,
          effectiveFrom: props.checkInDate,
          amendmentReason: 'Admission Initial Agreement',
          status: 'ACTIVE',
        }),
      ];
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
    if (props.bedAllocations && props.bedAllocations.length > 0) {
      this._bedAllocations = props.bedAllocations.map((ba) =>
        ba instanceof BedAllocation ? ba : new BedAllocation(ba)
      );
    } else if (props.allocatedBedIds !== undefined) {
      const flatId = props.flatId || 'Unassigned';
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

  get expectedCheckoutDate(): string | undefined {
    return this._expectedCheckoutDate;
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

  // Aggregate API: Commercial Domain Operations (CR-3.4)

  /**
   * Primary domain operation for revising commercial terms (Rent and/or Deposit).
   * Enforces single active agreement invariant, gapless effective dates, and immutable history.
   */
  public reviseCommercialTerms(props: {
    newRent: number;
    newDeposit: number;
    effectiveDate: string;
    reason: string;
    eventTypeOverride?: string;
  }): CurrentProjection {
    if (this._status !== StayStatus.ACTIVE && this._status !== StayStatus.ON_NOTICE) {
      throw new Error(
        `Cannot revise commercial terms for a Stay that is not ACTIVE or ON_NOTICE (current status: ${this._status}).`
      );
    }

    if (props.newRent === undefined || props.newRent <= 0) {
      throw new Error(`Revised monthly rent must be a positive number greater than 0.`);
    }

    if (props.newDeposit === undefined || props.newDeposit < 0) {
      throw new Error(`Revised security deposit must be a non-negative number.`);
    }

    if (!props.effectiveDate || props.effectiveDate.trim() === '') {
      throw new Error(`Effective date is required for commercial term revision.`);
    }

    if (!props.reason || props.reason.trim() === '') {
      throw new Error(`An explicit amendment reason is required for commercial term revision.`);
    }

    const previousAgreement = this.activeCommercialAgreement;
    const previousRent = previousAgreement ? previousAgreement.rent : 0;
    const previousDeposit = previousAgreement ? previousAgreement.securityDeposit : 0;

    // Step 1: Close all currently active commercial agreements immutably
    this._commercialAgreements = this._commercialAgreements.map((ca) => {
      if (ca.status === 'ACTIVE') {
        return new CommercialAgreement({
          id: ca.id,
          stayId: ca.stayId,
          rent: ca.rent,
          securityDeposit: ca.securityDeposit,
          effectiveFrom: ca.effectiveFrom,
          effectiveUntil: props.effectiveDate,
          amendmentReason: ca.amendmentReason,
          status: 'HISTORICAL',
          createdAt: ca.createdAt,
        });
      }
      return ca;
    });

    // Step 2: Create new ACTIVE CommercialAgreement snapshot
    const newAgreement = new CommercialAgreement({
      id: `CA-${this.id}-${this._commercialAgreements.length + 1}`,
      stayId: this.id,
      rent: props.newRent,
      securityDeposit: props.newDeposit,
      effectiveFrom: props.effectiveDate,
      amendmentReason: props.reason,
      status: 'ACTIVE',
    });
    this._commercialAgreements.push(newAgreement);

    // Step 3: Determine event type and append BusinessEvent
    let eventType = props.eventTypeOverride;
    if (!eventType) {
      const rentChanged = props.newRent !== previousRent;
      const depositChanged = props.newDeposit !== previousDeposit;
      if (rentChanged && !depositChanged) {
        eventType = 'RENT_REVISED';
      } else if (depositChanged && !rentChanged) {
        eventType = 'DEPOSIT_REVISED';
      } else {
        eventType = 'COMMERCIAL_TERMS_REVISED';
      }
    }

    this._businessEvents.push(
      new BusinessEvent({
        id: `BE-${this.id}-${this._businessEvents.length + 1}`,
        stayId: this.id,
        eventType,
        timestamp: props.effectiveDate,
        description: props.reason,
        metadata: {
          previousRent,
          newRent: props.newRent,
          previousDeposit,
          newDeposit: props.newDeposit,
          effectiveDate: props.effectiveDate,
          amendmentReason: props.reason,
        },
      })
    );

    return this.getCurrentProjection();
  }

  /**
   * Convenience domain operation for revising monthly rent only.
   * Delegates directly to reviseCommercialTerms.
   */
  public reviseRent(props: {
    newRent: number;
    effectiveDate: string;
    reason: string;
  }): CurrentProjection {
    const currentDeposit = this.agreedDeposit;
    return this.reviseCommercialTerms({
      newRent: props.newRent,
      newDeposit: currentDeposit,
      effectiveDate: props.effectiveDate,
      reason: props.reason,
      eventTypeOverride: 'RENT_REVISED',
    });
  }

  /**
   * Convenience domain operation for revising security deposit only.
   * Delegates directly to reviseCommercialTerms.
   */
  public reviseDeposit(props: {
    newDeposit: number;
    effectiveDate: string;
    reason: string;
  }): CurrentProjection {
    const currentRent = this.agreedRent;
    return this.reviseCommercialTerms({
      newRent: currentRent,
      newDeposit: props.newDeposit,
      effectiveDate: props.effectiveDate,
      reason: props.reason,
      eventTypeOverride: 'DEPOSIT_REVISED',
    });
  }

  // Aggregate API: Notice Domain Operations (CR-3.5)

  /**
   * Domain operation for placing an active Stay on Notice.
   * Enforces that only ACTIVE Stays can enter Notice.
   * Records noticeDate and expectedCheckoutDate, appends a NOTICE_GIVEN BusinessEvent,
   * and regenerates CurrentProjection without modifying accommodation or commercial history.
   */
  public giveNotice(props: {
    noticeDate: string;
    expectedCheckoutDate: string;
    reason?: string;
  }): CurrentProjection {
    if (this._status !== StayStatus.ACTIVE) {
      throw new Error(
        `Only ACTIVE Stays may enter Notice. Current status is ${this._status}.`
      );
    }

    if (!props.noticeDate || props.noticeDate.trim() === '') {
      throw new Error(`Notice date is required to place a Stay on Notice.`);
    }

    if (!props.expectedCheckoutDate || props.expectedCheckoutDate.trim() === '') {
      throw new Error(`Expected checkout date is required to place a Stay on Notice.`);
    }

    if (props.expectedCheckoutDate < props.noticeDate) {
      throw new Error(
        `Expected checkout date (${props.expectedCheckoutDate}) cannot precede notice date (${props.noticeDate}).`
      );
    }

    // Step 1: Transition lifecycle state to ON_NOTICE
    this._status = StayStatus.ON_NOTICE;

    // Step 2: Record expectedCheckoutDate
    this._expectedCheckoutDate = props.expectedCheckoutDate;

    // Step 3: Append NOTICE_GIVEN BusinessEvent
    const eventDescription =
      props.reason && props.reason.trim() !== ''
        ? props.reason
        : `Resident gave notice on ${props.noticeDate} with expected checkout on ${props.expectedCheckoutDate}`;

    this._businessEvents.push(
      new BusinessEvent({
        id: `BE-${this.id}-${this._businessEvents.length + 1}`,
        stayId: this.id,
        eventType: 'NOTICE_GIVEN',
        timestamp: props.noticeDate,
        description: eventDescription,
        metadata: {
          noticeDate: props.noticeDate,
          expectedCheckoutDate: props.expectedCheckoutDate,
          reason: props.reason,
        },
      })
    );

    // Step 4: Regenerate CurrentProjection
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

    const noticeEvent = [...this._businessEvents].reverse().find((be) => be.eventType === 'NOTICE_GIVEN');
    const noticeDate = noticeEvent ? noticeEvent.timestamp : undefined;

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
      noticeDate,
    });
  }
}
