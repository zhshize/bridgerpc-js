import msgpack from 'msgpack-lite'

export default class RpcRequest {
  public bridgerpc: string = '1.0'
  public id: string | null = null
  public method: string = ''
  public data: any = null

  public setData(obj: any): void {
    this.data = obj
  }

  public getData<T>(): T {
    return this.data as T
  }

  public encode(): string {
    return JSON.stringify(this)
  }
}
