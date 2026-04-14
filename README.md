# IO Subject

A `Rxjs` `Subject` with different for "IO".
When work with io related tasks, such as MessageChannel, WebSocket, Webworker.port,
we send through `next` and receive messages through `subscribe`, while the input type and output type can be different.
The library wraps these io within a type safe interface, with the power of `Observables`

## Usage

### MessageChannel Example
```ts
import { fromMessagePort } from 'io-subject';

interface Peer1Send {}
interface Peer1Receive {}

const channel = new MessageChannel();

// for example, iframe.postMessage('connect', [channel.port2])

const peer1$ = fromMessagePort<Peer1Send, Peer1Receive>(channel.port1);

// inside iframe
const peer2$ = fromMessagePort<Peer1Receive, Peer1Send>(channel.port2);
```

### Simple RPC with MessagePorts

[example](./examples/simple-rpc.ts) for more details
```ts
interface SimpleRpc {
    foo(value: number): number;

    [key: string]: (value: any) => any;
}

const channel = new MessageChannel();

const peer1$ = fromMessagePort<SimpleRPCMessage, SimpleRPCMessage>(
    channel.port1,
);
const peer2$ = fromMessagePort<SimpleRPCMessage, SimpleRPCMessage>(
    channel.port2,
);

const rpc1 = new SimpleRpc<SimpleRpc, {}>(peer1$);
const rpc2 = new SimpleRpc<{}, SimpleRpc>(peer2$);
rpc2.register('foo', async (value) => {
    return value + 1;
});

const returnValue = await rpc1.invoke('foo', 1);
expect(returnValue).toBe(2);
```
