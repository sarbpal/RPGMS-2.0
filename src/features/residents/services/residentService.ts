import type { Resident, ResidentWithActiveStay, ResidentStatus } from '../types';
import { mockResidents } from '../data/mockResidents';
import type { Flat } from '../../accommodation/types';
import { stayService } from '../stay';
import type { StayStatus } from '../stay/types';

const STORAGE_KEY_RESIDENTS = 'rpgms_residents';
const STORAGE_KEY_FLATS = 'rpgms_flats';

export const residentService = {
  /**
   * Fetch all raw resident records from localStorage.
   * Seeds localStorage with mockResidents if missing or empty.
   */
  getResidents(): Resident[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESIDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(mockResidents));
      return mockResidents;
    } catch (error) {
      console.error('Failed to parse residents from localStorage:', error);
      return mockResidents;
    }
  },

  /**
   * Fetch composite Resident records joined dynamically with Active Stay operational details.
   */
  getResidentsWithActiveStay(): ResidentWithActiveStay[] {
    const residents = this.getResidents();
    const stays = stayService.getStays();

    return residents.map((r) => {
      // Find active or on-notice stay for resident, or latest stay
      const activeStay =
        stays.find(
          (s) =>
            s.residentId === r.id &&
            (s.status === 'ACTIVE' || s.status === 'ON_NOTICE')
        ) || stays.find((s) => s.residentId === r.id);

      if (activeStay) {
        return {
          ...r,
          joiningDate: activeStay.joiningDate || r.joiningDate,
          flatId: activeStay.flatId || r.flatId,
          allocatedBedIds: activeStay.allocatedBedIds || r.allocatedBedIds,
          agreedRent: activeStay.agreedRent ?? r.agreedRent,
          agreedDeposit: activeStay.agreedDeposit ?? r.agreedDeposit,
          status: (activeStay.status as ResidentStatus) || r.status,
          activeStayId: activeStay.id,
        };
      }

      return r;
    });
  },

  /**
   * Fetch a single composite ResidentWithActiveStay record by ID.
   */
  getResidentWithActiveStayById(id: string): ResidentWithActiveStay | undefined {
    const compositeList = this.getResidentsWithActiveStay();
    return compositeList.find((r) => r.id === id);
  },

  /**
   * Fetch a single raw resident by ID.
   */
  getResidentById(id: string): Resident | undefined {
    const residents = this.getResidents();
    return residents.find((r) => r.id === id);
  },

  /**
   * Persist full array of raw residents to localStorage.
   */
  saveResidents(residents: Resident[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(residents));
    } catch (error) {
      console.error('Failed to save residents to localStorage:', error);
    }
  },

  /**
   * Update an existing raw resident profile by ID.
   */
  updateResident(id: string, updates: Partial<Resident>): Resident | null {
    const residents = this.getResidents();
    let updatedResident: Resident | null = null;

    const updatedList = residents.map((r) => {
      if (r.id === id) {
        updatedResident = {
          ...r,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedResident;
      }
      return r;
    });

    if (updatedResident) {
      this.saveResidents(updatedList);
    }

    return updatedResident;
  },

  /**
   * Update a composite resident, dual-writing updates to both Resident identity and Active Stay.
   */
  updateResidentWithActiveStay(
    id: string,
    updates: Partial<ResidentWithActiveStay>
  ): ResidentWithActiveStay | null {
    // 1. Update raw resident record (dual-write phase: includes legacy attributes)
    const updatedRaw = this.updateResident(id, updates);
    if (!updatedRaw) return null;

    // 2. Dual-write operational fields to active Stay if stay exists
    const activeStay = stayService.getActiveStay(id);
    if (activeStay) {
      const stayUpdates: Record<string, unknown> = {};
      if (updates.joiningDate !== undefined) stayUpdates.joiningDate = updates.joiningDate;
      if (updates.flatId !== undefined) stayUpdates.flatId = updates.flatId;
      if (updates.allocatedBedIds !== undefined) stayUpdates.allocatedBedIds = updates.allocatedBedIds;
      if (updates.agreedRent !== undefined) stayUpdates.agreedRent = updates.agreedRent;
      if (updates.agreedDeposit !== undefined) stayUpdates.agreedDeposit = updates.agreedDeposit;
      if (updates.status !== undefined) stayUpdates.status = updates.status as StayStatus;

      if (Object.keys(stayUpdates).length > 0) {
        stayService.updateStay(activeStay.id, stayUpdates);
      }
    }

    return this.getResidentWithActiveStayById(id) || null;
  },

  /**
   * Generate next incremental resident code (e.g. R000001, R000002).
   */
  generateResidentCode(existingResidents?: Resident[]): string {
    const residents = existingResidents || this.getResidents();
    const codes = residents
      .map((r) => r.residentCode)
      .filter((c) => c && c.startsWith('R'));

    if (codes.length === 0) return 'R000001';

    const maxNum = Math.max(
      ...codes.map((c) => parseInt(c.slice(1), 10) || 0)
    );
    return `R${String(maxNum + 1).padStart(6, '0')}`;
  },

  /**
   * Fetch flats from localStorage.
   */
  getFlats(): Flat[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FLATS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse flats from localStorage:', error);
      return [];
    }
  },

  /**
   * Persist updated flats to localStorage.
   */
  saveFlats(flats: Flat[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_FLATS, JSON.stringify(flats));
    } catch (error) {
      console.error('Failed to save flats to localStorage:', error);
    }
  },

  /**
   * Atomically persist a new resident AND stay as one logical transaction.
   * Dual-writes operational fields to both Resident (legacy compatibility) and Stay.
   */
  saveOnboardingTransaction(newResident: Resident, updatedFlats: Flat[]): void {
    // 1. Save resident record
    const residents = this.getResidents();
    const updatedResidents = [...residents, newResident];
    this.saveResidents(updatedResidents);

    // 2. Create Stay record atomically
    stayService.createStay({
      residentId: newResident.id,
      joiningDate: newResident.joiningDate,
      flatId: newResident.flatId,
      allocatedBedIds: newResident.allocatedBedIds,
      agreedRent: newResident.agreedRent,
      agreedDeposit: newResident.agreedDeposit,
      status: newResident.status as StayStatus,
    });

    // 3. Save updated flats
    this.saveFlats(updatedFlats);
  },
};
