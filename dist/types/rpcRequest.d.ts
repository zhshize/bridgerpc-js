export default class RpcRequest {
    bridgerpc: string;
    id: string | null;
    method: string;
    data: any;
    encodeToMessagePack(): any;
}
