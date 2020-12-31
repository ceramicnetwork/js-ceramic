The Ceramic HTTP API allows you to create and update documents on a remote Ceramic node. These endpoints allows you to manually make requests to a Ceramic node. This is also a good place to start if you want to build a Ceramic client in a new language. 

*`ℹ️ Not all of these methods are exposed if the node runs in gateway mode.`*

# Documents
The `documents` endpoint is used to create new documents, load documents from their [[DocID]] or from their genesis content. 

## Get the state of a document
Load the state of a document given its [[DocID]].

### Request
`GET /api/v0/documents/:docid`

Here, `:docid` should be replaced by the string representation of the DocID of the document that is being requested.

### Response

The response body contains the following fields:

- `docId` - the [[DocID]] of the requested document as string
- `state` - the state of the requested document as [[DocState]]

### Example

```bash
$ curl http://localhost:7007/api/v0/documents/kjzl6cwe1jw147r7878h32yazawcll6bxe5v92348cxitif6cota91qp68grbhm

{
  "docId": "kjzl6cwe1jw147r7878h32yazawcll6bxe5v92348cxitif6cota91qp68grbhm",
  "state": {
    "doctype": "tile",
    "content": {
      "Ceramic": "pottery"
    },
    "metadata": {
      "schema": null,
      "controllers": [
        "did:key:z6MkfZ6S4NVVTEuts8o5xFzRMR8eC6Y1bngoBQNnXiCvhH8H"
      ]
    },
    "signature": 2,
    "anchorStatus": "PENDING",
    "log": [{
      "cid": "bagcqceramof2xi7kh6qblirzkbc7yulcjcticlcob6uvdrx3bexgks37ilva",
      "type": 0
    }],
    "anchorScheduledFor": "12/15/2020, 2:45:00 PM"
  }
}
```

## Create a document from genesis record
Create a new document, or load a document from its genesis content. The genesis content may be signed (a DagJWS for the `tile` doctype), or unsigned in some cases.

### Request
`POST /api/v0/documents`

The request body should contain the following fields:

- `doctype` - the name of the doctype to use (e.g. 'tile'), string
- `genesis` - the genesis content of the document (will differ per doctype)
- `docOpts` - options for the document creation, [[DocOpts]] (optional)

### Response

The response body contains the following fields:

- `docId` - the [[DocID]] of the requested document as string
- `state` - the state of the requested document as [[DocState]]

### Example

This example creates a `tile` document from an unsigned genesis record. Note that if the content is defined for a `tile` genesis record, it needs to be signed.

```bash
$ curl http://localhost:7007/api/v0/documents -X POST -d '{ "doctype": "tile", "genesis": { "header": { "family": "test", "controllers": ["did:key:z6MkfZ6S4NVVTEuts8o5xFzRMR8eC6Y1bngoBQNnXiCvhH8H"] } } }' -H "Content-Type: application/json"

{
  "docId": "k2t6wyfsu4pg2qvoorchoj23e8hf3eiis4w7bucllxkmlk91sjgluuag5syphl",
  "state": {
    "doctype": "tile",
    "content": {},
    "metadata": {
      "family": "test",
      "controllers": [
        "did:key:z6MkfZ6S4NVVTEuts8o5xFzRMR8eC6Y1bngoBQNnXiCvhH8H"
      ]
    },
    "signature": 0,
    "anchorStatus": "PENDING",
    "log": [
      {
        "cid": "bafyreihtdxfb6cpcvomm2c2elm3re2onqaix6frq4nbg45eaqszh5mifre",
        "type": 0
      }
    ],
    "anchorScheduledFor": "12/15/2020, 3:00:00 PM"
  }
}
```

# Multiqueries
The `multiqueries` endpoint enables querying multiple documents at once, as well as querying documents which are linked.

## Query multiple documents
This endpoint allows you to query multiple DocIDs. Along with each DocID an array of paths can be passed. If any of the paths within the document structure contains a ceramic DocID url (`ceramic://<DocID>`), this linked document will also be returned as part of the response.

### Request
`POST /api/v0/multiqueries`

- `queries` - an array of [[MultiQuery]] objects

### Response

