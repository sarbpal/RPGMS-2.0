export type LaundryItemCategory = 'CLOTHING' | 'BEDDING' | 'OTHER';

export interface LaundryItemProps {
  id: string;
  code: string;
  name: string;
  category: LaundryItemCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * LaundryItem represents a recognized physical category of laundry that can be collected,
 * processed, returned, and delivered (e.g. Shirt, Trouser, Blanket).
 *
 * Invariant: Physical laundry belongs to an Item category. It is configuration data,
 * not an individually tagged garment.
 */
export class LaundryItem {
  public readonly id: string;
  public readonly code: string;
  public readonly name: string;
  public readonly category: LaundryItemCategory;
  public readonly isActive: boolean;
  public readonly createdAt: string;
  public readonly updatedAt?: string;

  constructor(props: LaundryItemProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryItem ID cannot be empty.');
    }
    if (!props.code || props.code.trim() === '') {
      throw new Error('LaundryItem code cannot be empty.');
    }
    if (!props.name || props.name.trim() === '') {
      throw new Error('LaundryItem name cannot be empty.');
    }
    if (!props.category || !['CLOTHING', 'BEDDING', 'OTHER'].includes(props.category)) {
      throw new Error(`Invalid LaundryItem category: ${props.category}. Must be CLOTHING, BEDDING, or OTHER.`);
    }
    if (!props.createdAt || props.createdAt.trim() === '') {
      throw new Error('LaundryItem createdAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.code = props.code.trim().toUpperCase();
    this.name = props.name.trim();
    this.category = props.category;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public toJSON(): LaundryItemProps {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      category: this.category,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
