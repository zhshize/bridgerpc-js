"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var msgpack_lite_1 = require("msgpack-lite");
var RpcRequest = /** @class */ (function () {
    function RpcRequest() {
        this.bridgerpc = '1.0';
        this.id = null;
        this.method = '';
        this.data = null;
    }
    RpcRequest.prototype.setData = function (obj) {
        this.data = msgpack_lite_1.default.encode(obj);
    };
    RpcRequest.prototype.getData = function () {
        return msgpack_lite_1.default.decode(this.data);
    };
    RpcRequest.prototype.encodeToMessagePack = function () {
        return msgpack_lite_1.default.encode({
            bridgerpc: this.bridgerpc,
            id: this.id,
            method: this.method,
            data: this.data
        });
    };
    return RpcRequest;
}());
exports.default = RpcRequest;
//# sourceMappingURL=rpcRequest.js.map