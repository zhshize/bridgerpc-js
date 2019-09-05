import RpcError from './rpcError';
export default class RpcResponse {
    bridgerpc: string;
    id: string | null;
    result: any;
    error: RpcError | null;
    setResult(obj: any): void;
    getResult<T>(): T;
    encodeToMessagePack(): any;
}
