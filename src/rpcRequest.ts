import msgpack from 'msgpack-lite'

export default class RpcRequest {
  public bridgerpc: string = '1.0'
  public id: string | null = null
  public method: string = ''
  public data: any = null

  public encodeToMessagePack(): any {
    return msgpack.encode({
      bridgerpc: this.bridgerpc,
      id: this.id,
      method: this.method,
      data: this.data
    })
  }
}
