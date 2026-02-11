import http from 'node:http';
import { handleCreateExport, handleGetExport } from './exports-routes.js';

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && url.pathname === '/api/v1/exports') {
      await handleCreateExport(req, res);
      return;
    }

    if (req.method === 'GET') {
      const match = url.pathname.match(/^\/api\/v1\/exports\/([^/]+)$/);
      if (match) {
        handleGetExport(req, res, match[1]);
        return;
      }
    }

    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
}

const isDirectExecution = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];

if (isDirectExecution) {
  const port = Number(process.env.PORT ?? 3000);
  const server = createServer();
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on ${port}`);
  });
}
