import RpcError from './rpcError'
import msgpack from 'msgpack-lite'

export default class RpcResponse {
  public bridgerpc: string = '1.0'
  public id: string | null = null
  public result: any = null
  public error: RpcError | null = null

  public setResult(obj: any): void {
    this.result = obj
  }

  public getResult<T>(): T {
    return this.result as T
  }

  public encode(): any {
    return JSON.stringify(this)
  }
}
