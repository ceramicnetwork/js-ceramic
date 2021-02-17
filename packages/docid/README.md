# Ceramic DocId

> This package contains Ceramic DocID and CommitID implementation.

Implements Ceramic DocIDs as defined in ceramic spec and [CIP](https://github.com/ceramicnetwork/CIP/blob/master/CIPs/CIP-59/CIP-59.md),
represented as DocID and CommitID for API clarity.

DocID represents a reference to a document as a whole, thus does not contain commit information.

CommitID represents a reference to a particular commit in the document evolution.

```
<docid> ::= <multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes>
```

or including DocID commit

```
<docid> ::= <multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><commit-cid-bytes>
```

## Getting started

### Installation

```
$ npm install @ceramicnetwork/docid
```

### Usage

To reference a document as a whole, use `DocID`. You can create an instance from the parts. Document type string or integer and CID instance or string are required.

```typescript
import DocID from '@ceramicnetwork/docid';
// alternatively: import { DocID } from '@ceramicnetwork/docid'

const docid = new DocId('tile', 'bagcqcerakszw2vsov...');

docid.type; // 0
docid.typeName; // 'tile'
docid.bytes; // Uint8Array(41) [ 206,   1,   0,   0,   1, 133,   1, ...]
docid.cid; // CID('bagcqcerakszw2vsov...')
docid.toString();
//k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws
docid.toUrl();
//ceramic://k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws
```

You can also create DocID instance from DocID string or bytes.

```typescript
const docid = DocID.fromString('k3y52l7mkcvtg023bt9txe...');
```

```typescript
const docid = DocID.fromBytes(Uint8Array(41) [ 206,   1,   0,   0,   1, 133,   1, ...])
```

To reference particular point in a document evolution, use `CommitID`.
In addition to document type (string or integer) and genesis reference (CID instance or string),
one is expected to provide a reference to commit (CID instance or string). If you pass `0` or `'0'` (as string), `null`
or just omit the value, this would reference a genesis commit.

```typescript
import { CommitID } from '@ceramicnetwork/docid';

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

To reference specific CID from `DocID` or to change commit reference in `CommitID`, use `atCommit` method:

```typescript
commitId.atCommit('bagcqcerakszw2vsov...'); // #=> new CommitID for the same document
docId.atCommit('bagcqcerakszw2vsov...'); // #=> new CommitID for the same document
```

`CommitID` (`DocID` for compatibility also) can get you base `DocID` via `#baseID`:

```typescript
commitId.baseID; // #=> DocID reference to the document
docId.baseID; // #=> new DocID reference to the same document, effectively a shallow clone.
```

To parse an unknown input into proper CommitID or DocID, you could use `DocRef.from`:
```typescript
import { DocRef } from '@ceramicnetwork/docid';
const input = 'bagcqcerakszw2vsov...' // could be instance of Uint8Array, DocID, CommitID either; or in URL form
const docIdOrCommitId = DocRef.from(input) // throws if can not properly parse it into CommitID or DocID
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

We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License

MIT or Apache-2.0
