# Ceramic CLI

> TODO: description

## Usage

### CLI
```
ceramic daemon

ceramic create <doctype> <genesis-content> [--onlyGenesis]

ceramic show <path>

ceramic status <path>

ceramic watch <path>

ceramic change <path> <new-content>


ceramic user did

ceramic user sign <payload | path>

ceramic user encrypt <payload>

ceramic user decrypt <JWE | CWE><Paste>
```

### HTTP API
```
/api/v0/create - POST

/api/v0/show/<document-id> - GET

/api/v0/status/<document-id> - GET

/api/v0/change/<document-id> - POST
```
