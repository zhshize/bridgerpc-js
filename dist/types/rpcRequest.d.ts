export default class RpcRequest {
    bridgerpc: string;
    id: string | null;
    method: string;
    data: any;
    setData(obj: any): void;
    getData<T>(): T;
    encodeToMessagePack(): any;
}
