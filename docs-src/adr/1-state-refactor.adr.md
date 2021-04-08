# State Refactor

* Status: accepted
* Deciders: Sergey Ukustov, Spencer Brody, Joel Thorstensson
* Date: 2021-03-31

## Context and Problem Statement

We want a single Ceramic node to maintain state and receive updates for a large number of documents at the same time, so that a large number of documents can be pinned by a single node without memory usage growing linearly.

While doing so we want to maintain a certain update semantics on doctypes. The goal is a doctype maintains a separate copy of the state. If it subscribes though, the state is continuously updated, no matter if the document is pinned or not.

## Decision Drivers

* Memory of a node grows linearly with the number of documents. It is unacceptable if we want to run a node in production. We want to limit memory growth by a constant ceiling.
* Components communicate asynchronously via JS events. While it is standard in Node.js environment, we can not use the same mechanism on browser without external dependencies. We would like to have most of our code isomorphic.
* One could not easily compose event-driven components. Code gets less comprehensible with every component. We want to have rxjs as a solution for the composability problem.

## Considered Options

In any case, we maintain a LRU cache of documents to achieve a goal of constant memory consumption. This constrains us in a sense that a document in the cache is ephemeral. It can be evicted at any time. The big decision is what concurrency model to adopt for document operations so that it plays nicely with cache eviction.

Document operations can be invoked from few places. One is external API commands: HTTP endpoints of a Ceramic node. Another is JS API: calling in-process Ceramic node. The third one is IPFS pubsub. Also, there is anchoring mechanism, that is a continuous polling of the anchor service. These could be started concurrently.

We want to maintain document state consistency in the presence of concurrent operations. Under no circumstances two operations are allowed to change the same document at the same time.

* Option 1: On cache eviction wait for the operations on a document to finish.

  With the LRU semantics, it means calling asynchronous function on an evicted document (`await document.close`). Since we do not want to end up with having two documents running in memory at the same time, cache eviction effectively blocks further documents to be processed until the evicted one is finished.

  Pro:

  - simple concurrency model

  Contra:

  - document processing is blocked till the oldest document finishes

* Option 2: Separate operation on a document from its in-memory lifecycle.

  The separation is achieved by introducing an execution queue. The execution queue ensures operations on the same docId are executed sequentially. Before an operation is started, the queue loads a document in memory. When a document is loaded, the oldest document gets evicted. This way we maintain a limited number of documents running in memory while not caring about document processing. We further limit this vector of memory growth by queuing the processing tasks.

  Pro:

  - more controllable concurrency model,
  - non-blocking cache eviction and new document processing,

  Contra:

  - more parameters to control concurrency,
  - more complex flow.

## Decision Outcome

We chosen option 2. It allows us to limit memory growth by constant factor, and enables more tight control over different vectors of memory growth.

### Positive Consequences

- We have configurable number of documents running in memory (`CeramicConfig.docCacheLimit`) - ceiling on memory growth when processing load is low.
- We have configurable number of concurrent document-processing tasks - ceiling on memory growth when processing load is high.
- It unlocks an ability to limit a number of concurrently loading documents in future.
- Event flows are composable, which allows us to have well-defined semantics of Doctype state management with regards to subscriptions.

### Negative Consequences

- The data flow is more complex than before.
- Ambient memory consumption, that is without any documents loaded, is slightly (~30%: 160MiB vs 120MiB) higher than before.
