// Type augmentation to fix Buffer compatibility between Bun and Node.js crypto
// This is a known issue where Bun's type definitions for ArrayBufferView
// are incompatible with Node.js crypto type definitions
//
// At runtime, Buffer IS compatible with all these types, but TypeScript's
// strict type checking sees an incompatibility between ArrayBuffer and SharedArrayBuffer
// in the generic parameter of Uint8Array
//
// This helper provides a type-safe way to work with Buffer in crypto operations

declare global {
  /**
   * Type-safe helper to convert Buffer to a type compatible with Node.js crypto functions.
   * Buffer extends Uint8Array at runtime, so this is safe.
   */
  function toUint8Array<T extends Uint8Array>(buffer: T): Uint8Array<ArrayBuffer>;
}

export {};
