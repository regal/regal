"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["OK"] = 0] = "OK";
    ErrorCode[ErrorCode["NOT_YET_IMPLEMENTED"] = 1] = "NOT_YET_IMPLEMENTED";
    ErrorCode[ErrorCode["INVALID_INPUT"] = 2] = "INVALID_INPUT";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class RegalError {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}
exports.RegalError = RegalError;
