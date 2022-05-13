import { jest } from '@jest/globals'
import { OutstandingQueries, Query } from '../priority-queue.js'
import { StreamID } from '@ceramicnetwork/streamid'



const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)

const outstandingQueries: OutstandingQueries = new OutstandingQueries()



const carsQueue = new PriorityQueue<ICar>(compareCars);


describe('priority queue construction', () => {
  // jest.setTimeout(1000 * 30)

  // beforeEach(() => {
  //   // Clear all instances and calls to constructor and all methods:
  //   jest.mock('StreamID');
  //   StreamID.mockClear();
  // })
  
  test('TEST QUEUE - package', async () => {
    
    // jest.useFakeTimers()
    // var queue = new PriorityQueue<number>({ comparator: (a, b) => b - a });
    // print("Ts")
    // queue.queue(5);
    // queue.queue(3);
    // queue.queue(2);
    // var lowest = queue.dequeue(); // returns 5
    // console.log(lowest)
    expect(1).toEqual(1);
  })
  

})