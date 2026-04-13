import type { Observer } from 'rxjs';
import { Observable, Subject, Subscription } from 'rxjs';

export interface IOSubjectLike<Send, Receive>
  extends Observable<Receive>,
    Observer<Send> {}

export class IOSubject<Send, Receive>
  extends Observable<Receive>
  implements IOSubjectLike<Send, Receive>
{
  protected readonly subscription = new Subscription();
  protected readonly send$ = new Subject<Send>();

  constructor(
    receive$: Observable<Receive>,
    observerOrNext: Partial<Observer<Send>> | ((value: Send) => void),
  ) {
    super((subscriber) => {
      return receive$.subscribe(subscriber);
    });
    this.subscription.add(this.send$.subscribe(observerOrNext));
  }

  public next(value: Send): void {
    this.send$.next(value);
  }

  public error(err: unknown): void {
    this.send$.error(err);
  }

  public complete(): void {
    this.send$.complete();
  }

  public unsubscribe() {
    this.subscription.unsubscribe();
    this.send$.unsubscribe();
  }
}
