export interface ParticipantShareInput {
  stayId: string;
  residentId: string;
  residentCode: string;
  residentNameSnapshot?: string;
  flatId: string;
  potentialShares: number;
  selectedShares: number;
}

export interface CalculatedParticipantShare {
  stayId: string;
  residentId: string;
  residentCode: string;
  residentNameSnapshot: string;
  flatId: string;
  potentialShares: number;
  selectedShares: number;
  allocatedAmount: number; // In Rupees (exact paise, e.g. 3333.34)
}

export interface PureAllocationCalculationResult {
  totalSupplierAmount: number;
  totalPotentialShares: number;
  totalSelectedShares: number;
  amountPerShare: number;
  remainderPaise: number;
  calculatedTotal: number;
  participantShares: CalculatedParticipantShare[];
}

/**
 * Pure Domain Rule: Calculates exact share allocation in integer paise and distributes
 * remainder paise in strict deterministic order (1. residentCode ASC, 2. stayId ASC).
 * Pure mathematical operation; does NOT set business allocation outcome (e.g. OWNER_ABSORBED).
 */
export function calculateShareBasedAllocation(
  supplierBillAmount: number,
  participants: ParticipantShareInput[]
): PureAllocationCalculationResult {
  if (typeof supplierBillAmount !== 'number' || isNaN(supplierBillAmount) || supplierBillAmount <= 0) {
    throw new Error(`Supplier bill amount must be a positive number greater than zero. Got: ${supplierBillAmount}`);
  }

  const totalPaise = Math.round(supplierBillAmount * 100);
  const totalPotentialShares = participants.reduce((acc, p) => acc + Math.max(0, p.potentialShares || 0), 0);
  const totalSelectedShares = participants.reduce((acc, p) => acc + Math.max(0, p.selectedShares || 0), 0);

  // If no resident shares selected in calculation: return zero participant allocations
  if (totalSelectedShares === 0) {
    const zeroShares: CalculatedParticipantShare[] = participants.map((p) => ({
      stayId: p.stayId,
      residentId: p.residentId,
      residentCode: p.residentCode || 'UNASSIGNED',
      residentNameSnapshot: p.residentNameSnapshot || `Resident (${p.residentId})`,
      flatId: p.flatId,
      potentialShares: p.potentialShares,
      selectedShares: 0,
      allocatedAmount: 0,
    }));

    return {
      totalSupplierAmount: Number(supplierBillAmount.toFixed(2)),
      totalPotentialShares,
      totalSelectedShares: 0,
      amountPerShare: 0,
      remainderPaise: totalPaise,
      calculatedTotal: 0,
      participantShares: zeroShares,
    };
  }

  const basePaisePerShare = Math.floor(totalPaise / totalSelectedShares);
  const remainderPaise = totalPaise % totalSelectedShares;

  // Build individual share units for deterministic tie-breaking distribution
  interface ShareUnit {
    participantIndex: number;
    residentCode: string;
    stayId: string;
    shareOrdinal: number;
  }

  const shareUnits: ShareUnit[] = [];
  participants.forEach((p, idx) => {
    const validShares = Math.max(0, Math.floor(p.selectedShares || 0));
    for (let s = 0; s < validShares; s++) {
      shareUnits.push({
        participantIndex: idx,
        residentCode: p.residentCode || 'UNASSIGNED',
        stayId: p.stayId,
        shareOrdinal: s + 1,
      });
    }
  });

  // Sort share units deterministically: 1. residentCode ASC, 2. stayId ASC, 3. shareOrdinal ASC
  shareUnits.sort((a, b) => {
    const codeCmp = a.residentCode.localeCompare(b.residentCode);
    if (codeCmp !== 0) return codeCmp;
    const stayCmp = a.stayId.localeCompare(b.stayId);
    if (stayCmp !== 0) return stayCmp;
    return a.shareOrdinal - b.shareOrdinal;
  });

  // Track allocated paise per participant index
  const participantPaise = new Array(participants.length).fill(0);

  // Distribute base paise for each selected share
  participants.forEach((p, idx) => {
    const validShares = Math.max(0, Math.floor(p.selectedShares || 0));
    participantPaise[idx] = validShares * basePaisePerShare;
  });

  // Distribute remainder paise 1 paise at a time to sorted share units
  for (let r = 0; r < remainderPaise; r++) {
    const targetShare = shareUnits[r];
    if (targetShare) {
      participantPaise[targetShare.participantIndex] += 1;
    }
  }

  // Construct final participant share results
  let calculatedPaiseTotal = 0;
  const participantShares: CalculatedParticipantShare[] = participants.map((p, idx) => {
    const paiseAmount = participantPaise[idx];
    calculatedPaiseTotal += paiseAmount;
    const allocatedAmount = Number((paiseAmount / 100).toFixed(2));
    return {
      stayId: p.stayId,
      residentId: p.residentId,
      residentCode: p.residentCode || 'UNASSIGNED',
      residentNameSnapshot: p.residentNameSnapshot || `Resident (${p.residentId})`,
      flatId: p.flatId,
      potentialShares: p.potentialShares,
      selectedShares: p.selectedShares,
      allocatedAmount,
    };
  });

  const calculatedTotal = Number((calculatedPaiseTotal / 100).toFixed(2));
  const amountPerShare = Number((basePaisePerShare / 100).toFixed(2));

  return {
    totalSupplierAmount: Number(supplierBillAmount.toFixed(2)),
    totalPotentialShares,
    totalSelectedShares,
    amountPerShare,
    remainderPaise,
    calculatedTotal,
    participantShares,
  };
}
