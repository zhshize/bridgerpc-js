export default class RpcError {
    code: number;
    message: string;
    data: any;
    setData(obj: any): void;
    getData<T>(): T;
}
