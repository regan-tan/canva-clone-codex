import { ExportService, S3CompatibleStorage } from '../../../packages/exporters/src/index.js';

const storage = new S3CompatibleStorage({
  bucket: process.env.EXPORT_BUCKET ?? 'canva-clone-exports',
  endpoint: process.env.S3_ENDPOINT ?? 'https://s3.local',
  signingSecret: process.env.S3_SIGNING_SECRET ?? 'dev-secret',
});

export const exportService = new ExportService({
  storage,
  asyncThresholdElements: Number(process.env.EXPORT_ASYNC_THRESHOLD ?? 20),
});

function jsonResponse(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) return {};
  return JSON.parse(body);
}

export async function handleCreateExport(req, res) {
  try {
    const body = await parseJsonBody(req);
    const result = exportService.createExport({
      document: body.document,
      format: body.format,
    });

    jsonResponse(res, 202, result);
  } catch (error) {
    jsonResponse(res, 400, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function handleGetExport(_req, res, id) {
  const result = exportService.getExport(id);

  if (!result) {
    jsonResponse(res, 404, { error: 'Export not found' });
    return;
  }

  jsonResponse(res, 200, result);
}