The response body contains a map from DocID strings to [[DocState]] objects.

### Example

First let's create three documents to query using the ceramic cli:

```bash
$ ceramic create tile --content '{ "Document": "A" }'

DocID(kjzl6cwe1jw149rledowj0zi0icd7epi9y1m5tx4pardt1w6dzcxvr6bohi8ejc)
{
  "Document": "A"
}

$  ceramic create tile --content '{ "Document": "B" }'

DocID(kjzl6cwe1jw147w3xz3xrcd37chh2rz4dfra3imtnsni385rfyqa3hbx42qwal0)
{
  "Document": "B"
}


$ ceramic create tile --content '{ "Document": "C", "link": "ceramic://kjzl6cwe1jw149rledowj0zi0icd7epi9y1m5tx4pardt1w6dzcxvr6bohi8ejc" }'

DocID(kjzl6cwe1jw14b54pb10voc4bqh73qyu8o6cfu66hoi3feidbbj81i5rohh7kgl)
{
  "link": "ceramic://kjzl6cwe1jw149rledowj0zi0icd7epi9y1m5tx4pardt1w6dzcxvr6bohi8ejc",
  "Document": "C"
}
```

Now let's query them though the multiqueries endpoint:

```bash
curl http://localhost:7007/api/v0/multiqueries -X POST -d '{
  "queries": [{
    "docId": "kjzl6cwe1jw14b54pb10voc4bqh73qyu8o6cfu66hoi3feidbbj81i5rohh7kgl",
    "paths": ["link"]
  }, {
    "docId": "kjzl6cwe1jw147w3xz3xrcd37chh2rz4dfra3imtnsni385rfyqa3hbx42qwal0",
    "paths": []
  }]
}' -H "Content-Type: application/json"

{
  "kjzl6cwe1jw14b54pb10voc4bqh73qyu8o6cfu66hoi3feidbbj81i5rohh7kgl": {
    "doctype": "tile",
    "content": {
      "link": "ceramic://kjzl6cwe1jw149rledowj0zi0icd7epi9y1m5tx4pardt1w6dzcxvr6bohi8ejc",
      "Document": "C"
    },
    "metadata": {
      "schema": null,
      "controllers": [
        "did:key:z6MkfZ6S4NVVTEuts8o5xFzRMR8eC6Y1bngoBQNnXiCvhH8H"
      ]
    },
    "signature": 2,
    "anchorStatus": "PENDING",
    "log": [
      {
        "cid": "bagcqcera5nx45nccxvjjyxsq3so5po77kpqzbfsydy6yflnkt6p5tnjvhbkq",
        "type": 0
      }
    ],
    "anchorScheduledFor": "12/30/2020, 1:45:00 PM"
  },
  "kjzl6cwe1jw149rledowj0zi0icd7epi9y1m5tx4pardt1w6dzcxvr6bohi8ejc": {
    "doctype": "tile",
    "content": {
      "Document": "A"
    },
    "metadata": {
      "schema": null,
      "controllers": [
        "did:key:z6MkfZ6S4NVVTEuts8o5xFzRMR8eC6Y1bngoBQNnXiCvhH8H"
      ]
    },
    "signature": 2,
    "anchorStatus": "PENDING",
    "log": [
      {
        "cid": "bagcqcerawq5h7otlkdwuai7vhogqhs2aeaauwbu2aqclrh4iyu5h54qqogma",
        "type": 0
      }
    ],
    "anchorScheduledFor": "12/30/2020, 1:45:00 PM"
  },
  "kjzl6cwe1jw147w3xz3xrcd37chh2rz4dfra3imtnsni385rfyqa3hbx42qwal0": {
    "doctype": "tile",
    "content": {
      "Document": "B"
    },
    "metadata": {
      "schema": null,
      "controllers": [
        "did:key:z6MkfZ6S4NVVTEuts8o5xFzRMR8eC6Y1bngoBQNnXiCvhH8H"
      ]
    },
    "signature": 2,
    "anchorStatus": "PENDING",
    "log": [
      {
        "cid": "bagcqceranecdjzw4xheudgkr2amjkntpktci2xv44d7v4hbft3ndpptid6ka",
        "type": 0
      }
    ],
    "anchorScheduledFor": "12/30/2020, 1:45:00 PM"
  }
}
```



