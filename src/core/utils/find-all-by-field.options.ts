import { PrimitiveFields } from '../types/primitive-fields.interface';

export interface FindAllByFieldOptions<
  Entity,
  Field extends PrimitiveFields<Entity>,
> {
  field: Field;
  value: Entity[Field] | Entity[Field][];
  disableThrow?: boolean;
  relations?: string[];
}
