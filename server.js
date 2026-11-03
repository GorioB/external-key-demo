// Tiny demo API + landing page. No dependencies. Run: node server.js
const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

// Small pool of demo keys, generated at startup. Not secure, by design.
const KEYS = new Set(
  Array.from({ length: 5 }, () => "demo_" + crypto.randomBytes(12).toString("hex"))
);
const KEY_LIST = [...KEYS];

function baseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, "");
  const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
  const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function openapi(req) {
  return {
    openapi: "3.0.3",
    info: {
      title: "Hello World Demo API",
      version: "1.0.0",
      description: "A demo API that returns a greeting when called with a valid API key.",
    },
    servers: [{ url: baseUrl(req) }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
      },
    },
    paths: {
      "/api/hello": {
        get: {
          summary: "Say hello",
          operationId: "hello",
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: "A greeting",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { message: { type: "string", example: "Hello, world!" } } },
                },
              },
            },
            401: { description: "Missing or invalid API key" },
          },
        },
      },
    },
  };
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hello World API Demo</title>
<style>
  /* Catppuccin Latte (light) / Mocha (dark) */
  :root {
    color-scheme: light dark;
    --base: #eff1f5; --mantle: #e6e9ef; --surface: #ccd0da;
    --text: #4c4f69; --subtext: #6c6f85;
    --mauve: #8839ef; --pink: #ea76cb; --lavender: #7287fd; --green: #40a02b;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --base: #1e1e2e; --mantle: #181825; --surface: #313244;
      --text: #cdd6f4; --subtext: #a6adc8;
      --mauve: #cba6f7; --pink: #f5c2e7; --lavender: #b4befe; --green: #a6e3a1;
    }
  }
  body { font: 16px/1.6 system-ui, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 16px;
         background: var(--base); color: var(--text); }
  h1 { margin-bottom: .25rem; color: var(--mauve); }
  h2, h3 { color: var(--lavender); }
  strong { color: var(--pink); }
  code { background: var(--surface); padding: .1rem .35rem; border-radius: 6px; color: var(--green); }
  label { color: var(--subtext); }
  input, button { font: inherit; padding: .55rem .85rem; border-radius: 12px; }
  input { width: 100%; box-sizing: border-box; margin-bottom: .5rem; background: var(--mantle); color: var(--text);
          border: 2px solid var(--surface); outline: none; }
  input:focus { border-color: var(--mauve); }
  button { cursor: pointer; border: 0; background: var(--mauve); color: var(--base); font-weight: 600; }
  button:hover { background: var(--pink); }
  pre { background: var(--mantle); border: 2px solid var(--surface); padding: .75rem; border-radius: 12px;
        overflow-x: auto; color: var(--green); }
  #result { display: none; }
</style>
</head>
<body>
<h1>Hello World API Demo</h1>
<h2>How this demo works</h2>
<ol>
  <li>Enter an email address below. <strong>It can be any text at all &mdash; it is not validated.</strong></li>
  <li>You get back an API key from a small shared pool of demo keys.</li>
  <li>Send that key in an <code>x-api-key</code> header to <code>GET /api/hello</code>.</li>
</ol>
<p><strong>Your email is never stored, logged or even sent to the server.</strong> The form only asks the server for a demo key; what you type stays in your browser. These keys are not secure and are shared between visitors.</p>

<form id="form">
  <label for="email">Email</label>
  <input id="email" name="email" type="text" placeholder="anything you like" autocomplete="off">
  <button type="submit">Get API key</button>
</form>

<div id="result">
  <h3>Your API key</h3>
  <pre id="key"></pre>
  <h3>Try it</h3>
  <pre id="curl"></pre>
</div>

<h2>OpenAPI spec</h2>
<p><a href="/openapi.json" download="openapi.json"><button type="button">Download OpenAPI spec</button></a></p>

<script>
  document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch("/api/demo-key", { method: "POST" });
    const { apiKey } = await res.json();
    document.getElementById("key").textContent = apiKey;
    document.getElementById("curl").textContent =
      "curl -H 'x-api-key: " + apiKey + "' " + location.origin + "/api/hello";
    document.getElementById("result").style.display = "block";
  });
</script>
</body>
</html>`;

function send(res, status, body, type = "application/json", headers = {}) {
  res.writeHead(status, { "Content-Type": type, ...headers });
  res.end(typeof body === "string" ? body : JSON.stringify(body, null, 2));
}

http
  .createServer((req, res) => {
    const path = new URL(req.url, "http://x").pathname;

    if (req.method === "GET" && path === "/") return send(res, 200, PAGE, "text/html; charset=utf-8");

    if (req.method === "POST" && path === "/api/demo-key") {
      return send(res, 200, { apiKey: KEY_LIST[Math.floor(Math.random() * KEY_LIST.length)] });
    }

    if (req.method === "GET" && path === "/api/hello") {
      if (!KEYS.has(req.headers["x-api-key"])) return send(res, 401, { error: "Missing or invalid x-api-key" });
      return send(res, 200, { message: "Hello, world!" });
    }

    if (req.method === "GET" && path === "/openapi.json") {
      return send(res, 200, openapi(req), "application/json", {
        "Content-Disposition": 'attachment; filename="openapi.json"',
      });
    }

    send(res, 404, { error: "Not found" });
  })
  .listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
