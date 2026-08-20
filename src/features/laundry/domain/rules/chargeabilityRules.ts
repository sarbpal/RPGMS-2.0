/**
 * Authoritative BR-L-012 Chargeability Rule:
 *
 * Newly Chargeable Quantity = max(
 *   0,
 *   min(Fulfilled Quantity, Delivered Quantity) - Previously Charged Quantity
 * )
 *
 * Invariant: Chargeability is a bidirectional reconciliation outcome.
 * Physical Delivery and Service Fulfillment are independent business facts that may occur
 * in either chronological order.
 */
export function calculateNewlyChargeableQuantity(
  fulfilledQuantity: number,
  deliveredQuantity: number,
  previouslyChargedQuantity: number
): number {
  if (fulfilledQuantity < 0 || deliveredQuantity < 0 || previouslyChargedQuantity < 0) {
    throw new Error('Quantities evaluated in chargeability calculation must be non-negative.');
  }

  const eligibleQuantity = Math.min(fulfilledQuantity, deliveredQuantity);
  return Math.max(0, eligibleQuantity - previouslyChargedQuantity);
}

/**
 * Builds the deterministic business charge identity for a specific charge bracket tranche:
 * `${transactionId}:${garmentLineId}:${serviceId}:BRK-${String(bracketIndex).padStart(2, '0')}`
 */
export function buildBusinessChargeId(
  transactionId: string,
  garmentLineId: string,
  serviceId: string,
  bracketIndex: number
): string {
  if (!transactionId || !transactionId.trim()) {
    throw new Error('transactionId cannot be empty when building businessChargeId.');
  }
  if (!garmentLineId || !garmentLineId.trim()) {
    throw new Error('garmentLineId cannot be empty when building businessChargeId.');
  }
  if (!serviceId || !serviceId.trim()) {
    throw new Error('serviceId cannot be empty when building businessChargeId.');
  }
  if (bracketIndex <= 0 || !Number.isInteger(bracketIndex)) {
    throw new Error('bracketIndex must be a positive integer when building businessChargeId.');
  }

  const formattedBracket = `BRK-${String(bracketIndex).padStart(2, '0')}`;
  return `${transactionId.trim()}:${garmentLineId.trim()}:${serviceId.trim()}:${formattedBracket}`;
}
