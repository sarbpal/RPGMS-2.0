export interface TariffSlab {
  fromUnits: number;
  toUnits: number | null; // null represents infinity / unbounded upper slab
  ratePerUnit: number;
}

export interface ElectricityTariffProps {
  id: string;
  name: string;
  ratePerUnit: number;
  fixedCharge: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  slabs?: TariffSlab[];
}

export class ElectricityTariff {
  public readonly id: string;
  public readonly name: string;
  public readonly ratePerUnit: number;
  public readonly fixedCharge: number;
  public readonly effectiveFrom: string;
  public readonly effectiveUntil?: string;
  public readonly slabs?: TariffSlab[];

  constructor(props: ElectricityTariffProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ElectricityTariff ID cannot be empty.');
    }
    if (props.ratePerUnit < 0) {
      throw new Error('Rate per unit cannot be negative.');
    }
    if (props.fixedCharge < 0) {
      throw new Error('Fixed charge cannot be negative.');
    }

    this.id = props.id;
    this.name = props.name;
    this.ratePerUnit = props.ratePerUnit;
    this.fixedCharge = props.fixedCharge;
    this.effectiveFrom = props.effectiveFrom;
    this.effectiveUntil = props.effectiveUntil;
    this.slabs = props.slabs;
  }

  /**
   * Calculates the total cost for a given consumption in units based on fixed charge and tariff slabs.
   */
  public calculateCost(unitsConsumed: number): number {
    if (unitsConsumed <= 0) {
      return this.fixedCharge;
    }

    let variableCost = 0;

    if (this.slabs && this.slabs.length > 0) {
      let remainingUnits = unitsConsumed;
      for (const slab of this.slabs) {
        if (remainingUnits <= 0) break;

        const slabLimit = slab.toUnits !== null ? slab.toUnits - slab.fromUnits : Infinity;
        const unitsInSlab = Math.min(remainingUnits, slabLimit);
        variableCost += unitsInSlab * slab.ratePerUnit;
        remainingUnits -= unitsInSlab;
      }
    } else {
      variableCost = unitsConsumed * this.ratePerUnit;
    }

    const totalCost = this.fixedCharge + variableCost;
    return Number(totalCost.toFixed(2));
  }
}
