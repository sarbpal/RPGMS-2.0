import type { Stay, StayStatus } from '../types';
import type { Resident } from '../../types';

const STORAGE_KEY_STAYS = 'rpgms_stays';
const STORAGE_KEY_VERSION = 'rpgms_storage_version';
const CURRENT_STORAGE_VERSION = 2;

export const stayService = {
  /**
   * Get the current storage version from localStorage.
   */
  getStorageVersion(): number {
    try {
      const version = localStorage.getItem(STORAGE_KEY_VERSION);
      return version ? parseInt(version, 10) : 1;
    } catch {
      return 1;
    }
  },

  /**
   * Update the storage version in localStorage.
   */
  setStorageVersion(version: number): void {
    try {
      localStorage.setItem(STORAGE_KEY_VERSION, version.toString());
    } catch (error) {
      console.error('Failed to set storage version:', error);
    }
  },

  /**
   * Fetch all stay records from localStorage.
   * Automatically triggers legacy migration if storage version < CURRENT_STORAGE_VERSION.
   */
  getStays(): Stay[] {
    try {
      if (this.getStorageVersion() < CURRENT_STORAGE_VERSION) {
        this.migrateLegacyResidentsData();
      }

      const saved = localStorage.getItem(STORAGE_KEY_STAYS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to parse stays from localStorage:', error);
      return [];
    }
  },

  /**
   * Persist full array of stays to localStorage.
   */
  saveStays(stays: Stay[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_STAYS, JSON.stringify(stays));
    } catch (error) {
      console.error('Failed to save stays to localStorage:', error);
    }
  },

  /**
   * Fetch a single stay record by its ID.
   */
  getStay(id: string): Stay | null {
    const stays = this.getStays();
    return stays.find((s) => s.id === id) || null;
  },

  /**
   * Fetch the active or on-notice stay record for a specific resident.
   */
  getActiveStay(residentId: string): Stay | null {
    const stays = this.getStays();
    return (
      stays.find(
        (s) =>
          s.residentId === residentId &&
          (s.status === 'ACTIVE' || s.status === 'ON_NOTICE')
      ) || null
    );
  },

  /**
   * Create and persist a new stay record.
   */
  createStay(stayData: Omit<Stay, 'id' | 'createdAt' | 'updatedAt'>): Stay {
    const stays = this.getStays();
    const newStay: Stay = {
      ...stayData,
      id: `stay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveStays([...stays, newStay]);
    return newStay;
  },

  /**
   * Update an existing stay record by ID.
   */
  updateStay(id: string, updates: Partial<Stay>): Stay | null {
    const stays = this.getStays();
    let updatedStay: Stay | null = null;

    const updatedList = stays.map((s) => {
      if (s.id === id) {
        updatedStay = {
          ...s,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedStay;
      }
      return s;
    });

    if (updatedStay) {
      this.saveStays(updatedList);
    }

    return updatedStay;
  },

  /**
   * Close an active stay.
   */
  closeStay(id: string): Stay | null {
    return this.updateStay(id, {
      status: 'CLOSED' as StayStatus,
      checkoutDate: new Date().toISOString().split('T')[0],
    });
  },

  /**
   * Idempotent legacy migration utility:
   * Detects legacy resident records and creates corresponding Stay records
   * in `rpgms_stays` without destroying or overwriting legacy `rpgms_residents` data.
   */
  migrateLegacyResidentsData(): void {
    try {
      const savedResidents = localStorage.getItem('rpgms_residents');
      if (!savedResidents) {
        this.setStorageVersion(CURRENT_STORAGE_VERSION);
        return;
      }

      const residents: (Resident & {
        joiningDate?: string;
        flatId?: string;
        allocatedBedIds?: string[];
        agreedRent?: number;
        agreedDeposit?: number;
        status?: string;
      })[] = JSON.parse(savedResidents);

      if (!Array.isArray(residents) || residents.length === 0) {
        this.setStorageVersion(CURRENT_STORAGE_VERSION);
        return;
      }

      // Existing stays check for idempotency
      const existingStaysSaved = localStorage.getItem(STORAGE_KEY_STAYS);
      const existingStays: Stay[] = existingStaysSaved ? JSON.parse(existingStaysSaved) : [];
      const existingResidentIdsWithStays = new Set(existingStays.map((s) => s.residentId));

      const newStaysToCreate: Stay[] = [];

      residents.forEach((r) => {
        // Create Stay record if not already present for this residentId
        if (!existingResidentIdsWithStays.has(r.id) && r.joiningDate && r.flatId) {
          const newStay: Stay = {
            id: `stay_${r.id}`,
            residentId: r.id,
            joiningDate: r.joiningDate,
            flatId: r.flatId,
            allocatedBedIds: r.allocatedBedIds || [],
            agreedRent: r.agreedRent || 0,
            agreedDeposit: r.agreedDeposit || 0,
            status: (r.status as StayStatus) || 'ACTIVE',
            createdAt: r.createdAt || new Date().toISOString(),
            updatedAt: r.updatedAt || new Date().toISOString(),
          };
          newStaysToCreate.push(newStay);
          existingResidentIdsWithStays.add(r.id);
        }
      });

      if (newStaysToCreate.length > 0) {
        const mergedStays = [...existingStays, ...newStaysToCreate];
        this.saveStays(mergedStays);
      }

      // Update storage version metadata
      this.setStorageVersion(CURRENT_STORAGE_VERSION);
    } catch (error) {
      console.error('Failed during migrateLegacyResidentsData execution:', error);
    }
  },
};
