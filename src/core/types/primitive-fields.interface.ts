export type PrimitiveFields<T> = {
  [K in keyof T]: T[K] extends
    | string
    | number
    | boolean
    | Date
    | null
    | undefined
    ? K
    : never;
}[keyof T];
