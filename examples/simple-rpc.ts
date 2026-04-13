import { Subscription } from 'rxjs';
import type { IOSubject } from '../src';

export interface SimpleRPCMessage {
  method: string;
  requestId: number;
  arg?: unknown;
  returnValue?: unknown;
  error?: unknown;
}

export interface SimpleRPCRequestOptions {
  transfer: Transferable[];
}

class SimpleRPC<
  Consume extends Record<string, (arg: any) => any>,
  Provide extends Record<string, (arg: any) => any>,
> {
  protected requestId = 0;
  protected readonly requestMap = new Map<number, PromiseWithResolvers<any>>();
  protected readonly subscription = new Subscription();
  protected readonly registry = new Map<
    keyof Provide,
    (arg: any) => Promise<any>
  >();

  constructor(
    protected readonly io$: IOSubject<
      SimpleRPCMessage | [SimpleRPCMessage, Transferable[]],
      SimpleRPCMessage
    >,
  ) {
    this.subscription.add(
      io$.subscribe((message) => {
        if (message.arg) {
          const { method, requestId } = message;
          const handler = this.registry.get(message.method);
          if (handler) {
            handler(message.arg).then(
              (returnValue) => {
                this.io$.next({
                  method,
                  requestId,
                  returnValue,
                });
              },
              (error) => {
                this.io$.next({
                  method,
                  requestId,
                  error: {
                    stack: error?.stack,
                    message: error?.message,
                  },
                });
              },
            );
          }
        } else if (message.returnValue) {
          const withResolvers = this.requestMap.get(message.requestId);
          if (withResolvers) {
            withResolvers.resolve(message.returnValue);
          }
        } else if (message.error) {
          const withResolvers = this.requestMap.get(message.requestId);
          if (withResolvers) {
            withResolvers.reject(message.error);
          }
        }
      }),
    );
  }

  public invoke<Method extends keyof Consume>(
    method: Method,
    arg: Parameters<Consume[Method]>[0],
    options?: SimpleRPCRequestOptions,
  ): Promise<ReturnType<Consume[Method]>> {
    const withResolvers = Promise.withResolvers<ReturnType<Consume[Method]>>();
    const requestId = this.requestId++;
    const request: SimpleRPCMessage = {
      method: method as string,
      requestId,
      arg,
    };
    this.requestMap.set(requestId, withResolvers);
    if (options?.transfer) {
      this.io$.next([request, options.transfer]);
    } else {
      this.io$.next(request);
    }
    return withResolvers.promise;
  }

  public register<Method extends keyof Provide>(
    method: Method,
    handler: (
      arg: Parameters<Provide[Method]>[0],
    ) => Promise<ReturnType<Provide[Method]>>,
  ): this {
    this.registry.set(method, handler);
    return this;
  }

  public unsubscribe(): void {
    this.subscription.unsubscribe();
  }
}

export default SimpleRPC;
