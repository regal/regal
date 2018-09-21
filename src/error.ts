/**
 * Custom errors for the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

// tslint:disable-next-line
true; // This does nothing; it's only so the jsdocs won't conflict

/**
 * Error thrown during execution of Regal library functions.
 */
export class RegalError extends Error {
    /**
     * Constructs a `RegalError` with the given message.
     * @param message The error message, which will be prepended with "RegalError: ".
     */
    constructor(message: string) {
        super(`RegalError: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
