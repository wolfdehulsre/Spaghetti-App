// Small local preview server so browser pages use http://localhost instead of file://.
// This lets third-party map tiles receive the normal HTTP referrer required by OSM.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/map.css', ['map.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/members.html', ['members.html', 'text/html; charset=utf-8']],
  ['/members', ['members.html', 'text/html; charset=utf-8']],
  ['/ratings-overview', ['ratings-overview.html', 'text/html; charset=utf-8']],
  ['/ratings-overview.html', ['ratings-overview.html', 'text/html; charset=utf-8']],
  ['/ratings-overview.js', ['ratings-overview.js', 'text/javascript; charset=utf-8']],
  ['/members.js', ['members.js', 'text/javascript; charset=utf-8']],
  ['/i18n.js', ['i18n.js', 'text/javascript; charset=utf-8']],
  ['/pwa.js', ['pwa.js', 'text/javascript; charset=utf-8']],
  ['/pwa.css', ['pwa.css', 'text/css; charset=utf-8']],
  ['/icon-192.png', ['icon-192.png', 'image/png']],
  ['/icon-512.png', ['icon-512.png', 'image/png']],
  ['/runtime-config.js', ['runtime-config.js', 'text/javascript; charset=utf-8']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json']],
  ['/icon.svg', ['icon.svg', 'image/svg+xml']],
  ['/service-worker.js', ['service-worker.js', 'text/javascript; charset=utf-8']]
]);

const root = __dirname;
const server = http.createServer((request, response) => {
  const route = new URL(request.url, 'http://localhost').pathname;
  const file = files.get(route);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  fs.readFile(path.join(root, file[0]), (error, content) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Unable to read app file');
      return;
    }
    response.writeHead(200, { 'Content-Type': file[1] });
    response.end(content);
  });
});

server.listen(8765, '127.0.0.1', () => {
  process.stdout.write('Beste Belgische Bolognaise is available at http://localhost:8765/\n');
});

