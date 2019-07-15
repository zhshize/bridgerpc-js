# bridgerpc-js

Bridge RPC client for browser and nodejs.  Typescript supported.
[Documentation](https://zhshize.github.io/bridgerpc-js/)

## Server-side implement

ASP.Net Core (C#) (server & client): [zhshize/BridgeRpcAspNetCore](https://github.com/zhshize/BridgeRpcAspNetCore)

You can create a server-side implement by yourself, see 
[Node.js server-side implement](#nodejs-server-side-implement).

## Browser

bridgerpc-js needs [msgpack-lite](https://www.npmjs.com/package/msgpack-lite).
You can broserify it or use CDN: 

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/msgpack-lite/0.1.26/msgpack.min.js" integrity="sha256-xnDLLYKxKFwLEmQK1SkZ9I7IwmjdeURGtXUk/0WnTRo=" crossorigin="anonymous"></script>
```

And then, include bridgerpc: 

```html
<script src="path/to/bridgerpc.umd.js"></script>
```

BridgeRpc UMD module is exposed on the global variable `bridgerpc`, contains 
`RpcResonse`, `RpcRequest`, `RpcError`, and `default` actually is `BridgeRpc`.
If you want to expose all prototype, the code below is useful: 

```javascript
const RpcResonse = bridgerpc.RpcResonse;
const RpcRequest = bridgerpc.RpcRequest;
const RpcError = bridgerpc.RpcError;
const BridgeRpc = bridgerpc.default;
```

## Node.js

Install the package: 

```
npm i bridgerpc
```

import:

```javascript
import BridgeRpc from 'bridgerpc';
```

## Usage

```javascript
// Initialize a client. but not connect until calling connect()
var client = new BridgeRpc("ws://localhost/");

// Registering a request handler for method 'echo'
client.onRequest("echo", request => {
    return request.data;
    // If you didn't return a RpcResponse object, the return value will be set as 
    // result of a new RpcRsponse object.
    // Or you can return a RpcResponse object:
    // var r = new RpcResponse();
    // r.result = request.data;
    // return r;
});

// Registering a notification handler for method 'notify'
client.onNotify("notfiy", request => {
    console.log(request.data);
});

// Some staff when connected
client.onConnect(async () => {
  
    // Requesting server-side
    const res = await client.request("greet", "Joe");
    console.log(res.result);
});
```

## Nodejs server-side implement

I suggest you using Typescript to obtain more flexibility of customizing BridgeRpc.

```typescript
import BridgeRpc from 'bridgeRpc'

class RpcConnection extends BridgeRpc {
  connect() {
    // Hack HERE!  Replace it to your WebSocket object (by adding a setter) from 
    // server (i.e. express.js).  The object you passed must be suitable for
    // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
    this._rawSocket = new WebSocket()

    this._rawSocket.binaryType = 'arraybuffer'
    this._rawSocket.onmessage = this.onMessage.bind(this)
  }
}
```
