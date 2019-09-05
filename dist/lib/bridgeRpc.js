"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// ...
// @ts-ignore
var rpcRequest_1 = require("./rpcRequest");
exports.RpcRequest = rpcRequest_1.default;
var rpcResponse_1 = require("./rpcResponse");
exports.RpcResponse = rpcResponse_1.default;
var msgpack_lite_1 = require("msgpack-lite");
var rpcError_1 = require("./rpcError");
exports.RpcError = rpcError_1.default;
var operationTimeoutError_1 = require("./operationTimeoutError");
exports.OperationTimeoutError = operationTimeoutError_1.default;
/**
 * [[BridgeRpc]] is an Bridge RPC client can connect to Bridge RPC server and
 * register methods and emit a request or a notification.
 */
var BridgeRpc = /** @class */ (function () {
    /**
     * Initialize an [[BridgeRpc]] object, start receiving/sending after called
     * [[connect]].  Suggest you register the handling methods before you call
     * [[connect]].
     * @param url Url of the server to be connected.
     */
    function BridgeRpc(url) {
        this._rawSocket = null;
        this.url = url;
        this.handlers = new RequestHandlerDictionary();
        this.notificationHandlers = new NotificationHandlerDictionary();
        this.callbacks = new CallbackDictionary();
    }
    Object.defineProperty(BridgeRpc.prototype, "rawSocket", {
        /**
         * Get [[WebSocket]] object maintained by [[BridgeRpc]] object.
         * **BE CAREFUL** to access this getter.
         */
        get: function () {
            if (this._rawSocket === null) {
                this.connect();
            }
            return this._rawSocket;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Connect to the server.
     * Suggest you register the handling methods before you call [[connect]].
     */
    BridgeRpc.prototype.connect = function () {
        this._rawSocket = new WebSocket(this.url);
        this._rawSocket.binaryType = 'arraybuffer';
        this._rawSocket.onmessage = this.onMessage.bind(this);
    };
    /**
     * An event listener to be called when the server is connected.
     * @param connected The event listener.
     */
    BridgeRpc.prototype.onConnect = function (connected) {
        this.rawSocket.onopen = connected;
    };
    /**
     * An event listener with method name to be called when received a request.
     * @param method The name of the method will be registered.
     * @param handler The event listener, must returned a [[RpcResponse]].
     */
    BridgeRpc.prototype.onRequest = function (method, handler) {
        this.handlers[method] = handler;
    };
    /**
     * An event listener with method name to be called when received a notification.
     * @param method The name of the method will be registered.
     * @param handler The event listener, no return value.
     */
    BridgeRpc.prototype.onNotify = function (method, handler) {
        var m = this.notificationHandlers[method];
        if (m === null || m === undefined) {
            this.notificationHandlers[method] = new Array();
        }
        this.notificationHandlers[method].push(handler);
    };
    /**
     * Call remote method.
     * @param method The method name to be called.
     * @param data Parameters to be sent.
     * @param timeoutMilliSeconds Timeout of request operation, unit is millisecond.
     */
    BridgeRpc.prototype.request = function (method, data, timeoutMilliSeconds) {
        var _this = this;
        if (timeoutMilliSeconds === void 0) { timeoutMilliSeconds = 5000; }
        var id = BridgeRpc.randomString();
        this.rawSocket.send(msgpack_lite_1.default.encode({
            bridgerpc: '1.0',
            method: method,
            data: data,
            id: id
        }));
        return new Promise(function (resolve, reject) {
            _this.callbacks[id] = new RpcCallback(resolve, reject);
            setTimeout(function () {
                if (_this.callbacks.hasOwnProperty(id)) {
                    _this.callbacks[id].reject(new operationTimeoutError_1.default("Rpc request timeout (" + timeoutMilliSeconds + " ms)"));
                }
            }, timeoutMilliSeconds);
        });
    };
    /**
     * Call remote method without response.
     * @param method The method name to be called.
     * @param data Parameters to be sent.
     */
    BridgeRpc.prototype.notify = function (method, data) {
        this.rawSocket.send(msgpack_lite_1.default.encode({
            bridgerpc: '1.0',
            method: method,
            data: data,
            id: null
        }));
    };
    /**
     * An event listener for [[WebSocket]] onmessage to handle BridgeRpc message.
     * @param event Event object from WebSocket.onmessage
     */
    BridgeRpc.prototype.onMessage = function (event) {
        var data = msgpack_lite_1.default.decode(new Uint8Array(event.data));
        if (data.method !== undefined && data.method !== null) {
            // It's a request or notification
            if (data.id !== undefined && data.id !== null) {
                // It's a request
                var request = data;
                var handler = this.handlers[request.method];
                if (handler === null || handler === undefined) {
                    // Method not found
                    this.rawSocket.send(BridgeRpc.methodNotFoundResponse(request).encodeToMessagePack());
                    return;
                }
                var res = void 0;
                try {
                    res = handler(request);
                    if (!(res instanceof rpcResponse_1.default)) {
                        var generateResponse = new rpcResponse_1.default();
                        generateResponse.id = request.id;
                        generateResponse.result = res;
                        res = generateResponse;
                    }
                    if (res === undefined || res === null) {
                        // Internal Error
                        this.rawSocket.send(BridgeRpc.internalErrorResponse(request, 'Method called, but no response.', null).encodeToMessagePack());
                        return;
                    }
                }
                catch (e) {
                    // Internal Error
                    this.rawSocket.send(BridgeRpc.internalErrorResponse(request, 'Error occurred when method calling.', e).encodeToMessagePack());
                    return;
                }
                var response = res;
                response.id = request.id;
                this.rawSocket.send(response.encodeToMessagePack());
            }
            else {
                // It's a notification
                var notification = data;
                var handlers = this.handlers[notification.method];
                if (handlers.length === 0) {
                    // Method not found (should NOT sent response)
                }
                try {
                    this.notificationHandlers[notification.method].forEach(function (handler) {
                        handler(data);
                    });
                }
                catch (e) {
                    // ignore
                }
            }
        }
        else {
            // It's a response
            var response = data;
            var callback = this.callbacks[response.id];
            try {
                callback.resolve(response);
                delete this.callbacks[response.id];
            }
            catch (e) {
                // ignore
            }
        }
    };
    /**
     * Close the connection.
     * @param code A numeric value indicating the status code explaining why the connection is being
     * closed. If this parameter is not specified, a default value of 1005 is assumed. See the [list
     * of status codes](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes)
     * of CloseEvent for permitted values.
     * @param reason A human-readable string explaining why the connection is closing. This string
     * must be no longer than 123 bytes of UTF-8 text (**not** characters).
     */
    BridgeRpc.prototype.close = function (code, reason) {
        this.rawSocket.close(code, reason);
    };
    BridgeRpc.methodNotFoundResponse = function (request) {
        var error = new rpcError_1.default();
        error.code = -3;
        error.message = 'Method not found.';
        error.setData(request);
        var response = new rpcResponse_1.default();
        response.error = error;
        response.result = null;
        response.id = request.id;
        return response;
    };
    BridgeRpc.internalErrorResponse = function (request, message, error) {
        var err = new rpcError_1.default();
        err.code = -10;
        err.message = message;
        err.setData(error);
        var response = new rpcResponse_1.default();
        response.error = err;
        response.result = null;
        response.id = request.id;
        return response;
    };
    BridgeRpc.randomString = function () {
        return (Math.random()
            .toString(36)
            .substring(2, 10) +
            Math.random()
                .toString(36)
                .substring(2, 10));
    };
    return BridgeRpc;
}());
exports.default = BridgeRpc;
var RequestHandlerDictionary = /** @class */ (function () {
    function RequestHandlerDictionary() {
    }
    return RequestHandlerDictionary;
}());
var NotificationHandlerDictionary = /** @class */ (function () {
    function NotificationHandlerDictionary() {
    }
    return NotificationHandlerDictionary;
}());
var RpcCallback = /** @class */ (function () {
    function RpcCallback(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
    }
    return RpcCallback;
}());
var CallbackDictionary = /** @class */ (function () {
    function CallbackDictionary() {
    }
    return CallbackDictionary;
}());
//# sourceMappingURL=bridgeRpc.js.map