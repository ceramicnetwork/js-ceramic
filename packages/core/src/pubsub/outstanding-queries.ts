import { StreamID } from '@ceramicnetwork/streamid'
import { PriorityQueue, ICompare } from '@datastructures-js/priority-queue'
/**
 * Query Interface
 */
interface IQuery {
  timestamp: number
  streamID: StreamID
  queryID: string
}

/**
 * Query abstraction with a timestamp, streamID, and queryID
 */
export class Query implements IQuery {
  constructor(readonly timestamp: number, readonly streamID: StreamID, readonly queryID: string) {}
}

/**
 * Comparator for Query Set
 * @param a: implements IQuery (LHS)
 * @param b: implements IQuery (RHS)
 * @public
 */
const compareQueryTimestamps: ICompare<IQuery> = (a: IQuery, b: IQuery) => {
  //if LHS timestamp is greater than RHS, return RHS (right is earlier)
  if (a.timestamp > b.timestamp) {
    return 1
  }

  //if LHS timestamp is less than RHS, return LHS (left is earlier)
  if (a.timestamp < b.timestamp) {
    return -1
  }

  //otherwise they are equal, return RHS
  return -1
}

/**
 * OutstandingQueries tracks a set of all query messages that have been
 * sent to pubsub, for which we are still waiting on a response pubsub
 * message. It also takes care of garbage collecting old queries that
 * have been outstanding for more than 1 minute.
 */
export class OutstandingQueries {
  readonly queryQueue: PriorityQueue<IQuery> = new PriorityQueue<IQuery>(compareQueryTimestamps)
  readonly queryMap: Map<string, Query> = new Map()
  //set the time in minutes we want to allow outstanding requests to be considered
  private _minutesThreshold = 1

  add(id: string, query: Query): void {
    //enforce no duplicate outstanding queries
    this._cleanUpExpiredQueries()
    if (this.queryMap.get(id) == undefined) {
      // add to map
      this.queryMap.set(id, query)
      // add to queue
      this.queryQueue.enqueue(query)
    } else {
      //replace query
      this.remove(query)
      this.queryMap.set(id, query)
      this.queryQueue.enqueue(query)
    }
  }

  private remove(topQuery: Query): void {
    //remove queryId key for top query
    this.queryMap.delete(topQuery.queryID)
    //dequeue top query
    this.queryQueue.dequeue()
  }

  private _isExpired(query: Query): boolean {
    const diffMs = Date.now() - query?.timestamp // milliseconds
    const differenceInMinutes = Math.floor(diffMs / 1000 / 60)
    return differenceInMinutes > this._minutesThreshold
  }

  /**
   * Event-driven method to clean up outdated outstanding queries
   * @param
   * @private
   */
  private _cleanUpExpiredQueries(): void {
    while (this._isExpired(this.queryQueue.front())) {
      this.remove(this.queryQueue.front())
    }
  }
}
