# Ceramic DocId

> This package contains Ceramic DocId implementation.

Implements Ceramic DocIDs as defined in ceramic spec and [CIP](https://github.com/ceramicnetwork/CIP/blob/master/CIPs/CIP-59/CIP-59.md)

```html
<docid> ::= <multibase-prefix><multicodec-docid><subnet><doctype><genesis-cid-bytes>
```
or including DocID version

```html
<docid> ::= <multibase-prefix><multicodec-docid><subnet><doctype><genesis-cid-bytes><version-cid-bytes>
```

## Getting started

### Installation
```
$ npm install @ceramicnetwork/docid
```

### Usage

You can create an instance from the parts. Document type string or integer and CID instance or string are required. Subnet and multibaseName are optional and default to 'devnet' and 'base36' respectively. 

```js
import DocID from '@ceramicnetwork/docid'

const docid = new DocId('tile', 'bagcqcerakszw2vsov...', version, 'devnet', 'base36)

docid.type           // 0
docid.typeName       // 'tile'
docid.subnet         // 0
docid.subnetName     // 'subnet
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