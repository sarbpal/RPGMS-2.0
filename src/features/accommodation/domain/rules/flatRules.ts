import type { Area } from '../entities/Area';
import type { Bed } from '../entities/Bed';
import type { Flat } from '../entities/Flat';
import { isBedOccupied } from './occupancyRules';

export interface AreaConfigInput {
  id?: string;
  name: string;
  bedPrefix: string;
  bedCount?: number;
  beds?: string[];
}

export interface FlatAreaValidationResult {
  isValid: boolean;
  errors: {
    general?: string;
    areaErrors: Record<string, {
      name?: string;
      bedPrefix?: string;
      bedCount?: string;
    }>;
  };
}

/**
 * Domain Rule: Validates Flat Area configurations for duplicate names, 
 * duplicate bed prefixes, and minimum bed counts.
 */
export function validateFlatAreaConfigs(areas: AreaConfigInput[]): FlatAreaValidationResult {
  const areaErrors: Record<string, { name?: string; bedPrefix?: string; bedCount?: string }> = {};
  let isValid = true;

  const seenNames = new Map<string, string>();
  const seenPrefixes = new Map<string, string>();

  areas.forEach((area) => {
    const key = area.id || area.name;
    const errors: { name?: string; bedPrefix?: string; bedCount?: string } = {};

    const bedCount = typeof area.bedCount === 'number' ? area.bedCount : (area.beds ? area.beds.length : 0);

    // 1. Minimum bed count validation (BR-ACC-007)
    if (bedCount < 1) {
      errors.bedCount = 'Area must contain at least 1 bed.';
      isValid = false;
    }

    // 2. Area Name uniqueness validation (BR-ACC-008)
    const normalizedName = area.name.trim().toLowerCase();
    if (normalizedName) {
      if (seenNames.has(normalizedName)) {
        errors.name = `Area name "${area.name.trim()}" is already used in this flat.`;
        isValid = false;
      } else {
        seenNames.set(normalizedName, key);
      }
    }

    // 3. Bed Prefix uniqueness validation (BR-ACC-006)
    const normalizedPrefix = area.bedPrefix.trim().toUpperCase();
    if (normalizedPrefix) {
      if (seenPrefixes.has(normalizedPrefix)) {
        errors.bedPrefix = `Bed prefix "${normalizedPrefix}" is already used in another area.`;
        isValid = false;
      } else {
        seenPrefixes.set(normalizedPrefix, key);
      }
    }

    if (Object.keys(errors).length > 0) {
      areaErrors[key] = errors;
    }
  });

  return {
    isValid,
    errors: {
      areaErrors,
    },
  };
}

/**
 * Domain Rule: Determines whether a Flat's number/identifier can be modified.
 * Blocked if flat contains occupied or on-notice beds to preserve stable bed IDs (BR-ACC-003).
 */
export function canModifyFlatNumber(flat: Flat): { canModify: boolean; occupiedBeds: Bed[] } {
  const occupiedBeds = flat.areas.flatMap((a) => a.beds).filter(isBedOccupied);
  return { canModify: occupiedBeds.length === 0, occupiedBeds };
}

/**
 * Domain Rule: Determines whether an Area's bed prefix can be modified.
 * Blocked if the area contains occupied beds to preserve stable bed IDs (BR-ACC-003).
 */
export function canModifyAreaPrefix(area: Area): { canModify: boolean; occupiedBeds: Bed[] } {
  const occupiedBeds = area.beds.filter(isBedOccupied);
  return { canModify: occupiedBeds.length === 0, occupiedBeds };
}

/**
 * Domain Rule: Determines whether an Area's bed count can be safely modified.
 * Prevents reducing bed count below the highest index of an occupied bed (BR-ACC-009).
 */
export function canModifyAreaBeds(
  area: Area,
  newBedCount: number
): { canModify: boolean; occupiedBeds: Bed[]; maxOccupiedIndex: number } {
  const occupiedBeds = area.beds.filter(isBedOccupied);
  if (occupiedBeds.length === 0) {
    return { canModify: true, occupiedBeds: [], maxOccupiedIndex: 0 };
  }

  let maxOccupiedIndex = 0;
  area.beds.forEach((bed, index) => {
    if (isBedOccupied(bed)) {
      maxOccupiedIndex = Math.max(maxOccupiedIndex, index + 1);
    }
  });

  const canModify = newBedCount >= maxOccupiedIndex;
  return { canModify, occupiedBeds, maxOccupiedIndex };
}
