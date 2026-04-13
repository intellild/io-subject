import { expect, it } from '@rstest/core';
import { firstValueFrom, Subject } from 'rxjs';
import type { SimpleRPCMessage } from '../examples/simple-rpc';
import SimpleRpc from '../examples/simple-rpc';
import { IOSubject } from '../src';
import { fromMessagePort } from '../src/message-port';

it('test io subject', async () => {
  const subject1$ = new Subject();
  const subject2$ = new Subject();

  const peer1$ = new IOSubject(subject1$, (value) => subject2$.next(value));
  const peer2$ = new IOSubject(subject2$, (value) => subject1$.next(value));

  const receive1 = firstValueFrom(peer1$);
  const receive2 = firstValueFrom(peer2$);

  peer1$.next('from 1');
  peer2$.next('from 2');

  expect(await receive1).toBe('from 2');
  expect(await receive2).toBe('from 1');
});

it('test message channel', async () => {
  const channel = new MessageChannel();

  const peer1$ = fromMessagePort(channel.port1);
  const peer2$ = fromMessagePort(channel.port2);

  const receive1 = firstValueFrom(peer1$);
  const receive2 = firstValueFrom(peer2$);

  peer1$.next('from 1');
  peer2$.next('from 2');

  expect(await receive1).toBe('from 2');
  expect(await receive2).toBe('from 1');
});

it('test simple rpc', async () => {
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
});
