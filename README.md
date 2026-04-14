# io-subject

A type-safe `Observable` abstraction for bidirectional I/O.

`io-subject` wraps communication channels like `MessagePort`, `WebSocket`, or `Worker` ports into an RxJS-compatible interface where the **send** type and **receive** type can differ. It combines the power of `Observable` (for incoming messages) with `Observer` (for outgoing messages) in a single, clean API.

## Features

- **Type-safe bidirectional I/O** — Send and receive different message shapes with full TypeScript inference.
- **RxJS-native** — Implements `Observable<Receive>` and `Observer<Send>`; works seamlessly with RxJS operators.
- **Built-in `MessagePort` support** — Easily bridge `MessageChannel`, `WebWorker`, or any `MessagePort`-like interface.
- **Transferable support** — Send `Transferable` objects (e.g. `ArrayBuffer`, `OffscreenCanvas`) alongside messages.
- **Lightweight** — Zero runtime dependencies except `rxjs` (peer dependency).

## Installation

```bash
npm install io-subject
```

```bash
pnpm add io-subject
```

```bash
yarn add io-subject
```

> `rxjs` `^7.8.2` is required as a peer dependency.

## Usage

### MessageChannel

```ts
import { fromMessagePort } from 'io-subject';

interface Peer1Send {
  hello: string;
}

interface Peer1Receive {
  world: string;
}

const channel = new MessageChannel();

// iframe.contentWindow.postMessage('connect', '*', channel.port2);

const peer1$ = fromMessagePort<Peer1Send, Peer1Receive>(channel.port1);
const peer2$ = fromMessagePort<Peer1Receive, Peer1Send>(channel.port2);

peer1$.subscribe((msg) => {
  console.log('peer1 received:', msg); // { world: 'from peer2' }
});

peer2$.subscribe((msg) => {
  console.log('peer2 received:', msg); // { hello: 'from peer1' }
});

peer1$.next({ hello: 'from peer1' });
peer2$.next({ world: 'from peer2' });
```

### Transferables

```ts
const buffer = new ArrayBuffer(1024);

// Send a message together with Transferable objects
peer1$.next([{ hello: 'with buffer' }, [buffer]]);
```

### Simple RPC over MessagePorts

See [`examples/simple-rpc.ts`](./examples/simple-rpc.ts) for the full implementation.

```ts
import { fromMessagePort } from 'io-subject';
import type { IOSubject } from 'io-subject';

interface SimpleRpc {
  foo(value: number): number;
  [key: string]: (value: any) => any;
}

const channel = new MessageChannel();

const peer1$ = fromMessagePort<SimpleRPCMessage, SimpleRPCMessage>(channel.port1);
const peer2$ = fromMessagePort<SimpleRPCMessage, SimpleRPCMessage>(channel.port2);

// Imagine SimpleRPC is a small helper built on top of IOSubject
const rpc1 = new SimpleRpc<SimpleRpc, {}>(peer1$);
const rpc2 = new SimpleRpc<{}, SimpleRpc>(peer2$);

rpc2.register('foo', async (value) => value + 1);

const result = await rpc1.invoke('foo', 1);
console.log(result); // 2
```

