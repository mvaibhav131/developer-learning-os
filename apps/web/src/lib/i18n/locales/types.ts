export type Dict<T> = { [K in keyof T]: T[K] extends string ? string : Dict<T[K]> };
