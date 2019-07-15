(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('msgpack-lite')) :
  typeof define === 'function' && define.amd ? define(['exports', 'msgpack-lite'], factory) :
  (factory((global.bridgerpc = {}),global.msgpack));
}(this, (function (exports,msgpack) { 'use strict';

  msgpack = msgpack && msgpack.hasOwnProperty('default') ? msgpack['default'] : msgpack;

  var RpcRequest = /** @class */ (function () {
      function RpcRequest() {
          this.bridgerpc = '1.0';
          this.id = null;
          this.method = '';
          this.data = null;
      }
      RpcRequest.prototype.encodeToMessagePack = function () {
          return msgpack.encode({
              bridgerpc: this.bridgerpc,
              id: this.id,
              method: this.method,
              data: this.data
          });
      };
      return RpcRequest;
  }());

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
          return msgpack.encode(r);
      };
      return RpcResponse;
  }());

  var RpcError = /** @class */ (function () {
      function RpcError() {
          this.code = 0;
          this.message = '';
          this.data = null;
      }
      return RpcError;
  }());

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var OperationTimeoutError = /** @class */ (function (_super) {
      __extends(OperationTimeoutError, _super);
      function OperationTimeoutError() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      return OperationTimeoutError;
  }(Error));

  // Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
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
          this.rawSocket.send(msgpack.encode({
              bridgerpc: '1.0',
              method: method,
              data: data,
              id: id
          }));
          return new Promise(function (resolve, reject) {
              _this.callbacks[id] = new RpcCallback(resolve, reject);
              setTimeout(function () {
                  if (_this.callbacks.hasOwnProperty(id)) {
                      _this.callbacks[id].reject(new OperationTimeoutError("Rpc request timeout (" + timeoutMilliSeconds + " ms)"));
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
          this.rawSocket.send(msgpack.encode({
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
          var data = msgpack.decode(new Uint8Array(event.data));
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
                      if (!(res instanceof RpcResponse)) {
                          var generateResponse = new RpcResponse();
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
                  if (handlers.length === 0) ;
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
          var error = new RpcError();
          error.code = -3;
          error.message = 'Method not found.';
          error.data = request;
          var response = new RpcResponse();
          response.error = error;
          response.result = null;
          response.id = request.id;
          return response;
      };
      BridgeRpc.internalErrorResponse = function (request, message, error) {
          var err = new RpcError();
          err.code = -10;
          err.message = message;
          err.data = error;
          var response = new RpcResponse();
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

  exports.RpcRequest = RpcRequest;
  exports.RpcResponse = RpcResponse;
  exports.RpcError = RpcError;
  exports.OperationTimeoutError = OperationTimeoutError;
  exports.default = BridgeRpc;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=bridgerpc.umd.js.map
