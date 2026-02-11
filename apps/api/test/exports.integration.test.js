import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.js';
import { exportService } from '../src/exports-routes.js';

function sampleDocument(pageCount = 2, elementsPerPage = 3) {
  return {
    id: `doc-${pageCount}-${elementsPerPage}`,
    title: 'Quarterly Plan',
    pages: Array.from({ length: pageCount }).map((_, pageIndex) => ({
      id: `page-${pageIndex + 1}`,
      width: 1920,
      height: 1080,
      elements: Array.from({ length: elementsPerPage }).map((__, elementIndex) => ({
        id: `el-${pageIndex + 1}-${elementIndex + 1}`,
        type: elementIndex % 2 === 0 ? 'text' : 'image',
        x: 100 + elementIndex * 120,
        y: 80 + elementIndex * 90,
        width: 320,
        height: 90,
        text: elementIndex % 2 === 0 ? `Heading ${elementIndex + 1}` : undefined,
        src: elementIndex % 2 === 1 ? `https://cdn.local/image-${elementIndex + 1}.png` : undefined,
        style: {
          fontFamily: 'Inter',
          fontSize: 42,
          fontWeight: 700,
          lineHeight: 1.2,
        },
      })),
    })),
  };
}

async function startServer() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  return { server, baseUrl };
}

async function createExport(baseUrl, format, document) {
  const response = await fetch(`${baseUrl}/api/v1/exports`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ format, document }),
  });
  assert.equal(response.status, 202);
  return response.json();
}

async function getExport(baseUrl, id) {
  const response = await fetch(`${baseUrl}/api/v1/exports/${id}`);
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function waitForCompletion(baseUrl, id) {
  for (let i = 0; i < 20; i += 1) {
    const { body } = await getExport(baseUrl, id);
    if (body.status === 'completed' || body.status === 'failed') {
      return body;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Export ${id} did not complete`);
}

test('exports preserve element positions and typography across pdf/pptx/png/jpg', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const document = sampleDocument(2, 3);
  const formats = ['pdf', 'pptx', 'png', 'jpg'];

  for (const format of formats) {
    const created = await createExport(baseUrl, format, document);
    const done = await waitForCompletion(baseUrl, created.id);

    assert.equal(done.status, 'completed');
    assert.match(done.artifactUrl, /signature=/);

    const job = exportService.jobs.get(created.id);
    const artifact = await exportService.storage.getObject(job.artifact.key);
    const payload = JSON.parse(artifact.body);

    if (format === 'pdf') {
      const first = payload.pages[0].commands[0].payload;
      assert.equal(first.x, 100);
      assert.equal(first.y, 80);
      assert.equal(first.style.fontFamily, 'Inter');
    }

    if (format === 'pptx') {
      assert.equal(payload.slideCount, document.pages.length);
      assert.equal(payload.slides[1].objects[2].placement.x, 340);
      assert.equal(payload.slides[1].objects[2].content.style.fontWeight, 700);
    }

    if (format === 'png' || format === 'jpg') {
      assert.equal(payload.rasterization.dpi, 300);
      assert.equal(payload.pages.length, document.pages.length);
      assert.equal(payload.pages[1].elements[1].x, 220);
    }
  }
});

test('large exports are queued and can be polled by status endpoint', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const document = sampleDocument(5, 10);
  const created = await createExport(baseUrl, 'pdf', document);

  assert.match(created.status, /queued|processing|completed/);

  const done = await waitForCompletion(baseUrl, created.id);
  assert.equal(done.status, 'completed');

  const fetched = await getExport(baseUrl, created.id);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.id, created.id);
  assert.ok(fetched.body.artifactUrl);
});

test('get endpoint returns 404 for unknown export id', async (t) => {
  const { server, baseUrl } = await startServer();
  t.after(() => server.close());

  const response = await getExport(baseUrl, 'missing');
  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'Export not found');
});
