/*
  @active-branch
*/
import { StreamID } from '@ceramicnetwork/streamid'

export class Query {
    timestamp: number;
    streamID: StreamID;
    constructor(t: number, sid: StreamID){
      this.timestamp = t;
      this.streamID = sid;
    }
}
  
interface PriorityQueue<T> {
    insert(item: T, priority: number): void
    peek(): T
    pop(): T
    size(): number
    isEmpty(): boolean
}

  
interface HeapNode<T> {
    key: number
    value: T
}

// class PriorityQueue<T> {

// }
  
const priorityQueue = <T>(): PriorityQueue<T> => {
    let heap: HeapNode<T>[] = []
  
    const parent = (index: number) => Math.floor((index - 1) / 2)
    const left = (index: number) => 2 * index + 1
    const right = (index: number) =>  2 * index + 2
    const hasLeft = (index: number) => left(index) < heap.length
    const hasRight = (index: number) => right(index) < heap.length
  
    const swap = (a: number, b: number) => {
      const tmp = heap[a]
      heap[a] = heap[b]
      heap[b] = tmp
    }
    /** */
  
    return {
  
      isEmpty: () => heap.length == 0,
  
      // peek: () => heap.length == 0 ? null : root[0].value,
      peek: () => heap.length == 0 ? null : heap[0].value,
      
      size: () => heap.length,
  
      /** */
      insert: (item, prio) => {
        heap.push({key: prio, value: item})
  
        //start at the end of the tree
        let i = heap.length -1
        //iterate upwards, except parent
        while(i > 0) {
          const p = parent(i)
          if(heap[p].key < heap[i].key) break
          const tmp = heap[i]
          heap[i] = heap[p]
          heap[p] = tmp
          i = p
        }
      },
  
      /** */
      pop: () => {
        if(heap.length == 0) return null
        
        swap(0, heap.length - 1)
        const item = heap.pop()
  
        let current = 0
        while(hasLeft(current)) {
          let smallerChild = left(current)
          if(hasRight(current) && heap[right(current)].key < heap[left(current)].key) 
            smallerChild = right(current)
  
          if(heap[smallerChild].key > heap[current].key) break
  
          swap(current, smallerChild)
          current = smallerChild
        }
  
        return item.value
      }
    }
  }


  interface IQuery {
    timestamp: number;
    streamID: StreamID;
  }
  
  const compareCars: ICompare<IQuery> = (a: IQuery, b: IQuery) => {
    if (a.year > b.year) {
      return -1;
    }
    if (a.year < b.year) {
      // prioratize newest cars
      return 1;
    }
    // with least price
    return a.price < b.price ? -1 : 1;
  };

export class OutstandingQueries {
    // readonly queries: Map<string, Query> = new Map()
    // readonly queries: PriorityQueue<StreamID> = priorityQueue<StreamID>();
    readonly queries: PriorityQueue<string> = priorityQueue<string>();
}
