import {DocState, Doctype} from "../doctype";
import {take, filter} from 'rxjs/operators'
import { BehaviorSubject } from "rxjs";
import { RunningStateLike } from '../running-state-like';
import { DocID } from '@ceramicnetwork/docid';

class FakeRunningState extends BehaviorSubject<DocState> implements RunningStateLike {
  readonly id: DocID;
  readonly state: DocState;

  constructor(value: DocState) {
    super(value);
    this.state = this.value;
    this.id = new DocID(this.state.doctype, this.state.log[0].cid);
  }
}

export class TestUtils {

    /**
     * Returns a Promise that resolves when there is an update to the given document's state.
     * @param doc
     */
    static registerChangeListener(doc: Doctype): Promise<DocState> {
        return doc.pipe(take(1)).toPromise()
    }

    /**
     * Given a document and a predicate that operates on the document state, continuously waits for
     * changes to the document until the predicate returns true.
     * @param doc
     * @param timeout - how long to wait for
     * @param predicate - function that takes the document's DocState as input and returns true when this function can stop waiting
     * @param onFailure - function called if we time out before the predicate becomes true
     */
    static async waitForState(doc: Doctype,
                              timeout: number,
                              predicate: (state: DocState) => boolean,
                              onFailure: () => void): Promise<void> {
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeout))
        const completionPromise = doc.pipe(filter(state => predicate(state))).toPromise()
        await Promise.race([timeoutPromise, completionPromise])
        if (!predicate(doc.state)) {
            onFailure()
        }
    }

    static runningState(state: DocState): RunningStateLike {
      return new FakeRunningState(state)
    }
}
