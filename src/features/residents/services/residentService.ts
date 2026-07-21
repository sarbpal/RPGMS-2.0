import type { Resident } from '../types';
import { mockResidents } from '../data/mockResidents';
import type { Flat } from '../../accommodation/types';

const STORAGE_KEY_RESIDENTS = 'rpgms_residents';
const STORAGE_KEY_FLATS = 'rpgms_flats';

export const residentService = {
  /**
   * Fetch all residents from localStorage.
   * If no residents are found, seeds localStorage with mockResidents.
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
      // Initialize with mock data if not set or empty
      localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(mockResidents));
      return mockResidents;
    } catch (error) {
      console.error('Failed to parse residents from localStorage:', error);
      return mockResidents;
    }
  },

  /**
   * Fetch a single resident by ID.
   */
  getResidentById(id: string): Resident | undefined {
    const residents = this.getResidents();
    return residents.find((r) => r.id === id);
  },

  /**
   * Persist the full residents list to localStorage.
   */
  saveResidents(residents: Resident[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(residents));
    } catch (error) {
      console.error('Failed to save residents to localStorage:', error);
    }
  },

  /**
   * Update an existing resident profile by ID.
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
   * Generate the next incremental resident code (e.g. R000001, R000002).
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
   * Atomically persist a new resident and updated accommodation beds state to localStorage.
   */
  saveOnboardingTransaction(newResident: Resident, updatedFlats: Flat[]): void {
    const residents = this.getResidents();
    const updatedResidents = [...residents, newResident];
    this.saveResidents(updatedResidents);
    this.saveFlats(updatedFlats);
  },
};
