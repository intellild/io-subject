import { Subject } from 'rxjs';
import { IOSubject } from './io-subject.ts';

export function fromMessagePort<Send, Receive>(port: MessagePort) {
  const message$ = new Subject<Receive>();
  port.onmessage = (event) => {
    message$.next(event.data);
  };

  return new IOSubject<Send | [Send, Transferable[]], Receive>(
    message$,
    (data) => {
      if (Array.isArray(data) && data.length === 2) {
        port.postMessage(data[0], data[1]);
      } else {
        port.postMessage(data);
      }
    },
  );
}