# Records

The `records` endpoint provides lower level access to the data structure of a Ceramic document. It is also the enpoint that is used in order to update a document, by adding a new record.

## Get all records of a document

By calling get on the *records* endpoint along with a [[DocID]] gives you access to all of the records of the given document. This is useful if you want to inspect the document history, or apply all of the records to a ceramic node that is not connected to the network.

### Request
`GET /api/v0/records/:docid`

Here, `:docid` should be replaced by the string representation of the DocID of the document that is being requested.

### Response

* `docId` - the [[DocID]] of the requested document, string
* `records` - an array of record objects

### Example

```bash
curl http://localhost:7007/api/v0/records/kjzl6cwe1jw14ahmwunhk9yjwawac12tb52j1uj3b9a57eohmhycec8778p3syv

{
  "docId": "kjzl6cwe1jw14ahmwunhk9yjwawac12tb52j1uj3b9a57eohmhycec8778p3syv",
  "records": [
    {
      "cid": "bagcqcera2faj5vik2giftqxftbngfndkci7x4z5vp3psrf4flcptgkz5xztq",
      "value": {
        "jws": {
          "payload": "AXESIAsUBpZMnue1yQ0BgXsjOFyN0cHq6AgspXnI7qGB54ux",
          "signatures": [
            {
              "signature": "16tBnfkXQU0yo-RZvfjWhm7pP-hIxJ5m-FIMHlCrRkpjbleoEcaC80Xt7qs_WZOlOCexznjow9aX4aZe51cYCQ",
              "protected": "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa2ZaNlM0TlZWVEV1dHM4bzV4RnpSTVI4ZUM2WTFibmdvQlFOblhpQ3ZoSDhII3o2TWtmWjZTNE5WVlRFdXRzOG81eEZ6Uk1SOGVDNlkxYm5nb0JRTm5YaUN2aEg4SCJ9"
            }
          ],
          "link": "bafyreialcqdjmte64624sdibqf5sgoc4rxi4d2xibawkk6oi52qydz4lwe"
        },
        "linkedBlock": "o2RkYXRhoWV0aXRsZXFNeSBmaXJzdCBEb2N1bWVudGZoZWFkZXKiZnNjaGVtYfZrY29udHJvbGxlcnOBeDhkaWQ6a2V5Ono2TWtmWjZTNE5WVlRFdXRzOG81eEZ6Uk1SOGVDNlkxYm5nb0JRTm5YaUN2aEg4SGZ1bmlxdWVwenh0b1A5blphdVgxcEE0OQ"
      }
    },
    {
      "cid": "bagcqcera3fkje7je4lvctkam4fvi675avtcuqgrv7dn6aoqljd5lebpl7rfq",
      "value": {
        "jws": {
          "payload": "AXESINm6lI30m3j5H2ausx-ulXj-L9CmFlOTZBZvJ2O734Zt",
          "signatures": [
            {
              "signature": "zsLJbBSU5xZTQkYlXwEH9xj_t_8frvSFCYs0SlVMPXOnw8zOJOsKnJDQlUOvPJxjt8Bdc_7xoBdmcRG1J1tpCw",
              "protected": "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa2ZaNlM0TlZWVEV1dHM4bzV4RnpSTVI4ZUM2WTFibmdvQlFOblhpQ3ZoSDhII3o2TWtmWjZTNE5WVlRFdXRzOG81eEZ6Uk1SOGVDNlkxYm5nb0JRTm5YaUN2aEg4SCJ9"
            }
          ],
          "link": "bafyreigzxkki35e3pd4r6zvowmp25fly7yx5bjqwkojwiftpe5r3xx4gnu"
        },
        "linkedBlock": "pGJpZNgqWCYAAYUBEiDRQJ7VCtGQWcLlmFpitGoSP35ntX7fKJeFWJ8zKz2+Z2RkYXRhgaNib3BjYWRkZHBhdGhlL21vcmVldmFsdWUY6mRwcmV22CpYJgABhQESINFAntUK0ZBZwuWYWmK0ahI/fme1ft8ol4VYnzMrPb5nZmhlYWRlcqFrY29udHJvbGxlcnOA"
      }
    }
  ]
}
```

