export interface FindOneByFieldOptions<Entity, Field extends keyof Entity> {
  field: Field;
  value: Entity[Field];
  disableThrow?: boolean;
  relations?: string[];
}
