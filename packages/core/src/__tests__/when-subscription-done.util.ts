import type { Subscription } from 'rxjs'

/**
 * The returned Promise resolves when the +subscription+ is done.
 */
export function whenSubscriptionDone(subscription: Subscription): Promise<void> {
  return new Promise<void>((resolve) => subscription.add(resolve))
}
