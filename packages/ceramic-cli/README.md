# Ceramic CLI

> A command line interface that allows you to interact with the Ceramic protocol.

## Usage
```
$ ceramic -h
```

### Not yet implemented commands

#### `ceramic pin add <docId>`
Pin a given document.

#### `ceramic pin rm <docId>`
Unpin a given document.

#### `ceramic pin ls`
List pinned documents.



#### `ceramic user did`
Show the DID of the user.

#### `ceramic user sign <payload>`
Ask the user to sign a given payload.

#### `ceramic user encrypt <payload>`
Ask the user to encrypt a given payload.

#### `ceramic user decrypt <JWE | CWE>`
Ask the user to decrypt a given JWE or CWE.


## Ceramic http api
The Ceramic daemon creates an http endpoint from which various operations can be performed.

### `/api/v0/create` - `POST`
Create a new Ceramic document.

#### Post data
Only `content` is required.

```js
{
  content: <content-json>,
  doctype: <string>, // defaults to "tile"
  owners: <owners-string-array> // defaults to current user
}
```

### `/api/v0/show/<document-id>` - `GET`
Returns the content of the given document.

##### Optional query parameters:
* `?version=<CID>` - the version of the document to show (CID of the anchor record)
* `?v=<CID>` - the version of the document to show (CID of the anchor record)

### `/api/v0/state/<document-id>` - `GET`
Returns the full state of the given document.

##### Optional query parameters:
* `?version=<CID>` - the version of the document to show (CID of the anchor record)
* `?v=<CID>` - the version of the document to show (CID of the anchor record)

### `/api/v0/change/<document-id>` - `POST`
Change the content of a given document.

#### Post data
```js
{
  content: <content-json>,
  owners: <owners-string-array>
}
```

### `/api/v0/add-record/<document-id>` - `POST`
Change the content of a given document by adding a signed record directly. This is useful if the wallet exists not on the ceramic node, but on the client side.

#### Post data
```js
{
  record: <signed-record-data>
}
```

### `/api/v0/pin/add/<document-id>` - `GET`
Add the given document to the pin set.

### `/api/v0/pin/rm/<document-id>` - `GET`
Remove the given document from the pin set.

### `/api/v0/pin/ls/` - `GET`
Returns the list of document ids that are currently pinned.
