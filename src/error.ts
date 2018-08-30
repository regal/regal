export class RegalError extends Error {
    constructor(message: string = "") {
        super(`RegalError: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