## Apply a record to a document
*`⚠️ This method is not available if gateway mode is enabled.`*

In order to modify a document we apply a record to its docment log. This record usually contains a signature over a *json-patch* diff describing a modification to the document contents. The record also needs to contain pointers to the previous record and other metadata. You can read more about this in the [Ceramic Specification](https://github.com/ceramicnetwork/ceramic/blob/master/SPECIFICATION.md#document-records). Different document types may have different formats for their records. If you want to see an example implementation for how to construct a record you can have a look at the implementation of the [[TileDoctype]].

### Request
`POST /api/v0/records`

The request body should contain the following fields:

- `docId` - the name of the doctype to use, string
- `record` - the genesis content of the document (will differ per doctype)
- `docOpts` - options for the document creation [[DocOpts]]

### Response

* `docId` - the [[DocID]] of the document that was modified
* `state` - the new state of the document that was modified, [[DocState]]

### Example

```bash

curl http://localhost:7007/api/v0/records -X POST -d '{
  "docId": "kjzl6cwe1jw14ahmwunhk9yjwawac12tb52j1uj3b9a57eohmhycec8778p3syv",
  "record": {
    "jws": {
      "payload": "AXESINm6lI30m3j5H2ausx-ulXj-L9CmFlOTZBZvJ2O734Zt",
      "signatures": [
        {
          "signature": "zsLJbBSU5xZTQkYlXwEH9xj_t_8frvSFCYs0SlVMPXOnw8zOJOsKnJDQlUOvPJxjt8Bdc_7xoBdmcRG1J1tpCw",
          "protected": "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa2ZaNlM0TlZWVEV1dHM4bzV4RnpSTVI4ZUM2WTFibmdvQlFOblhpQ3ZoSDhII3o2TWtmWjZTNE5WVlRFdXRzOG81eEZ6Uk1SOGVDNlkxYm5nb0JRTm5YaUN2aEg4SCJ9"
        }
      ],
      "link": "bafyreigzxkki35e3pd4r6zvowmp25fly7yx5bjqwkojwiftpe5r3xx4gnu"
    },
    "linkedBlock": "pGJpZNgqWCYAAYUBEiDRQJ7VCtGQWcLlmFpitGoSP35ntX7fKJeFWJ8zKz2+Z2RkYXRhgaNib3BjYWRkZHBhdGhlL21vcmVldmFsdWUY6mRwcmV22CpYJgABhQESINFAntUK0ZBZwuWYWmK0ahI/fme1ft8ol4VYnzMrPb5nZmhlYWRlcqFrY29udHJvbGxlcnOA"
  }
}' -H "Content-Type: application/json"

{
  "docId": "kjzl6cwe1jw14ahmwunhk9yjwawac12tb52j1uj3b9a57eohmhycec8778p3syv",
  "state": {
    "doctype": "tile",
    "content": {
      "title": "My first Document"
    },
    "metadata": {
      "schema": null,
      "controllers": [
        "did:key:z6MkfZ6S4NVVTEuts8o5xFzRMR8eC6Y1bngoBQNnXiCvhH8H"
      ]
    },
    "signature": 2,
    "anchorStatus": "PENDING",
    "log": [
      {
        "cid": "bagcqcera2faj5vik2giftqxftbngfndkci7x4z5vp3psrf4flcptgkz5xztq",
        "type": 0
      },
      {
        "cid": "bagcqcera3fkje7je4lvctkam4fvi675avtcuqgrv7dn6aoqljd5lebpl7rfq",
        "type": 1
      }
    ],
    "anchorScheduledFor": "12/30/2020, 1:15:00 PM",
    "next": {
      "content": {
        "title": "My first Document",
        "more": 234
      },
      "metadata": {
        "schema": null,
        "controllers": []
      }
    }
  }
}


```



# Pins

The `pins` api endpoint can be used to manipulate the pin set. The pin set is all of the documents that a node maintains the state of. Any document opened by the node that is not pinned will eventually be garbage collected from the node.

## Add a document to the pin set
This method adds the document with the given [[DocID]] to the pin set. 

*`⚠️ This method is not available if gateway mode is enabled.`*

### Request
`POST /api/v0/pins/:docid`

Here, `:docid` should be replaced by the string representation of the DocID of the document that is being requested.

### Response

* `docId` - the [[DocID]] of the document which was pinned, string
* `isPinned` - whether the document was pinned, boolean - `true`

### Example

```bash
curl http://localhost:7007/api/v0/pins/k2t6wyfsu4pg2qvoorchoj23e8hf3eiis4w7bucllxkmlk91sjgluuag5syphl -X POST

{
  "docId": "k2t6wyfsu4pg2qvoorchoj23e8hf3eiis4w7bucllxkmlk91sjgluuag5syphl",
  "isPinned": true
}
```

## Remove a document from the pin set
This method removes the document with the given [[DocID]] from the pin set.

*`⚠️ This method is not available if gateway mode is enabled.`*

### Request
`DELETE /api/v0/pins/:docid`

Here, `:docid` should be replaced by the string representation of the DocID of the document that is being requested.

### Response

* `docId` - the [[DocID]] of the document which was unpinned, string
* `isPinned` - whether the document was unpinned, boolean - `false`

### Example

```bash
curl http://localhost:7007/api/v0/pins/k2t6wyfsu4pg2qvoorchoj23e8hf3eiis4w7bucllxkmlk91sjgluuag5syphl -X DELETE

{
  "docId": "k2t6wyfsu4pg2qvoorchoj23e8hf3eiis4w7bucllxkmlk91sjgluuag5syphl",
  "isPinned": false
}
```

## List all documents in the pin set

Calling this method allows you to list all of the documents that are in the pin set on this node.

### Request

`GET /api/v0/pins`

### Response

* `pinnedDocIds` - an array of [[DocID]] strings that are in the pin set

### Example

```bash
curl http://localhost:7007/api/v0/pins

{
  "pinnedDocIds": [
    "k2t6wyfsu4pfwqaju0w9nmi53zo6f5bcier7vc951x4b9rydv6t8q4pvzd5w3l",
    "k2t6wyfsu4pfxon8reod8xcyka9bujeg7acpz8hgh0jsyc7p2b334izdyzsdp7",
    "k2t6wyfsu4pfxqseec01fnqywmn8l93p4g2chzyx3sod3hpyovurye9hskcegs",
    "k2t6wyfsu4pfya9y0ega1vnokf0g5qaus69basy52oxg50y3l35vm9rqbb88t3"
  ]
}
```

# Check if a specific document is in the pin set

This method is used to check if a particular document is in the pin set.

### Request

`GET /api/v0/pins/:docid`

Here, `:docid` should be replaced by the string representation of the DocID of the document that is being requested.

### Response

* `pinnedDocIds` - an array containing the specified [[DocID]] string if that document is pinned, or an empty array if that document is not pinned

### Example

```bash
curl http://localhost:7007/api/v0/pins/k2t6wyfsu4pg2qvoorchoj23e8hf3eiis4w7bucllxkmlk91sjgluuag5syphl

{
  "pinnedDocIds": ["k2t6wyfsu4pg2qvoorchoj23e8hf3eiis4w7bucllxkmlk91sjgluuag5syphl"]
}
```

# Node Info

The methods under the `/node` path provides more information about this particular node.

## List supported blockchains for a given node
Get all of the [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) *chainIds* supported by this node.

### Request

`GET /api/v0/node/chains`

### Response

The response body contains the following fields:

- `supportedChains` - and array with [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md) formatted chainIds

### Example

```bash
curl http://localhost:7007/api/v0/node/chains

{
  "supportedChains": ["eip155:3"]
}
```

## Preform a node health check

Check the health of the node and the machine it's running on. Run `ceramic daemon -h` for more details on how this can be configured.

### Request

`GET /api/v0/node/healthcheck`

### Response

Either a `200` response with the text `Alive!`, or a `503` with the text `Insufficient resources`.

### Example

```bash
curl http://localhost:7007/api/v0/node/healthcheck

Alive!
```
