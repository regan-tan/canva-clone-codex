import crypto from 'node:crypto';
import { serializeDocument } from './serializers.js';
import { SUPPORTED_FORMATS } from './types.js';

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export class ExportService {
  constructor({ storage, asyncThresholdElements = 20 } = {}) {
    this.storage = storage;
    this.asyncThresholdElements = asyncThresholdElements;
    this.jobs = new Map();
    this.queue = [];
    this.processing = false;
  }

  createExport({ document, format }) {
    if (!SUPPORTED_FORMATS.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    const id = makeId('exp');
    const elementCount = document.pages.reduce((count, page) => count + page.elements.length, 0);
    const isAsync = elementCount >= this.asyncThresholdElements;

    const job = {
      id,
      format,
      status: isAsync ? 'queued' : 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elementCount,
      document,
      artifact: null,
      error: null,
    };

    this.jobs.set(id, job);

    if (isAsync) {
      this.queue.push(id);
      queueMicrotask(() => this.#drainQueue());
    } else {
      this.#executeJob(id);
    }

    return this.#publicJob(job);
  }

  getExport(id) {
    const job = this.jobs.get(id);
    if (!job) return null;
    return this.#publicJob(job);
  }

  async #drainQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length) {
      const id = this.queue.shift();
      // eslint-disable-next-line no-await-in-loop
      await this.#executeJob(id);
    }

    this.processing = false;
  }

  async #executeJob(id) {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = 'processing';
    job.updatedAt = new Date().toISOString();

    try {
      const payload = serializeDocument(job.document, job.format);
      const key = `documents/${job.document.id}/${id}.${job.format}.json`;
      await this.storage.putObject(key, payload, 'application/json');
      job.artifact = {
        key,
        url: this.storage.getSignedUrl(key),
      };
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
    }

    job.updatedAt = new Date().toISOString();
  }

  #publicJob(job) {
    return {
      id: job.id,
      format: job.format,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      artifactUrl: job.artifact?.url ?? null,
      error: job.error,
    };
  }
}
