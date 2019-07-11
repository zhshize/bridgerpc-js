import RpcError from './rpcError'
import msgpack from 'msgpack-lite'

export default class RpcResponse {
  public bridgerpc: string = '1.0'
  public id: string | null = null
  public result: any = null
  public error: RpcError | null = null

  public encodeToMessagePack(): any {
    const r: any = {
      bridgerpc: this.bridgerpc,
      id: this.id,
      result: this.result,
      error: null
    }
    if (this.error !== null || this.error !== undefined) {
      const error = this.error as RpcError
      r.error = {
        code: error.code,
        message: error.message,
        data: error.data
      }
    }
    return msgpack.encode(r)
  }
}
