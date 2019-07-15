import RpcRequest from './rpcRequest';
import RpcResponse from './rpcResponse';
import RpcError from './rpcError';
import OperationTimeoutError from './operationTimeoutError';
export { RpcRequest, RpcResponse, RpcError, OperationTimeoutError };
/**
 * RPC Request handler must process a request and return a [[RpcResponse]].
 */
export declare type RpcHandler = (request: RpcRequest) => any;
/**
 * RPC Notification handler must process a request, nothing should be returned.
 */
export declare type RpcNotificationHandler = (request: RpcRequest) => void;
/**
 * [[BridgeRpc]] is an Bridge RPC client can connect to Bridge RPC server and
 * register methods and emit a request or a notification.
 */
export default class BridgeRpc {
    /**
     * Initialize an [[BridgeRpc]] object, start receiving/sending after called
     * [[connect]].  Suggest you register the handling methods before you call
     * [[connect]].
     * @param url Url of the server to be connected.
     */
    constructor(url: string);
    protected _rawSocket: WebSocket | null;
    protected url: string;
    protected handlers: RequestHandlerDictionary;
    protected notificationHandlers: NotificationHandlerDictionary;
    protected callbacks: CallbackDictionary;
    /**
     * Get [[WebSocket]] object maintained by [[BridgeRpc]] object.
     * **BE CAREFUL** to access this getter.
     */
    readonly rawSocket: WebSocket;
    /**
     * Connect to the server.
     * Suggest you register the handling methods before you call [[connect]].
     */
    connect(): void;
    /**
     * An event listener to be called when the server is connected.
     * @param connected The event listener.
     */
    onConnect(connected: () => void): void;
    /**
     * An event listener with method name to be called when received a request.
     * @param method The name of the method will be registered.
     * @param handler The event listener, must returned a [[RpcResponse]].
     */
    onRequest(method: string, handler: RpcHandler): void;
    /**
     * An event listener with method name to be called when received a notification.
     * @param method The name of the method will be registered.
     * @param handler The event listener, no return value.
     */
    onNotify(method: string, handler: RpcNotificationHandler): void;
    /**
     * Call remote method.
     * @param method The method name to be called.
     * @param data Parameters to be sent.
     * @param timeoutMilliSeconds Timeout of request operation, unit is millisecond.
     */
    request(method: string, data: any, timeoutMilliSeconds?: number): Promise<RpcResponse>;
    /**
     * Call remote method without response.
     * @param method The method name to be called.
     * @param data Parameters to be sent.
     */
    notify(method: string, data: any): void;
    /**
     * An event listener for [[WebSocket]] onmessage to handle BridgeRpc message.
     * @param event Event object from WebSocket.onmessage
     */
    protected onMessage(event: any): void;
    /**
     * Close the connection.
     * @param code A numeric value indicating the status code explaining why the connection is being
     * closed. If this parameter is not specified, a default value of 1005 is assumed. See the [list
     * of status codes](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes)
     * of CloseEvent for permitted values.
     * @param reason A human-readable string explaining why the connection is closing. This string
     * must be no longer than 123 bytes of UTF-8 text (**not** characters).
     */
    close(code: number, reason: string): void;
    protected static methodNotFoundResponse(request: RpcRequest): RpcResponse;
    protected static internalErrorResponse(request: RpcRequest, message: string, error: any): RpcResponse;
    protected static randomString(): string;
}
declare class RequestHandlerDictionary {
    [index: string]: RpcHandler;
}
declare class NotificationHandlerDictionary {
    [index: string]: RpcNotificationHandler[];
}
declare class RpcCallback {
    constructor(resolve: (response: RpcResponse) => void, reject: (reason: any) => void);
    resolve: (response: RpcResponse) => void;
    reject: (reason: any) => void;
}
declare class CallbackDictionary {
    [index: string]: RpcCallback;
}
