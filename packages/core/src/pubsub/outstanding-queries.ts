/*
  @active-branch
*/
import { StreamID } from '@ceramicnetwork/streamid'

import {
    PriorityQueue,
    MinPriorityQueue,
    MaxPriorityQueue,
    ICompare,
    IGetCompareValue,
} from '@datastructures-js/priority-queue';
  
interface IQuery {
    timestamp: number;
    streamID: StreamID;
    queryId: string;
}

export class Query implements IQuery {
    timestamp: number;
    streamID: StreamID;
    queryId: string;
    constructor(t: number, sid: StreamID, qid: string){
      this.timestamp = t;
      this.streamID = sid;
      this.queryId = qid;
    }
}

  
const compareQueryTimestamps: ICompare<IQuery> = (a: IQuery, b: IQuery) => {
    
    if (a.timestamp > b.timestamp) {
      return 1;
    }

    if (a.timestamp < b.timestamp) {
      return -1;
    }

    return -1;
    
};

export class OutstandingQueries {
    readonly queryQueue: PriorityQueue<IQuery> = new PriorityQueue<IQuery>(compareQueryTimestamps);
    readonly queryMap: Map<string, Query> = new Map()
    private timeWindow: number = 1000;

    cleanUpExpiredQueries(){

        if ( this.queryQueue.size() > 0 ) {

          const topQuery = this.queryQueue.front()

          //var diffMs = (topQuery.timestamp - Date.now()); // milliseconds 
          var diffMs = (Date.now() - topQuery.timestamp); // milliseconds
          
          console.log("diffMs")
          console.log(diffMs)

          var differenceInMinutes = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
          
          console.log("differenceInMinutes");
          console.log(differenceInMinutes);

          if(differenceInMinutes > 0){
              //remove queryId key for top query
              this.queryMap.delete(topQuery.queryId);
              //dequeue top query
              const dequeuedQuery: Query = this.queryQueue.dequeue();
              //recurse?
              this.cleanUpExpiredQueries()
          }

        }else{
          console.log("No outstanding queries to clean up")
        }


    }

}
