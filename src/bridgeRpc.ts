// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// ...
// @ts-ignore
import RpcRequest from './rpcRequest'
import RpcResponse from './rpcResponse'
import msgpack from 'msgpack-lite'
import RpcError from './rpcError'
import OperationTimeoutError from './operationTimeoutError'

export type RpcHandler = (request: RpcRequest) => RpcResponse
export type RpcNotificationHandler = (request: RpcRequest) => void

export default class BridgeRpc {
  public constructor(url: string) {
    this.url = url
    this.handlers = new RequestHandlerDictionary()
    this.notificationHandlers = new NotificationHandlerDictionary()
    this.callbacks = new CallbackDictionary()
  }

  private _rawSocket: WebSocket | null = null
  protected url: string
  protected handlers: RequestHandlerDictionary
  protected notificationHandlers: NotificationHandlerDictionary
  protected callbacks: CallbackDictionary

  get rawSocket(): WebSocket {
    if (this._rawSocket === null) {
      this.connect()
    }
    return this._rawSocket as WebSocket
  }

  public connect() {
    this._rawSocket = new WebSocket(this.url)
    this._rawSocket.binaryType = 'arraybuffer'
    this._rawSocket.onmessage = this.onMessage.bind(this)
  }

  public onConnect(connected: () => void): void {
    this.rawSocket.onopen = connected
  }

  public onRequest(method: string, handler: RpcHandler): void {
    this.handlers[method] = handler
  }

  public onNotify(method: string, handler: RpcNotificationHandler): void {
    const m = this.notificationHandlers[method]
    if (m === null || m === undefined) {
      this.notificationHandlers[method] = new Array<RpcHandler>()
    }
    this.notificationHandlers[method].push(handler)
  }

  public request(
    method: string,
    data: any,
    timeoutMilliSeconds: number = 5000
  ): Promise<RpcResponse> {
    const id = BridgeRpc.randomString()
    this.rawSocket.send(
      msgpack.encode({
        bridgerpc: '1.0',
        method: method,
        data: data,
        id: id
      })
    )
    return new Promise<RpcResponse>((resolve, reject) => {
      this.callbacks[id] = new RpcCallback(resolve, reject)
      setTimeout(() => {
        if (this.callbacks.hasOwnProperty(id)) {
          this.callbacks[id].reject(
            new OperationTimeoutError(`Rpc request timeout (${timeoutMilliSeconds} ms)`)
          )
        }
      }, timeoutMilliSeconds)
    })
  }

  public notify(method: string, data: any): void {
    this.rawSocket.send(
      msgpack.encode({
        bridgerpc: '1.0',
        method: method,
        data: data,
        id: null
      })
    )
  }

  protected onMessage(event: any) {
    const data = msgpack.decode(new Uint8Array(event.data))
    if (data.method !== undefined && data.method !== null) {
      // It's a request or notification
      if (data.id !== undefined && data.id !== null) {
        // It's a request
        const request = data as RpcRequest
        const handler = this.handlers[request.method]
        if (handler === null || handler === undefined) {
          // Method not found
          this.rawSocket.send(BridgeRpc.methodNotFoundResponse(request).encodeToMessagePack())
          return
        }
        let res: any
        try {
          res = handler(request)
          if (res === undefined || res === null) {
            // Internal Error
            this.rawSocket.send(
              BridgeRpc.internalErrorResponse(
                request,
                'Method called, but no response.',
                null
              ).encodeToMessagePack()
            )
            return
          }
        } catch (e) {
          // Internal Error
          this.rawSocket.send(
            BridgeRpc.internalErrorResponse(
              request,
              'Error occurred when method calling.',
              e
            ).encodeToMessagePack()
          )
          return
        }
        const response = res as RpcResponse
        response.id = request.id
        this.rawSocket.send(response.encodeToMessagePack())
      } else {
        // It's a notification
        const notification = data as RpcRequest
        const handlers = this.handlers[notification.method]
        if (handlers.length === 0) {
          // Method not found (should NOT sent response)
        }
        try {
          this.notificationHandlers[notification.method].forEach(handler => {
            handler(data)
          })
        } catch (e) {
          // ignore
        }
      }
    } else {
      // It's a response
      const response = data as RpcResponse
      const callback = this.callbacks[response.id as string]
      try {
        callback.resolve(response)
        delete this.callbacks[response.id as string]
      } catch (e) {
        // ignore
      }
    }
  }

  public close(code: number, reason: string): void {
    this.rawSocket.close(code, reason)
  }

  protected static methodNotFoundResponse(request: RpcRequest): RpcResponse {
    const error = new RpcError()
    error.code = -3
    error.message = 'Method not found.'
    error.data = request
    const response = new RpcResponse()
    response.error = error
    response.result = null
    response.id = request.id
    return response
  }

  protected static internalErrorResponse(
    request: RpcRequest,
    message: string,
    error: any
  ): RpcResponse {
    const err = new RpcError()
    err.code = -10
    err.message = message
    err.data = error
    const response = new RpcResponse()
    response.error = err
    response.result = null
    response.id = request.id
    return response
  }

  protected static randomString(): string {
    return (
      Math.random()
        .toString(36)
        .substring(2, 10) +
      Math.random()
        .toString(36)
        .substring(2, 10)
    )
  }
}

class RequestHandlerDictionary {
  [index: string]: RpcHandler
}

class NotificationHandlerDictionary {
  [index: string]: RpcNotificationHandler[]
}

class RpcCallback {
  public constructor(resolve: (response: RpcResponse) => void, reject: (reason: any) => void) {
    this.resolve = resolve
    this.reject = reject
  }

  public resolve: (response: RpcResponse) => void
  public reject: (reason: any) => void
  /*public call(response: RpcResponse) {
    try {
      this.resolve(response);
    } catch (e) {
      this.reject(e);
    }
  }*/
}

class CallbackDictionary {
  [index: string]: RpcCallback
}
