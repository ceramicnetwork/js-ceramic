# Ceramic StreamID
![ceramicnetwork](https://circleci.com/gh/ceramicnetwork/js-ceramic.svg?style=shield)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

> This package contains Ceramic StreamID and CommitID implementation.

Implements Ceramic streamIDs as defined in ceramic spec and [CIP](https://github.com/ceramicnetwork/CIP/blob/master/CIPs/CIP-59/CIP-59.md),
represented as StreamID and CommitID for API clarity.

StreamID represents a reference to a stream as a whole, thus does not contain commit information.

CommitID represents a reference to a particular commit in the stream evolution.

```
<streamid> ::= <multibase-prefix><multicodec-streamid><type><genesis-cid-bytes>
```

or including StreamID commit

```
<streamid> ::= <multibase-prefix><multicodec-streamid><type><genesis-cid-bytes><commit-cid-bytes>
```

## Getting started

### Installation

```
$ npm install @ceramicnetwork/streamid
```

### Usage

See the [ceramic developer site](https://developers.ceramic.network/) for more details about how to use this package.


To reference a stream as a whole, use `StreamID`. You can create an instance from the parts. stream type string or integer and CID instance or string are required.

```typescript
import { StreamID } from '@ceramicnetwork/streamid';

const streamid = new StreamID('tile', 'bagcqcerakszw2vsov...');

streamid.type; // 0
streamid.typeName; // 'tile'
streamid.bytes; // Uint8Array(41) [ 206,   1,   0,   0,   1, 133,   1, ...]
streamid.cid; // CID('bagcqcerakszw2vsov...')
streamid.toString();
//k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws
streamid.toUrl();
//ceramic://k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws
```

You can also create StreamID instance from StreamID string or bytes.

```typescript
const streamid = StreamID.fromString('k3y52l7mkcvtg023bt9txe...');
```

```typescript
const streamid = StreamID.fromBytes(Uint8Array(41) [ 206,   1,   0,   0,   1, 133,   1, ...])
```

To reference particular point in a stream evolution, use `CommitID`.
In addition to stream type (string or integer) and genesis reference (CID instance or string),
one is expected to provide a reference to commit (CID instance or string). If you pass `0` or `'0'` (as string), `null`
or just omit the value, this would reference a genesis commit.

```typescript
import { CommitID } from '@ceramicnetwork/streamid';

const commitId = new CommitID('tile', 'bagcqcerakszw2vsov...', 'bagcqcerakszw2vsov...');

commitId.type; // 0
commitId.typeName; // 'tile'
commitId.bytes; // Uint8Array(41) [ 206,   1,   0,   0,   1, 133,   1, ...]
commitId.cid; // CID('bagcqcerakszw2vsov...')
commitId.commit; // CID('bagcqcerakszw2vsov...')

commitId.toString();
// k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws
commitId.toUrl();
// ceramic://k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws?version=k3y52l7mkcvt...
```

To reference specific CID from `StreamID` or to change commit reference in `CommitID`, use `atCommit` method:

```typescript
commitId.atCommit('bagcqcerakszw2vsov...'); // #=> new CommitID for the same stream
streamId.atCommit('bagcqcerakszw2vsov...'); // #=> new CommitID for the same stream
```

`CommitID` (`StreamID` for compatibility also) can get you base `StreamID` via `#baseID`:

```typescript
commitId.baseID; // #=> StreamID reference to the stream
streamId.baseID; // #=> new StreamID reference to the same stream, effectively a shallow clone.
```

To parse an unknown input into proper CommitID or StreamID, you could use `streamRef.from`:
```typescript
import { streamRef } from '@ceramicnetwork/streamid';
const input = 'bagcqcerakszw2vsov...' // could be instance of Uint8Array, StreamID, CommitID either; or in URL form
const streamIdOrCommitId = streamRef.from(input) // throws if can not properly parse it into CommitID or StreamID
```

## Development

Run tests:

```shell
npm test
```

Run linter:

```shell
npm run lint
```

## Contributing

We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/ceramic/blob/main/SPECIFICATION.md) for details of how the protocol works.

## License

MIT or Apache-2.0
