"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
exports.log = (o, title) => console.log(`${(title) ? `${title}: ` : ''}${util_1.inspect(o, { depth: Infinity })}`);
//# sourceMappingURL=utils.js.map