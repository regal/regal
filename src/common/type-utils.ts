/**
 * Makes readonly properties in an object mutable and requried.
 * Only use this when you need it; it's like admin access.
 */
export type Mutable<T> = { -readonly [U in keyof T]-?: T[U] };
