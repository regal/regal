export enum ErrorCode {
    OK,
    NOT_YET_IMPLEMENTED,
    INVALID_INPUT
}

export class RegalError {
    code: ErrorCode;
    message: string;

    constructor(code: ErrorCode, message?: string) {
        this.code = code;
        this.message = message;
    }
}