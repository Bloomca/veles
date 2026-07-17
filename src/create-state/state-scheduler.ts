import { MinHeap } from "./min-heap";

type PendingNotification = {
  key: object;
  rank: number;
  value: any;
  previousValue: any;
  notify: (value: any, previousValue: any) => void;
};

/**
 * Coordinates notifications produced by one synchronous state transaction.
 *
 * A subscriber can synchronously update another state. That nested update adds
 * its notifications to this same scheduler, allowing an older notification for
 * the same state to be replaced before it is delivered.
 */
class StateScheduler {
  private _notifications = new MinHeap<PendingNotification>(
    (notification1, notification2) => notification1.rank - notification2.rank,
  );
  private _notificationsByKey = new Map<object, PendingNotification>();

  scheduleNotification(notification: PendingNotification) {
    const existingNotification = this._notificationsByKey.get(notification.key);

    if (existingNotification) {
      // Keep the previous value from the first change in this transaction, but
      // deliver only the latest value produced before notification.
      existingNotification.value = notification.value;
      return;
    }

    this._notificationsByKey.set(notification.key, notification);
    this._notifications.push(notification);
  }

  deliverNotifications() {
    while (this._notifications.size > 0) {
      const notification = this._notifications.pop()!;

      // A notification can only be replaced in place today. Keeping this check
      // makes stale heap entries safe if cancellation/replacement is added later.
      if (this._notificationsByKey.get(notification.key) !== notification) {
        continue;
      }

      this._notificationsByKey.delete(notification.key);
      notification.notify(notification.value, notification.previousValue);
    }
  }
}

let activeScheduler: StateScheduler | undefined;

/**
 * Top-level state updates own the scheduler and synchronously drain it. Updates
 * made by subscribers reuse the active scheduler, so they cannot deliver a
 * nested notification batch ahead of notifications already waiting to run.
 */
function runWithStateScheduler(runUpdate: (scheduler: StateScheduler) => void) {
  if (activeScheduler) {
    runUpdate(activeScheduler);
    return;
  }

  const scheduler = new StateScheduler();
  activeScheduler = scheduler;

  try {
    runUpdate(scheduler);
    scheduler.deliverNotifications();
  } finally {
    activeScheduler = undefined;
  }
}

export { StateScheduler, runWithStateScheduler };
