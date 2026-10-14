import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number.parseInt(process.env.PORT || '8080', 10);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(body);
}

createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    send(response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }

  try {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const requestedPath = requestUrl.pathname === '/'
      ? '/kinfolk-preview-suite.html'
      : requestUrl.pathname;
    const decodedPath = decodeURIComponent(requestedPath);
    const target = resolve(root, `.${decodedPath}`);

    if (!target.startsWith(root)) {
      send(response, 403, 'Forbidden');
      return;
    }

    if (decodedPath === '/health') {
      send(response, 200, 'ok');
      return;
    }

    const file = await stat(target);
    if (!file.isFile()) {
      send(response, 404, 'Not Found');
      return;
    }

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': file.size,
      'Content-Type': contentTypes[extname(target).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    response.end(await readFile(target));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      send(response, 404, 'Not Found');
      return;
    }
    console.error(error);
    send(response, 500, 'Internal Server Error');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Kinfolk review suite listening on ${port}`);
});
