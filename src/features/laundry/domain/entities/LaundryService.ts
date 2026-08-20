export interface LaundryServiceProps {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * LaundryService represents a resident-facing business service that can be requested
 * for a Laundry Item (e.g. Cleaning, Ironing, Dry Cleaning).
 *
 * Invariant: Service Master is configurable and represents a commercial service,
 * not internal physical machinery steps.
 */
export class LaundryService {
  public readonly id: string;
  public readonly code: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly isActive: boolean;
  public readonly createdAt: string;
  public readonly updatedAt?: string;

  constructor(props: LaundryServiceProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryService ID cannot be empty.');
    }
    if (!props.code || props.code.trim() === '') {
      throw new Error('LaundryService code cannot be empty.');
    }
    if (!props.name || props.name.trim() === '') {
      throw new Error('LaundryService name cannot be empty.');
    }
    if (!props.createdAt || props.createdAt.trim() === '') {
      throw new Error('LaundryService createdAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.code = props.code.trim().toUpperCase();
    this.name = props.name.trim();
    this.description = props.description?.trim();
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public toJSON(): LaundryServiceProps {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
