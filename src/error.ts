/*
 * Custom errors for the Regal Game Library.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/**
 * Error that is thrown if a Regal function fails.
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
