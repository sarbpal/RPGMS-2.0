import type { Stay } from '../types';

export const stayService = {
  /**
   * Fetch a stay by its ID. Stub interface for Sprint 7.3.1.
   */
  getStay(_id: string): Stay | null {
    return null;
  },

  /**
   * Fetch the current active stay for a resident. Stub interface for Sprint 7.3.1.
   */
  getActiveStay(_residentId: string): Stay | null {
    return null;
  },

  /**
   * Create a new stay. Stub interface for Sprint 7.3.1.
   */
  createStay(_stayData: Omit<Stay, 'id' | 'createdAt' | 'updatedAt'>): Stay | null {
    return null;
  },

  /**
   * Update an existing stay. Stub interface for Sprint 7.3.1.
   */
  updateStay(_id: string, _updates: Partial<Stay>): Stay | null {
    return null;
  },

  /**
   * Close an active stay. Stub interface for Sprint 7.3.1.
   */
  closeStay(_id: string): Stay | null {
    return null;
  },
};
