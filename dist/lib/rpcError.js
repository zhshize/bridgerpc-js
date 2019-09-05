"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var msgpack_lite_1 = require("msgpack-lite");
var RpcError = /** @class */ (function () {
    function RpcError() {
        this.code = 0;
        this.message = '';
        this.data = null;
    }
    RpcError.prototype.setData = function (obj) {
        this.data = msgpack_lite_1.default.encode(obj);
    };
    RpcError.prototype.getData = function () {
        return msgpack_lite_1.default.decode(this.data);
    };
    return RpcError;
}());
exports.default = RpcError;
//# sourceMappingURL=rpcError.js.map