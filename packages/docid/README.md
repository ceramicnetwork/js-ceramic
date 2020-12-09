# Ceramic DocId

> This package contains Ceramic DocId implementation.

Implements Ceramic DocIDs as defined in ceramic spec and [CIP](https://github.com/ceramicnetwork/CIP/blob/master/CIPs/CIP-59/CIP-59.md)

```html
<docid> ::= <multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes>
```
or including DocID commit

```html
<docid> ::= <multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><commit-cid-bytes>
```

## Getting started

### Installation
```
$ npm install @ceramicnetwork/docid
```

### Usage

You can create an instance from the parts. Document type string or integer and CID instance or string are required. Commit CID and multibaseName are optional and default to null and 'base36' respectively. 

```js
import DocID from '@ceramicnetwork/docid'

const docid = new DocId('tile', 'bagcqcerakszw2vsov...', commit, 'devnet', 'base36)

docid.type           // 0
docid.typeName       // 'tile'
docid.multibaseName  // 'base36'
docid.bytes          // Uint8Array(41) [ 206,   1,   0,   0,   1, 133,   1, ...] 
docid.cid            // CID('bagcqcerakszw2vsov...')
docid.toString()     
//k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws
docid.toUrl()   
//ceramic://k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws
```

You can also create DocID instance from DocID string or bytes.

```js
const docid = DocID.fromString('k3y52l7mkcvtg023bt9txe...')
```

```js
const docid = DocID.fromBytes(Uint8Array(41) [ 206,   1,   0,   0,   1, 133,   1, ...])
```

## Development
Run tests:
```
$ npm test
```

Run linter:
```
npm run lint
```

## Contributing
We are happy to accept small and large contributions. Make sure to check out the [Ceramic specifications](https://github.com/ceramicnetwork/specs) for details of how the protocol works.

## License