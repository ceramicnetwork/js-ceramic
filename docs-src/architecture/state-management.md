# State Management
Last updated: 2021-04-07
## Overview

We have chosen to separate in-memory document cache from document processing. The in-memory document cache maintains a list of document states as LRU map. There is a limit on how many documents it stores at the same time. If the limit is achieved, the oldest document gets evicted.

Document processing is organised as a per-document task queue. It maintains sequential order of tasks on the same document. At any time only single task is executed per document. It is then task's responsibility to acquire state the way it considers appropriate.

### Dynamic View

Disposition:

- Document cache limit is set to 3. Three documents fill the cache. (Orange indicates documents in cache)
- LRU algorithm considers document 1 as the oldest one.
- Three tasks per document wait for execution (`α`, `β`, `γ`)
- Another task is requested from the outside for the fourth document.
- Task 1α is currently running. The next for execution is 4α.

Let us see what happens when 4α starts. As per Node.js execution model, processing is event-based. After IO/event is emitted, Node.js executes all the code non-interrupted until it stumbles upon wait for the next IO/event. Ceramic tasks are heavily IO based, so it would be fair to assume here, that at some point task 1α starts to wait for IO, for example, for IPFS retrieval. At that point Node.js starts handing the next event which in our case is task 4α.

![Execution Queue](media://state-management/execution-queue.png)

When task 4α starts, the cache exceeds the limit, so it evicts the oldest document 1. Yet, it does not pause the task 1α. It still runs. This rises two questions.

Q1: What happens when 1β needs to run?

With separation of document cache from document processing, we must ensure that task operates on the most recent state. When the task starts, we try to load the state from memory, from state store, or from network - whatever works for the task at hand.

Q2: How memory grows based on this behaviour?

When 4α runs, and the document cache contains 3 entries (2,3,4), in total we have 4 document states, since task 1α has not released document 1 state to garbage collector. Let us call this a _spawned_ task - the one that operates on a document that is no longer in cache. When a new task appears for a new document, we will end up with one more spawned task with one more instance of the document state residing in memory. This way memory grows based on how much concurrent operations we have. To bound this growth, we added a configuration parameter `concurrentTasksLimit`. This is a maximum number of concurrently running tasks for all the documents we have. When this limit is reached, the next task has to wait till one of the tasks is done.

One could consider `concurrentTasksLimit` as a ceiling for another vector of memory growh, compared to the cache limit. This vector is related to bursts of document processing.

### Subscriptions and two parts of cache

One of the features is ability to subscribe to document changes. When a consumer subscribes to doctype updates, the updates should flow regardless of the pinning status. To enable that in the presence of the cache eviction, we mandate that a subscribed document is not evicted. For this, we internally split the cache into two buckets: *volatile*, and *durable*. Volatile is a vanilla LRU map, with cache eviction. Durable bucket maintains list of subscribed documents. When document is subscribed, we put the state in durable bucket. When unsubscribed, it moves to volatile bucket. Interesting question here is what state to put to the durable bucket. We have few scenarios here:

- document is in memory ⇒ we use in-memory state
- document is pinned but not in memory ⇒ we load from the state store,
- document is not pinned and not in memory ⇒ we use the state from Doctype instance that requested the subscription.

So, at any time, we are sure we start subscription with the latest available state.

### Doctype and State

As part of state refactor effort we have decided to maintain a certain semantics for how Doctype updates state. After created, Doctype maintains just the state it was initialized with. It only updates state after being changed or when subscribed. In the latter case, the state gets continuously updated. If looked from the inside, one could notice a Doctype relies on `RunningStateLike` instance to maintain the state. One could see `RunningStateLike` as either an Observable of DocState with an access to the current value, or as BehaviorSubject with some additional getters. The reason for this, is we want to avoid explicit memory management in Doctype instances. Any way `RunningStateLike` is a kind of Subject, that has to be explicitly closed, and as one could see from sections above managing document state life cycle is complicated. Ceramic instance maintains that closing behaviour, and that frees a developer from closing every Doctype manually.

![Relationship between doctype and state](media://state-management/doctype-and-state.png)

## Components

The main concept behind component structure is running document. Let's call a *running document* (or _running state_) an entity that has its state in memory, as opposed to *sleeping document* that is stored in a persistent storage. We want to make sure that there is always at max one instance of document running. We want to provide same access pattern for a document be it running or sleeping, or even if it is to be loaded from network.

### RunningState

We start our construction with a concept of Running state. Running state is implemented as class `RunningState` based on BehaviorSubject. For the people unfamiliar with rxjs, it is like a [reference](https://en.wikipedia.org/wiki/Reference_(computer_science)) to a value, document state in our case, that one could update or subscribe to for updates.

Repository shepherds a list of document states, be they running or sleeping. In theory, one could suggest a design that maintains a list of raw state values. With our design based on BehaviorSubject and rxjs, one have a sort of referential transparency. An instance of `RunningState` could be passed around freely always delievering the latest value. With a theoretical alternative design, we would have to care about possible case of stale values, non-garbage-collected event emitters, and this creates too much unnecessary complexity.

`RunningState` implements interface `RunningStateLike`. It is beneficial for us to have the same interface across few semantically different classes. While `RunningState` represents, sorry for a tautology, a _running_ state, in some cases we want to provide a snapshot of a document state at a certain time or commit. This is achieved in `SnapshotState`. It can not be updated.

We also have `StateLink`  implementing `RunningStateLike`. Its initial state is set on construction time. It can be updated, and update only changes local state. It can be subscribed to, and this actually triggers subscription to another upstream Observable (returned from `Repository#updates$` in production case). This way we achieve behavior outlined in Subscriptions section, while maintaining single responsibility for the entity. `StateLink` maintains state local to Doctype. The upstream observable handles Repository-specific logic.

![Running State Hierarchy](media://state-management/running-state-hierarchy.png)

### Repository

Repository is the entrypoint for documents. It maintains `StateCache` as a cache of running documents (see below), and two queues. `loadingQ` serializes loading requests per document. At any time, there is only one loading process per docId. `executionQ` serializes document processing tasks. At any time, there is only one task running per document. Additionally, `executionQ` limits how many tasks are allowed to run concurrently in total.

Two most interesting methods here are `load` and `updates$`. `load` tries to sequentially (per DocId) load a document state: from memory, from state store, from network. `update$` is called when one subscribes to a doctype updates. `updates$` returns a new Observable, that on subscription loads a running state (from memory, from state store, or from passed state), puts it into durable part of the cache, and subscribes a downstream subscriber to the running state updates. On unsubscription, it removes the running state from durable part of the cache if there are no more subscriptions still present. If there are still subscribers, the running state still remains in the durable part of the cache.

StateCache abstracts over collection of currently running states. It has two buckets: `volatile` - for LRU map and `durable` - for manually-managed map. `StateCache.get` returns a state regardless of its volatile/durable state. One could avoid a state being evicted by moving it to durable bucket via `StateCache.endure` . `StateCache.free` does the reverse. Important thing here is semantics of `StateCache.set` operation. It not only sets the value in volatile bucket. It also updates the value in durable bucket, if the bucket contained a value under the same key previosly. We can not set the value there blindly, as it can never be removed.

### StateManager

StateManager controls the way state changes. We can split available methods roughly in two buckets:

- time travel - `rewind` and `atTime` methods - return snapshots of state at commit and at point respectively,
- actions:
  - `syncGenesis` handles document options: requests anchors, requests new state from network, publishes the tip,
  - `update` handles update from IPFS Pubsub,
  - `applyCommit` applies commit to a document.

## Where to put new code

When adding new featurs, make sure the code you put conforms to the responsibility theme of a component:

- Repository is about accessing the state,
- loadingQ inside Repository is responsible for concurrency control of loading operations,
- executionQ inside Repository (and ExecutionQueue class) is responsible for concurrency control of document processing,
- StateManager is responsible for document state changes,
- RunningStateLike and its descendants are responsible for state representation as a feed of state updates.
