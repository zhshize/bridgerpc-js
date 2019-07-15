"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var msgpack_lite_1 = require("msgpack-lite");
var RpcResponse = /** @class */ (function () {
    function RpcResponse() {
        this.bridgerpc = '1.0';
        this.id = null;
        this.result = null;
        this.error = null;
    }
    RpcResponse.prototype.encodeToMessagePack = function () {
        var r = {
            bridgerpc: this.bridgerpc,
            id: this.id,
            result: this.result,
            error: null
        };
        if (this.error !== null || this.error !== undefined) {
            var error = this.error;
            r.error = {
                code: error.code,
                message: error.message,
                data: error.data
            };
        }
        return msgpack_lite_1.default.encode(r);
    };
    return RpcResponse;
}());
exports.default = RpcResponse;
//# sourceMappingURL=rpcResponse.js.map