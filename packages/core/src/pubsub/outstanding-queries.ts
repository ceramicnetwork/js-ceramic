import { StreamID } from '@ceramicnetwork/streamid'
import { PriorityQueue, ICompare } from '@datastructures-js/priority-queue'
import { DiagnosticsLogger, LogLevel } from '@ceramicnetwork/common'
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
 * Outstanding Queries Abstraction holding the query map, and queue.
 * This class contains the Queue & Map representing the outstanding queries being expected from the network
 */
export class OutstandingQueries {
  readonly queryQueue: PriorityQueue<IQuery> = new PriorityQueue<IQuery>(compareQueryTimestamps)
  readonly queryMap: Map<string, Query> = new Map()
  readonly _logger: DiagnosticsLogger = new DiagnosticsLogger(LogLevel.important, false)
  //set the time in minutes we want to allow outstanding requests to be considered
  private _minutesThreshold = 1

  add(id: string, query: Query): boolean {
    //enforce no duplicate outstanding queries
    if (this.queryMap.get(id) != undefined) {
      return false
    } else {
      // add to map
      this.queryMap.set(id, query)
      // add to queue
      this.queryQueue.enqueue(query)
      return true
    }
  }

  remove(topQuery: Query): boolean {
    try {
      //remove queryId key for top query
      this.queryMap.delete(topQuery.queryID)
      //dequeue top query
      this.queryQueue.dequeue()
      return true
    } catch (e) {
      const errorMessage = `Error in OutstandingQueries.remove(), ${e.message}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * Event-driven method to clean up outdates outstanding queries
   * @param
   * @public
   */
  cleanUpExpiredQueries() {
    if (this.queryQueue.size() > 0) {
      const topQuery: Query = this.queryQueue.front()
      const diffMs = Date.now() - topQuery.timestamp // milliseconds
      const differenceInMinutes = Math.round(((diffMs % 86400000) % 3600000) / 60000) // minutes
      if (differenceInMinutes > this._minutesThreshold) {
        try {
          this.remove(topQuery)
          //recursively check if the most prioritized query can be cleaned
          this.cleanUpExpiredQueries()
        } catch (e) {
          const errorMessage = `Error in OutstandingQueries.cleanUpExpiredQueries(), ${e.message}`
          this._logger.err(errorMessage)
          throw new Error(errorMessage)
        }
      }
    }
  }
}
