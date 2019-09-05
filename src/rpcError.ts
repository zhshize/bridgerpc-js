import msgpack from 'msgpack-lite'

export default class RpcError {
  public code: number = 0
  public message: string = ''
  public data: any = null

  public setData(obj: any): void {
    this.data = msgpack.encode(obj)
  }

  public getData<T>(): T {
    return msgpack.decode(this.data) as T
  }
}
