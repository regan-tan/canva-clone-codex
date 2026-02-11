import crypto from 'node:crypto';

export class S3CompatibleStorage {
  constructor({ bucket = 'exports', endpoint = 'https://s3.local', signingSecret = 'dev-secret' } = {}) {
    this.bucket = bucket;
    this.endpoint = endpoint.replace(/\/$/, '');
    this.signingSecret = signingSecret;
    this.objects = new Map();
  }

  async putObject(key, body, contentType = 'application/json') {
    this.objects.set(key, {
      body: typeof body === 'string' ? body : JSON.stringify(body),
      contentType,
      storedAt: new Date().toISOString(),
    });
    return { bucket: this.bucket, key };
  }

  async getObject(key) {
    return this.objects.get(key) ?? null;
  }

  getSignedUrl(key, expiresInSeconds = 3600) {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const basePath = `/${this.bucket}/${key}`;
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(`${basePath}:${expires}`)
      .digest('hex');

    return `${this.endpoint}${basePath}?expires=${expires}&signature=${signature}`;
  }
}
