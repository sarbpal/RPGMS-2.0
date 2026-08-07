export interface MeterReadingValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Domain Rule: Validates meter reading monotonicity and business invariants.
 * Current reading MUST be greater than or equal to previous reading.
 */
export function validateMeterReadingMonotonicity(
  previousReading: number,
  currentReading: number
): MeterReadingValidationResult {
  const errors: string[] = [];

  if (typeof previousReading !== 'number' || isNaN(previousReading) || previousReading < 0) {
    errors.push(`Previous reading must be a non-negative number. Got: ${previousReading}`);
  }

  if (typeof currentReading !== 'number' || isNaN(currentReading) || currentReading < 0) {
    errors.push(`Current reading must be a non-negative number. Got: ${currentReading}`);
  }

  if (errors.length === 0 && currentReading < previousReading) {
    errors.push(
      `Current reading (${currentReading}) cannot be less than previous reading (${previousReading}).`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Domain Rule: Calculates equal split allocation across eligible occupant stays, allocating paise remainder deterministically.
 */
export function calculateOccupantEqualSplit(
  totalBillAmount: number,
  totalUnits: number,
  stayIds: string[]
): Array<{ stayId: string; allocatedAmount: number; allocatedUnits: number }> {
  if (stayIds.length === 0) {
    return [];
  }

  if (totalBillAmount <= 0) {
    return stayIds.map((stayId) => ({ stayId, allocatedAmount: 0, allocatedUnits: 0 }));
  }

  const count = stayIds.length;
  // Compute base per-stay amount in paise to avoid float errors
  const totalPaise = Math.round(totalBillAmount * 100);
  const basePaisePerStay = Math.floor(totalPaise / count);
  const remainderPaise = totalPaise % count;

  const baseUnitsPerStay = Number((totalUnits / count).toFixed(2));

  return stayIds.map((stayId, index) => {
    // Add 1 paise remainder to the first stay(s) until remainder is exhausted
    const stayPaise = basePaisePerStay + (index < remainderPaise ? 1 : 0);
    const allocatedAmount = Number((stayPaise / 100).toFixed(2));
    return {
      stayId,
      allocatedAmount,
      allocatedUnits: baseUnitsPerStay,
    };
  });
}
