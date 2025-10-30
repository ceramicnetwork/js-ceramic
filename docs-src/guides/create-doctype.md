# Ceramic Streams

In order to implement a new Ceramic StreamType there are a couple of interfaces which should be followed:

- **Stream**
  - This interface is used to implement an actual Stream subclass.
- **StreamHandler**
  - This interface is used to implement the state transition handler for the stream which will be executed by the Ceramic node.

There are other constructs which need to be used in order to create a `Stream`:
- **StreamStatic**
  - Decorator for the Stream implementation
- **StreamConstructor**
  - Describes the Stream constructor which needs to be implemented.

One interface worth noting is the `CeramicAPI` interface which lets the developer communicate with the Ceramic node in two ways:
- **directly**: the node is the process running on the same machine
- **indirectly**: the node is running somewhere else and the communication is done over the HTTP protocol.
	
# Stream

The [Stream](../../packages/common/src/stream.ts) interface extends the [Observable](https://rxjs.dev/guide/observable) interface which means that the developer can subscribe to events emitted from the Ceramic node (*more events will be defined in the future*).

The event based design is more or less sugar coating for the developer since all the operations can be implemented using the [CeramicApi](../../packages/common/src/ceramic-api.ts) interface. See [TileDocument](../../packages/stream-tile/src/tile-document.ts) or [ModelInstanceDocument](../../packages/stream-model-instance/src/model-instance-document.ts) for examples of streams included in the Ceramic node out-of-the-box.


# StreamHandler

The [StreamHandler](../../packages/common/src/stream.ts) interface is used for determining the next **state** of the document. The method worth noting is `applyCommit` which is used for that *state transition*.

The `StreamHandler` uses `CeramicApi` which is included in the [Context](../../packages/common/src/context.ts) instance.
