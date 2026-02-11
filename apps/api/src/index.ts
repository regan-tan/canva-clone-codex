import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

app.listen(4000, () => {
  // eslint-disable-next-line no-console
  console.log('API listening on :4000');
});
