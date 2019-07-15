# bridgerpc-js
Bridge RPC client for browser and nodejs.  Typescript supported.

## Server-side implement
ASP.Net Core (C#) (server & client): [zhshize/BridgeRpcAspNetCore](https://github.com/zhshize/BridgeRpcAspNetCore)

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

## Node.js
Install the package: 
```
npm i bridgerpc
```
import:
```ecmascript 6
import BridgeRpc from 'bridgerpc';
```

## Usage
```ecmascript 6
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
