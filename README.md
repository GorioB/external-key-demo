# Hello World Demo API

A tiny, dependency-free Node.js server that serves a landing page and a demo API. Visitors grab a demo API key from the page, then use it to call `GET /api/hello`.

> **Demo only.** Keys are not secure: they are generated at startup, held in memory, and shared between all visitors.

## Run

Requires Node.js. No `npm install` needed.

```sh
node server.js
```

Open http://localhost:3000.

### Configuration

| Variable     | Default | Description                                                                                     |
| ------------ | ------- | ----------------------------------------------------------------------------------------------- |
| `PORT`       | `3000`  | Port to listen on.                                                                              |
| `PUBLIC_URL` | _unset_ | Base URL written into the OpenAPI `servers` entry. If unset, derived from the request headers (`x-forwarded-proto` / `x-forwarded-host` / `Host`). |

## Endpoints

| Method | Path            | Auth        | Description                                         |
| ------ | --------------- | ----------- | --------------------------------------------------- |
| GET    | `/`             | none        | Landing page with a form to get a demo key.         |
| POST   | `/api/demo-key` | none        | Returns `{ "apiKey": "demo_..." }` from the pool.   |
| GET    | `/api/hello`    | `x-api-key` | Returns `{ "message": "Hello, world!" }`.           |
| GET    | `/openapi.json` | none        | OpenAPI 3.0.3 spec, served as a download.           |

Anything else returns `404 {"error": "Not found"}`. A missing or invalid key on `/api/hello` returns `401`.

## Example

```sh
KEY=$(curl -s -X POST http://localhost:3000/api/demo-key | node -pe 'JSON.parse(require("fs").readFileSync(0)).apiKey')

curl -H "x-api-key: $KEY" http://localhost:3000/api/hello
# {"message": "Hello, world!"}
```

## Notes

- Five keys are generated on each start, so keys stop working after a restart.
- The email field on the landing page is not validated, sent, stored, or logged. The form only requests a key.
