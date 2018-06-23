export declare enum ErrorCode {
    OK = 0,
    NOT_YET_IMPLEMENTED = 1,
    INVALID_INPUT = 2
}
export declare class RegalError {
    code: ErrorCode;
    message: string;
    constructor(code: ErrorCode, message?: string);
}
